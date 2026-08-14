import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ImcEvolutionChart } from '@/components/imc-evolution-chart'
import { ImcEvolutionDateFilter } from '@/components/imc-evolution-date-filter'
import {
  toImcEvolutionPoints,
  type ImcDateRange,
  type ImcEvolutionPoint,
} from '@/lib/imc-evolution'
import type { Assessment } from '@/types/assessment'

type ImcEvolutionPanelProps = {
  title: string
  studentName: string
  assessments: Assessment[]
  filterPath: string
  dateRange?: ImcDateRange
  backHref?: string
  backLabel?: string
  subtitle?: string
}

export function ImcEvolutionPanel({
  title,
  studentName,
  assessments,
  filterPath,
  dateRange = {},
  backHref,
  backLabel = 'Voltar',
  subtitle,
}: ImcEvolutionPanelProps) {
  const points = toImcEvolutionPoints(assessments)
  const hasDateFilter = Boolean(dateRange.from || dateRange.to)

  return (
    <section style={styles.section}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Evolução de IMC</p>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.meta}>
            Aluno: <strong>{studentName}</strong>
            {subtitle ? ` · ${subtitle}` : null}
          </p>
        </div>
        {backHref ? (
          <Link href={backHref} style={styles.backLink}>
            {backLabel}
          </Link>
        ) : null}
      </header>

      <ImcEvolutionDateFilter
        pathname={filterPath}
        from={dateRange.from}
        to={dateRange.to}
      />

      {points.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>
            {hasDateFilter
              ? 'Nenhuma avaliação neste período'
              : 'Ainda não há avaliações'}
          </p>
          <p style={styles.emptyText}>
            {hasDateFilter
              ? 'Ajuste a data inicial e a data final ou limpe o filtro para ver mais resultados.'
              : 'Quando houver medições registradas, o gráfico de evolução aparece aqui.'}
          </p>
        </div>
      ) : (
        <>
          <div style={styles.chartCard}>
            <ImcEvolutionChart points={points} />
          </div>
          <AssessmentsSummaryTable points={points} />
        </>
      )}
    </section>
  )
}

function AssessmentsSummaryTable({ points }: { points: ImcEvolutionPoint[] }) {
  const newestFirst = [...points].reverse()

  return (
    <div style={styles.tableWrap}>
      <h2 style={styles.tableTitle}>Histórico de medições</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>IMC</th>
            <th style={styles.th}>Classificação</th>
            <th style={styles.th}>Peso</th>
            <th style={styles.th}>Altura</th>
            <th style={styles.th}>Avaliador</th>
          </tr>
        </thead>
        <tbody>
          {newestFirst.map((point) => (
            <tr key={point.id}>
              <td style={styles.td}>{point.dateLabel}</td>
              <td style={styles.td}>{point.imc.toFixed(1)}</td>
              <td style={styles.td}>{point.classification}</td>
              <td style={styles.td}>{point.weight.toFixed(1)} kg</td>
              <td style={styles.td}>{point.height.toFixed(2)} m</td>
              <td style={styles.td}>{point.evaluatorName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#1B1248',
  },
  title: {
    margin: '0.35rem 0 0.25rem',
    fontSize: '1.5rem',
    color: '#100A2C',
  },
  meta: {
    margin: 0,
    color: '#6B6090',
    fontSize: '0.95rem',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.45rem 0.85rem',
    border: '1px solid #C2BBD9',
    borderRadius: '6px',
    color: '#1B1248',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    background: '#FFFFFF',
  },
  empty: {
    background: '#FFFFFF',
    border: '1px solid #E0DCEC',
    borderLeft: '4px solid #221656',
    padding: '1.5rem',
  },
  emptyTitle: {
    margin: '0 0 0.35rem',
    fontWeight: 600,
    color: '#100A2C',
  },
  emptyText: {
    margin: 0,
    color: '#6B6090',
  },
  chartCard: {
    background: '#FFFFFF',
    border: '1px solid #E0DCEC',
    padding: '1rem',
  },
  tableWrap: {
    background: '#FFFFFF',
    border: '1px solid #E0DCEC',
    padding: '1rem',
    overflowX: 'auto',
  },
  tableTitle: {
    margin: '0 0 0.75rem',
    fontSize: '1rem',
    color: '#100A2C',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.5rem 0.4rem',
    borderBottom: '1px solid #E0DCEC',
    color: '#1B1248',
    fontWeight: 600,
  },
  td: {
    padding: '0.55rem 0.4rem',
    borderBottom: '1px solid #F2F0F8',
    color: '#100A2C',
  },
}
