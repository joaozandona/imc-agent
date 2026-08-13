import { AxiosError } from 'axios'

const apiErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Usuario ou senha inválidos',
  INACTIVE_USER: 'Usuario inativo',
  VALIDATION_ERROR: 'Dados inválidos',
  UNAUTHENTICATED: 'Sessão não autenticada',
  FORBIDDEN: 'Acesso negado',
  TOKEN_MISSING: 'Token não informado',
  TOKEN_INVALID: 'Token inválido ou expirado',
  REFRESH_TOKEN_INVALID: 'Sessão expirada. Faça login novamente',
  USER_NOT_FOUND: 'Usuario não encontrado',
  USERNAME_TAKEN: 'Usuario já existe',
  USER_HAS_ASSESSMENTS: 'Não é possível excluir usuario com avaliações vinculadas',
  STUDENT_NOT_FOUND: 'Aluno não encontrado',
  STUDENT_INACTIVE: 'Não é possível avaliar aluno inativo',
  ASSESSMENT_NOT_FOUND: 'Avaliação não encontrada',
  SERVER_MISCONFIGURED: 'Erro de configuração do servidor',
  INTERNAL_ERROR: 'Erro interno do servidor',
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
) {
  if (error instanceof AxiosError) {
    const code = error.response?.data?.code as string | undefined

    if (code && apiErrorMessages[code]) {
      return apiErrorMessages[code]
    }
  }

  return fallback
}
