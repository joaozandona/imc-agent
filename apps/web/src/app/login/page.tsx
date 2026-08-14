import type { Metadata } from 'next'
import { LoginPageShell } from './login-page-shell'

export const metadata: Metadata = {
  title: 'Entrar | IMC',
  description: 'Acesso ao painel de IMC da academia',
}

export default function LoginPage() {
  return <LoginPageShell />
}
