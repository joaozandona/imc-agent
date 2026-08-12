import { describe, expect, it } from 'vitest'
import { ImcClassification, calculateImc, classifyImc } from '../src/imc'

describe('calculateImc', () => {
  it('calculates BMI rounded to 1 decimal', () => {
    // 70 / (1.75 * 1.75) = 22.857... → 22.9
    expect(calculateImc(1.75, 70)).toBe(22.9)
  })

  it('rejects invalid height or weight', () => {
    expect(() => calculateImc(0, 70)).toThrow('Height must be greater than zero')
    expect(() => calculateImc(1.75, 0)).toThrow('Weight must be greater than zero')
  })
})

describe('classifyImc', () => {
  it('classifies boundary values from the PDF table', () => {
    expect(classifyImc(18.4)).toBe(ImcClassification.UNDERWEIGHT)
    expect(classifyImc(18.5)).toBe(ImcClassification.NORMAL)
    expect(classifyImc(24.9)).toBe(ImcClassification.NORMAL)
    expect(classifyImc(25)).toBe(ImcClassification.OVERWEIGHT)
    expect(classifyImc(29.9)).toBe(ImcClassification.OVERWEIGHT)
    expect(classifyImc(30)).toBe(ImcClassification.OBESITY_I)
    expect(classifyImc(34.9)).toBe(ImcClassification.OBESITY_I)
    expect(classifyImc(35)).toBe(ImcClassification.OBESITY_II)
    expect(classifyImc(39.9)).toBe(ImcClassification.OBESITY_II)
    expect(classifyImc(40)).toBe(ImcClassification.OBESITY_III)
  })
})
