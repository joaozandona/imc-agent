'use client'

import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ListPagination } from '@/components/list-pagination'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { listAuditLogs } from '@/lib/audit-logs-api'
import type { AuditLog } from '@/types/audit-log'
import type { PaginatedResponse } from '@/types/pagination'
import { DEFAULT_PAGE_SIZE } from '@/types/pagination'

type AuditLogsListProps = {
  initialData: PaginatedResponse<AuditLog>
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR')
}

function formatMetadata(metadata: unknown) {
  if (metadata === null || metadata === undefined) {
    return '—'
  }

  try {
    return JSON.stringify(metadata, null, 2)
  } catch {
    return String(metadata)
  }
}

export function AuditLogsList({ initialData }: AuditLogsListProps) {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [actorFilter, setActorFilter] = useState('')

  const filters = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      action: actionFilter.trim() || undefined,
      entity: entityFilter.trim() || undefined,
      actorUsername: actorFilter.trim() || undefined,
    }),
    [page, actionFilter, entityFilter, actorFilter],
  )

  const isDefault =
    filters.page === 1 &&
    !filters.action &&
    !filters.entity &&
    !filters.actorUsername

  const logsQuery = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => listAuditLogs(filters),
    initialData: isDefault ? initialData : undefined,
    placeholderData: keepPreviousData,
  })

  const logs = logsQuery.data?.data ?? []
  const meta = logsQuery.data?.meta

  return (
    <Stack gap={6}>
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={4}
        direction={{ base: 'column', md: 'row' }}
      >
        <Heading size="lg">Logs de auditoria</Heading>
      </Flex>

      <Flex gap={3} direction={{ base: 'column', md: 'row' }} flexWrap="wrap">
        <Input
          placeholder="Ação (ex: user.create)"
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value)
            setPage(1)
          }}
          maxW={{ md: '220px' }}
        />
        <Input
          placeholder="Entidade (ex: user)"
          value={entityFilter}
          onChange={(event) => {
            setEntityFilter(event.target.value)
            setPage(1)
          }}
          maxW={{ md: '180px' }}
        />
        <Input
          placeholder="Usuário que executou"
          value={actorFilter}
          onChange={(event) => {
            setActorFilter(event.target.value)
            setPage(1)
          }}
          maxW={{ md: '220px' }}
        />
        {(actionFilter || entityFilter || actorFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setActionFilter('')
              setEntityFilter('')
              setActorFilter('')
              setPage(1)
            }}
          >
            Limpar
          </Button>
        )}
      </Flex>

      {logsQuery.isError ? (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>
            {getApiErrorMessage(
              logsQuery.error,
              'Não foi possível carregar os logs.',
            )}
          </Alert.Title>
        </Alert.Root>
      ) : null}

      {logsQuery.isLoading ? (
        <Spinner size="lg" color="brand.solid" />
      ) : (
        <Box overflowX="auto" bg="white" borderRadius="md" borderWidth="1px">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Data</Table.ColumnHeader>
                <Table.ColumnHeader>Autor</Table.ColumnHeader>
                <Table.ColumnHeader>Ação</Table.ColumnHeader>
                <Table.ColumnHeader>Entidade</Table.ColumnHeader>
                <Table.ColumnHeader>Detalhes</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {logs.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <Text color="fg.muted" py={4}>
                      Nenhum log encontrado.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                logs.map((log) => (
                  <Table.Row key={log.id}>
                    <Table.Cell whiteSpace="nowrap">
                      {formatDateTime(log.createdAt)}
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontWeight="medium">{log.actorName}</Text>
                      <Text fontSize="xs" color="fg.muted">
                        {log.actorUsername}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>{log.action}</Table.Cell>
                    <Table.Cell>
                      <Text>{log.entity}</Text>
                      <Text fontSize="xs" color="fg.muted">
                        {log.entityId}
                      </Text>
                    </Table.Cell>
                    <Table.Cell minW="260px" maxW="420px">
                      <Box
                        as="pre"
                        fontSize="xs"
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                        m={0}
                        fontFamily="mono"
                      >
                        {formatMetadata(log.metadata)}
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {meta ? <ListPagination meta={meta} onPageChange={setPage} /> : null}
    </Stack>
  )
}
