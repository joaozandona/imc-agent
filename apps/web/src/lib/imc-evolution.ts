import type { Assessment } from '@/types/assessment'

export type ImcEvolutionPoint = {
  id: string
  date: string
  dateLabel: string
  imc: number
  weight: number
  height: number
  classification: string
  evaluatorName: string
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
        year: '2-digit',
      }),
      imc: assessment.imc,
      weight: assessment.weight,
      height: assessment.height,
      classification: assessment.classification,
      evaluatorName: assessment.evaluator.name,
    }))
}
