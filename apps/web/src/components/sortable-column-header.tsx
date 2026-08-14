'use client'

import { Table } from '@chakra-ui/react'

type SortOrder = 'asc' | 'desc'

type SortableColumnHeaderProps<T extends string> = {
  label: string
  column: T
  sortBy: T
  sortOrder: SortOrder
  onSort: (column: T) => void
  textAlign?: 'start' | 'end' | 'center'
}

export function SortableColumnHeader<T extends string>({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
  textAlign = 'start',
}: SortableColumnHeaderProps<T>) {
  const isActive = sortBy === column

  return (
    <Table.ColumnHeader
      textAlign={textAlign}
      cursor="pointer"
      userSelect="none"
      onClick={() => onSort(column)}
      color={isActive ? 'brand.fg' : undefined}
      title={`Ordenar por ${label}`}
    >
      {label}
      {isActive ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
    </Table.ColumnHeader>
  )
}

export function toggleSortOrder(
  currentSortBy: string,
  currentSortOrder: SortOrder,
  nextSortBy: string,
): { sortBy: string; sortOrder: SortOrder } {
  if (currentSortBy === nextSortBy) {
    return {
      sortBy: currentSortBy,
      sortOrder: currentSortOrder === 'asc' ? 'desc' : 'asc',
    }
  }

  return {
    sortBy: nextSortBy,
    sortOrder: nextSortBy === 'createdAt' ? 'desc' : 'asc',
  }
}
