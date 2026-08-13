'use client'

import { Button, HStack, Text } from '@chakra-ui/react'
import type { PaginationMeta } from '@/types/pagination'

type ListPaginationProps = {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function ListPagination({ meta, onPageChange }: ListPaginationProps) {
  if (meta.totalPages <= 1) {
    return null
  }

  return (
    <HStack justify="space-between" gap={4} flexWrap="wrap">
      <Text fontSize="sm" color="fg.muted">
        Página {meta.page} de {meta.totalPages} ({meta.total} itens)
      </Text>
      <HStack gap={2}>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Próxima
        </Button>
      </HStack>
    </HStack>
  )
}
