import type { Assessment } from '@/types/assessment'

export type ImcEvolutionPoint = {
  id: string
  date: string
  dateLabel: string
  axisLabel: string
  imc: number
  weight: number
  height: number
  classification: string
  evaluatorName: string
}

export type ImcDateRange = {
  from?: string
  to?: string
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function parseDateInput(value?: string) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function filterAssessmentsByDateRange(
  assessments: Assessment[],
  range: ImcDateRange = {},
) {
  const fromDate = parseDateInput(range.from)
  const toDate = parseDateInput(range.to)

  if (!fromDate && !toDate) {
    return assessments
  }

  return assessments.filter((assessment) => {
    const createdAt = new Date(assessment.createdAt)

    if (fromDate && createdAt < startOfDay(fromDate)) {
      return false
    }

    if (toDate && createdAt > endOfDay(toDate)) {
      return false
    }

    return true
  })
}

export function toImcEvolutionPoints(
  assessments: Assessment[],
): ImcEvolutionPoint[] {
  return [...assessments]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((assessment) => ({
      id: assessment.id,
      date: assessment.createdAt,
      dateLabel: new Date(assessment.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      axisLabel: new Date(assessment.createdAt).toLocaleDateString('pt-BR', {
        month: '2-digit',
        year: '2-digit',
      }),
      imc: assessment.imc,
      weight: assessment.weight,
      height: assessment.height,
      classification: assessment.classification,
      evaluatorName: assessment.evaluator.name,
    }))
}
