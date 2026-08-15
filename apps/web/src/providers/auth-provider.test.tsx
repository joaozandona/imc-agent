import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from './auth-provider'

function Probe() {
  const { user, setUser, isAuthenticated } = useAuth()

  return (
    <div>
      <p data-testid="auth-state">{isAuthenticated ? 'yes' : 'no'}</p>
      <p data-testid="username">{user?.username ?? 'none'}</p>
      <button
        type="button"
        onClick={() =>
          setUser({
            id: '1',
            name: 'Admin',
            username: 'admin',
            role: 'admin',
            status: 'ativo',
          })
        }
      >
        set-admin
      </button>
      <button type="button" onClick={() => setUser(null)}>
        clear
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  it('exposes and updates the session user in client state', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider initialUser={null}>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('auth-state')).toHaveTextContent('no')
    expect(screen.getByTestId('username')).toHaveTextContent('none')

    await user.click(screen.getByRole('button', { name: 'set-admin' }))

    expect(screen.getByTestId('auth-state')).toHaveTextContent('yes')
    expect(screen.getByTestId('username')).toHaveTextContent('admin')

    await user.click(screen.getByRole('button', { name: 'clear' }))

    expect(screen.getByTestId('auth-state')).toHaveTextContent('no')
  })
})
