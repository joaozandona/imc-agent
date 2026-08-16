# Continuous Integration (GitHub Actions)

On every push to `main` and every pull request, GitHub Actions:

1. Installs dependencies (`npm ci`)
2. Builds `@imc/shared` (`dist/` is gitignored; API imports need it)
3. Runs unit/integration tests: shared → API → web
4. Builds API and web (shared already built)

Workflow file: `.github/workflows/ci.yml`

k6 load tests are **not** part of CI (they need a running API and take longer). Run them locally — see `k6/README.md`.
