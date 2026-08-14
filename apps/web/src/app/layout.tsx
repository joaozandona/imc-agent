import type { Metadata } from 'next'
import { getUserFromCookies } from '@/lib/auth-cookies'
import { AppProviders } from '@/providers/app-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'IMC | Painel da academia',
  description: 'Acompanhamento de avaliações de IMC',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialUser = await getUserFromCookies()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders initialUser={initialUser}>{children}</AppProviders>
      </body>
    </html>
  )
}
