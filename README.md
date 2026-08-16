# IMC — sistema de avaliação para academia

Monorepo full-stack para cadastro de usuários (admin, professor e aluno), registro de avaliações de IMC (altura, peso, classificação) e acompanhamento da evolução do aluno.

Interface em português. Código e commits em inglês (Conventional Commits).

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Monorepo | npm workspaces (`apps/*`, `packages/*`) |
| API | TypeScript, Express, TypeORM (migrations), SQLite (`better-sqlite3`), Zod, JWT, Helmet, CORS, express-rate-limit |
| Web | TypeScript, Next.js (App Router), React, Chakra UI, TanStack Query, React Hook Form, Axios, Zod, Jose |
| Shared | Pacote `@imc/shared` — cálculo e classificação de IMC |
| Testes | Vitest (shared, API, web), Supertest (API), Testing Library (web), k6 (carga) |
| Deploy local / prod-like | Docker Compose (web público, API só na rede interna) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) — testes + build |

## Arquitetura

```text
Browser
  └─► Next.js (:3000)          BFF + UI (cookies httpOnly)
        ├─ /api/auth/*         login / refresh / logout
        └─ /api/backend/*      proxy allowlisted → API
              └─► Express API   (dev: :3333 | Docker: só rede interna)
                    └─ SQLite
```

Pontos importantes:

- O browser não precisa falar com a API diretamente no fluxo normal; auth e dados passam pelo Next.
- O proxy `/api/backend` só encaminha `users`, `assessments` e `audit-logs` (não expõe `/login` pelo proxy).
- Sessão SSR no Next valida o **access JWT** (assinatura), não um JSON de perfil sem assinatura.
- Em Docker a porta da API **não é publicada**; o web usa `API_URL=http://api:3333`.

## Perfis

| Perfil | Capacidades (resumo) |
|--------|----------------------|
| **Admin** | Usuários, avaliações, exclusões, audit log, vínculos professor–aluno |
| **Professor** | Usuários (com regras de vínculo), avaliações dos alunos vinculados |
| **Aluno** | Consulta das próprias avaliações / evolução |

### Regras de domínio (resumo)

Detalhe e edge cases estão na API e nos testes; o essencial:

- Professor só opera sobre **alunos vinculados** (avaliações, e também senha/status — ou vincula na mesma requisição com `linkMyself`).
- Professor pode **criar e editar** avaliações desses alunos (não precisa ser o avaliador original).
- Aluno só consulta as **próprias** avaliações / evolução.
- Aluno **inativo**: não se criam avaliações; update também é bloqueado (exceto **admin**).
- Só **admin** exclui usuários ou avaliações e consulta o **audit log**.
- Login responde de forma genérica (não distingue usuário inexistente, inativo ou senha inválida para o cliente).

## Pré-requisitos

- **Node.js 22**
- npm (workspaces)
- Para Docker: Docker Desktop (ou Engine + plugin Compose)
- Para carga: [k6](https://grafana.com/docs/k6/latest/)

## Desenvolvimento local

### 1. Instalar

Na raiz do monorepo, com `package-lock.json` presente:

```bash
npm ci
```

Alternativa: `npm install` (também funciona; pode alterar o lockfile). Prefira `npm ci` para o mesmo resultado do CI.

### 2. Variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

- `apps/api/.env` e `apps/web/.env` devem usar o **mesmo** `JWT_SECRET`.
- No web, `API_URL` aponta para a API (padrão `http://localhost:3333`).
- `JWT_SECRET` é só de servidor — não use prefixo `NEXT_PUBLIC_`.

### 3. Build do shared

`@imc/shared` publica `dist/` (gitignored). Em clone limpo, compile antes de subir a API ou rodar os testes dela:

```bash
npm run build -w @imc/shared
```

O `npm run build` da raiz também builda o shared (junto com api e web).
### 4. Migrations e seeds

Com a pasta `apps/api` configurada:

```bash
npm run migration:run -w @imc/api
npm run seed:admin -w @imc/api
npm run seed:demo -w @imc/api
```

- `seed:admin` — cria `admin` / `admin123` **somente se ainda não existir**.
- `seed:demo` — professor, aluno vinculado e 24 avaliações mensais (evolução).

### 5. Subir API e web

Em dois terminais, na raiz do monorepo:

```bash
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000  
- API (dev): http://localhost:3333  

### Usuários de demonstração

| Usuário | Senha | Origem |
|---------|--------|--------|
| `admin` | `admin123` | `seed:admin` |
| `professor` | `prof123` | `seed:demo` |
| `aluno` | `aluno123` | `seed:demo` |

## Docker

Documentação detalhada: [`DOCKER.md`](./DOCKER.md).

```bash
cp .env.example .env
# defina um JWT_SECRET forte no .env da raiz
docker compose up --build
```

- App: http://localhost:3000  
- Com `SEED_ADMIN=true` e `SEED_DEMO=true` (padrão no compose), os usuários demo acima são criados no boot.  
- A API **não** fica em `localhost:3333` no Compose (só rede Docker).  
- Dados SQLite: volume `api_data`.

```bash
docker compose down
# apaga o volume do banco:
docker compose down -v
```

## Scripts úteis (raiz)

| Script | Descrição |
|--------|-----------|
| `npm run dev:api` / `dev:web` | Desenvolvimento |
| `npm run build` | Build shared + api + web |
| `npm test` | Testes shared + api + web |
| `npm run test:load:smoke` | k6 smoke |
| `npm run test:load` | k6 carga (listagens, token compartilhado) |
| `npm run test:load:sessions` | k6 multi-sessão (cada VU faz login) |
| `npm run test:load:login` | k6 rajada em `/login` |
| `npm run docker:up` / `docker:down` | Compose |

## Testes

### Automatizados (Vitest)

Em clone limpo, build do shared primeiro (ver passo 3 acima), depois:

```bash
npm test
```

Cobertura inclui, entre outros:

- **shared** — cálculo/classificação de IMC  
- **API** — login, usuários, avaliações, audit, RBAC / vínculos  
- **web** — verificação de JWT de sessão, allowlist do proxy BFF, schema de login, AuthProvider  

### Carga (k6)

Detalhes e variáveis: [`k6/README.md`](./k6/README.md).

A API precisa estar no ar (`npm run dev:api`). No Windows **não** use `-e USERNAME=...` (o SO já define `USERNAME`); use `IMC_LOGIN_USER` / `IMC_LOGIN_PASSWORD` se for sobrescrever credenciais.

Para `test:load:sessions`, o rate limit padrão de login (10 / 15 min) costuma ser insuficiente — suba a API com limite maior, por exemplo no CMD:

```bat
set LOGIN_RATE_LIMIT_MAX=200
npm run dev:api
```

## CI

Workflow em [`.github/workflows/ci.yml`](./.github/workflows/ci.yml): em push/`main` e pull requests, instala com `npm ci`, **builda `@imc/shared`**, roda os testes (shared → API → web) e executa o build do monorepo. k6 não entra no CI.

## Estrutura do repositório

```text
apps/
  api/          Express + TypeORM + SQLite
  web/          Next.js (BFF + UI)
packages/
  shared/       IMC puro (cálculo / classificação)
k6/             Scripts de carga
docker-compose.yml
DOCKER.md
```

## Segurança (resumo)

- Senhas com bcrypt; refresh tokens armazenados como hash  
- Access JWT de curta duração; refresh com rotação  
- Cookies de sessão httpOnly no BFF  
- Rate limit no `POST /login`  
- Proxy BFF com allowlist de paths  
- SSR no Next baseado em JWT verificado (`JWT_SECRET` compartilhado com a API)  
- Resposta de login genérica (sem enumerar usuário inativo vs senha inválida)  

## Licença

ISC (ver `package.json` da raiz).
