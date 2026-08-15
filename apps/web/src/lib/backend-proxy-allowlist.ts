/** Browser-facing API prefixes only. Auth stays on /api/auth/*. */
const ALLOWED_PROXY_ROOTS = new Set(['users', 'assessments', 'audit-logs'])

export function isAllowedProxyPath(path: string[]) {
  if (path.length === 0) return false
  if (path.some((segment) => !segment || segment === '.' || segment === '..')) {
    return false
  }

  return ALLOWED_PROXY_ROOTS.has(path[0])
}
