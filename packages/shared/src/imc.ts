export const ImcClassification = {
  UNDERWEIGHT: 'Abaixo do peso',
  NORMAL: 'Peso normal',
  OVERWEIGHT: 'Sobrepeso',
  OBESITY_I: 'Obesidade grau I',
  OBESITY_II: 'Obesidade grau II',
  OBESITY_III: 'Obesidade grau III',
} as const

export type ImcClassificationLabel =
  (typeof ImcClassification)[keyof typeof ImcClassification]

export function calculateImc(heightMeters: number, weightKg: number): number {
  if (heightMeters <= 0) {
    throw new Error('Height must be greater than zero')
  }

  if (weightKg <= 0) {
    throw new Error('Weight must be greater than zero')
  }

  const imc = weightKg / (heightMeters * heightMeters)
  return Math.round(imc * 10) / 10
}

export function classifyImc(imc: number): ImcClassificationLabel {
  if (imc < 18.5) return ImcClassification.UNDERWEIGHT
  if (imc < 25) return ImcClassification.NORMAL
  if (imc < 30) return ImcClassification.OVERWEIGHT
  if (imc < 35) return ImcClassification.OBESITY_I
  if (imc < 40) return ImcClassification.OBESITY_II
  return ImcClassification.OBESITY_III
}
