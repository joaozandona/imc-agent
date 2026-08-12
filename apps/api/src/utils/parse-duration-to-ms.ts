export function parseDurationToMs(value: string, fallbackMs = 7 * 24 * 60 * 60 * 1000): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim())

  if (!match) {
    return fallbackMs
  }

  const amount = Number(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * multipliers[unit]
}
