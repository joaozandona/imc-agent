'use client'

import { useMemo, useState } from 'react'
import type { ImcEvolutionPoint } from '@/lib/imc-evolution'

type ImcEvolutionChartProps = {
  points: ImcEvolutionPoint[]
}

const WIDTH = 720
const HEIGHT = 300
const PADDING = { top: 36, right: 36, bottom: 48, left: 56 }

export function ImcEvolutionChart({ points }: ImcEvolutionChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const layout = useMemo(() => {
    if (points.length === 0) {
      return null
    }

    const imcValues = points.map((point) => point.imc)
    const minImc = Math.min(...imcValues, 15)
    const maxImc = Math.max(...imcValues, 40)
    const range = Math.max(maxImc - minImc, 1)
    const plotWidth = WIDTH - PADDING.left - PADDING.right
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

    const xForIndex = (index: number) => {
      if (points.length === 1) {
        return PADDING.left + plotWidth / 2
      }
      return PADDING.left + (index / (points.length - 1)) * plotWidth
    }

    const yForImc = (imc: number) =>
      PADDING.top + ((maxImc - imc) / range) * plotHeight

    const linePath = points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command} ${xForIndex(index).toFixed(1)} ${yForImc(point.imc).toFixed(1)}`
      })
      .join(' ')

    const yTicks = [minImc, minImc + range / 2, maxImc]

    const plotted = points.map((point, index) => ({
      point,
      x: xForIndex(index),
      y: yForImc(point.imc),
    }))

    return { minImc, maxImc, plotWidth, plotHeight, linePath, yTicks, yForImc, plotted }
  }, [points])

  if (!layout) {
    return null
  }

  const hovered = layout.plotted.find((item) => item.point.id === hoveredId)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Gráfico de evolução do IMC ao longo do tempo"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <text
          x={PADDING.left}
          y={18}
          textAnchor="start"
          fontSize="12"
          fontWeight="600"
          fill="#1B1248"
        >
          IMC
        </text>

        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={layout.plotWidth}
          height={layout.plotHeight}
          fill="#F8F7FC"
          stroke="#E0DCEC"
        />

        {layout.yTicks.map((tick) => {
          const y = layout.yForImc(tick)
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + layout.plotWidth}
                y2={y}
                stroke="#E0DCEC"
                strokeDasharray="4 4"
              />
              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6B6090"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          )
        })}

        <path
          d={layout.linePath}
          fill="none"
          stroke="#221656"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {layout.plotted.map(({ point, x, y }, index) => {
          const active = hoveredId === point.id
          return (
            <g
              key={point.id}
              onMouseEnter={() => setHoveredId(point.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={x} cy={y} r="14" fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={active ? 6.5 : 5}
                fill="#221656"
              />
              <circle cx={x} cy={y} r={active ? 3 : 2.5} fill="#FFFFFF" />
              <text
                x={x}
                y={HEIGHT - 16}
                textAnchor={
                  index === 0
                    ? 'start'
                    : index === layout.plotted.length - 1
                      ? 'end'
                      : 'middle'
                }
                fontSize="10"
                fill="#6B6090"
              >
                {point.dateLabel}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered ? (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: '#FFFFFF',
            color: '#100A2C',
            padding: '0.65rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid #E0DCEC',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            pointerEvents: 'none',
            boxShadow: '0 6px 16px rgba(34, 22, 86, 0.12)',
            minWidth: '160px',
            zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
            {hovered.point.classification}
          </div>
          <div>IMC: {hovered.point.imc.toFixed(1)}</div>
          <div>Peso: {hovered.point.weight.toFixed(1)} kg</div>
          <div>Altura: {hovered.point.height.toFixed(2)} m</div>
        </div>
      ) : null}
    </div>
  )
}
