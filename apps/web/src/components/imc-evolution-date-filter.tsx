'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

type ImcEvolutionDateFilterProps = {
  pathname: string
  from?: string
  to?: string
}

export function ImcEvolutionDateFilter({
  pathname,
  from = '',
  to = '',
}: ImcEvolutionDateFilterProps) {
  const router = useRouter()
  const [fromValue, setFromValue] = useState(from)
  const [toValue, setToValue] = useState(to)

  useEffect(() => {
    setFromValue(from)
    setToValue(to)
  }, [from, to])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (fromValue) params.set('from', fromValue)
    if (toValue) params.set('to', toValue)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const clearFilters = () => {
    setFromValue('')
    setToValue('')
    router.push(pathname)
  }

  const hasFilters = Boolean(from || to)

  return (
    <form
      style={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        applyFilters()
      }}
    >
      <label style={styles.field}>
        <span style={styles.label}>Data inicial</span>
        <input
          type="date"
          value={fromValue}
          onChange={(event) => setFromValue(event.target.value)}
          style={styles.input}
        />
      </label>

      <label style={styles.field}>
        <span style={styles.label}>Data final</span>
        <input
          type="date"
          value={toValue}
          onChange={(event) => setToValue(event.target.value)}
          style={styles.input}
        />
      </label>

      <div style={styles.actions}>
        <button type="submit" style={styles.primaryButton}>
          Filtrar
        </button>
        {hasFilters ? (
          <button type="button" onClick={clearFilters} style={styles.secondaryButton}>
            Limpar
          </button>
        ) : null}
      </div>
    </form>
  )
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.85rem',
    alignItems: 'flex-end',
    background: '#FFFFFF',
    border: '1px solid #E0DCEC',
    padding: '0.9rem 1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    minWidth: '160px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#1B1248',
  },
  input: {
    padding: '0.45rem 0.55rem',
    border: '1px solid #C2BBD9',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#100A2C',
    background: '#FFFFFF',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '0.5rem 0.9rem',
    border: 'none',
    borderRadius: '6px',
    background: '#221656',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '0.5rem 0.9rem',
    border: '1px solid #C2BBD9',
    borderRadius: '6px',
    background: '#FFFFFF',
    color: '#1B1248',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
}
