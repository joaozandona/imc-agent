import { describe, expect, it } from 'vitest'
import { isAllowedProxyPath } from './backend-proxy-allowlist'

describe('isAllowedProxyPath', () => {
  it('allows only browser data API roots', () => {
    expect(isAllowedProxyPath(['users'])).toBe(true)
    expect(isAllowedProxyPath(['users', 'abc'])).toBe(true)
    expect(isAllowedProxyPath(['assessments', '1', 'edit'])).toBe(true)
    expect(isAllowedProxyPath(['audit-logs'])).toBe(true)
  })

  it('blocks auth and unknown paths', () => {
    expect(isAllowedProxyPath(['login'])).toBe(false)
    expect(isAllowedProxyPath(['login', 'refresh'])).toBe(false)
    expect(isAllowedProxyPath([''])).toBe(false)
    expect(isAllowedProxyPath([])).toBe(false)
    expect(isAllowedProxyPath(['health'])).toBe(false)
  })

  it('blocks path traversal segments', () => {
    expect(isAllowedProxyPath(['users', '..', 'login'])).toBe(false)
    expect(isAllowedProxyPath(['.', 'users'])).toBe(false)
  })
})
