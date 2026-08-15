'use client'

import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ListPagination } from '@/components/list-pagination'
import {
  SortableColumnHeader,
  toggleSortOrder,
} from '@/components/sortable-column-header'
import { StudentCombobox } from '@/components/student-combobox'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
  deleteAssessment,
  listAssessments,
  type Assessment,
  type AssessmentSortBy,
} from '@/lib/assessments-api'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { listUsers } from '@/lib/users-api'
import type { PaginatedResponse } from '@/types/pagination'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  SELECT_PAGE_SIZE,
  type SortOrder,
} from '@/types/pagination'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

type AssessmentsListProps = {
  initialData: PaginatedResponse<Assessment>
}

function isDefaultFilters(filters: {
  page: number
  studentId?: string
  idUsuarioAvaliacao?: string
  sortBy: AssessmentSortBy
  sortOrder: SortOrder
}) {
  return (
    filters.page === 1 &&
    !filters.studentId &&
    !filters.idUsuarioAvaliacao &&
    filters.sortBy === DEFAULT_SORT_BY &&
    filters.sortOrder === DEFAULT_SORT_ORDER
  )
}

export function AssessmentsList({ initialData }: AssessmentsListProps) {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const [studentId, setStudentId] = useState('')
  const [studentFilterKey, setStudentFilterKey] = useState(0)
  const [evaluatorId, setEvaluatorId] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<AssessmentSortBy>(DEFAULT_SORT_BY)
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'admin'
  const isProfessor = currentUser?.role === 'professor'
  const isAluno = currentUser?.role === 'aluno'
  const canManage = isAdmin || isProfessor

  const usersQuery = useQuery({
    queryKey: ['users', { page: 1, limit: SELECT_PAGE_SIZE, purpose: 'filters' }],
    queryFn: () => listUsers({ page: 1, limit: SELECT_PAGE_SIZE }),
    enabled: canManage,
  })

  const filters = useMemo(
    () => ({
      studentId: studentId || undefined,
      idUsuarioAvaliacao: isAdmin && evaluatorId ? evaluatorId : undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
      sortBy,
      sortOrder,
    }),
    [studentId, evaluatorId, isAdmin, page, sortBy, sortOrder],
  )

  const assessmentsQuery = useQuery({
    queryKey: ['assessments', filters],
    queryFn: () => listAssessments(filters),
    initialData: isDefaultFilters(filters) ? initialData : undefined,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAssessment,
    onSuccess: async () => {
      setActionError(null)
      setPendingDeleteId(null)
      await queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Não foi possível excluir a avaliação.'),
      )
      setPendingDeleteId(null)
    },
  })

  const students = useMemo(() => {
    const all = (usersQuery.data?.data ?? []).filter((user) => user.role === 'aluno')
    if (isProfessor) {
      return all.filter((user) => user.isLinked)
    }
    return all
  }, [usersQuery.data, isProfessor])

  const evaluators = useMemo(
    () =>
      (usersQuery.data?.data ?? []).filter(
        (user) => user.role === 'admin' || user.role === 'professor',
      ),
    [usersQuery.data],
  )

  const assessments = assessmentsQuery.data?.data ?? []
  const meta = assessmentsQuery.data?.meta

  const clearFilters = () => {
    setStudentId('')
    setEvaluatorId('')
    setStudentFilterKey((key) => key + 1)
    setPage(1)
  }

  const handleStudentIdChange = (id: string) => {
    setStudentId(id)
    setPage(1)
  }

  const handleSort = (column: AssessmentSortBy) => {
    const next = toggleSortOrder(sortBy, sortOrder, column)
    setSortBy(next.sortBy as AssessmentSortBy)
    setSortOrder(next.sortOrder)
    setPage(1)
  }

  if (assessmentsQuery.isLoading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner size="lg" color="brand.solid" />
      </Flex>
    )
  }

  if (assessmentsQuery.isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>
          {getApiErrorMessage(
            assessmentsQuery.error,
            'Não foi possível carregar as avaliações.',
          )}
        </Alert.Title>
      </Alert.Root>
    )
  }

  return (
    <Stack gap={6}>
      <Flex
        align={{ base: 'stretch', sm: 'center' }}
        justify="space-between"
        gap={4}
        direction={{ base: 'column', sm: 'row' }}
      >
        <Box>
          <Heading size="lg" color="brand.fg">
            Avaliações
          </Heading>
          <Text color="fg.muted" mt={1}>
            Acompanhe o histórico de IMC
            {isAluno ? ' das suas avaliações.' : ' dos alunos.'}
          </Text>
        </Box>
        {canManage ? (
          <Button asChild colorPalette="brand">
            <Link href="/assessments/new">Nova avaliação</Link>
          </Button>
        ) : null}
      </Flex>

      {canManage ? (
        <HStack
          gap={4}
          align="flex-end"
          flexWrap="wrap"
          bg="white"
          borderWidth="1px"
          borderColor="blackAlpha.200"
          p={4}
        >
          <Box minW="240px" flex="1">
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Aluno
            </Text>
            <StudentCombobox
              students={students}
              value={studentId}
              onChange={handleStudentIdChange}
              resetKey={studentFilterKey}
            />
          </Box>

          {isAdmin ? (
            <Box minW="200px" flex="1">
              <Text fontSize="sm" mb={1} fontWeight="medium">
                Avaliador
              </Text>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={evaluatorId}
                  onChange={(event) => {
                    setEvaluatorId(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">Todos</option>
                  {evaluators.map((evaluator) => (
                    <option key={evaluator.id} value={evaluator.id}>
                      {evaluator.name}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
          ) : null}

          {(studentId || evaluatorId) && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </HStack>
      ) : null}

      {actionError ? (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>{actionError}</Alert.Title>
        </Alert.Root>
      ) : null}

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="blackAlpha.200"
        overflowX="auto"
      >
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <SortableColumnHeader
                label="Data"
                column="createdAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              {!isAluno ? (
                <SortableColumnHeader
                  label="Aluno"
                  column="student"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              ) : null}
              {!isAluno ? (
                <SortableColumnHeader
                  label="Avaliador"
                  column="evaluator"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              ) : null}
              <SortableColumnHeader
                label="Altura"
                column="height"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableColumnHeader
                label="Peso"
                column="weight"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableColumnHeader
                label="IMC"
                column="imc"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableColumnHeader
                label="Classificação"
                column="classification"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              {canManage ? (
                <Table.ColumnHeader textAlign="end">Ações</Table.ColumnHeader>
              ) : null}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {assessments.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={isAluno ? 5 : canManage ? 8 : 7}>
                  <Text color="fg.muted" py={4}>
                    Nenhuma avaliação encontrada.
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              assessments.map((assessment) => (
                <Table.Row key={assessment.id}>
                  <Table.Cell>{formatDate(assessment.createdAt)}</Table.Cell>
                  {!isAluno ? (
                    <Table.Cell>{assessment.student.name}</Table.Cell>
                  ) : null}
                  {!isAluno ? (
                    <Table.Cell>{assessment.evaluator.name}</Table.Cell>
                  ) : null}
                  <Table.Cell>{assessment.height.toFixed(2)} m</Table.Cell>
                  <Table.Cell>{assessment.weight.toFixed(1)} kg</Table.Cell>
                  <Table.Cell>{assessment.imc.toFixed(1)}</Table.Cell>
                  <Table.Cell>{assessment.classification}</Table.Cell>
                  {canManage ? (
                    <Table.Cell>
                      <HStack justify="flex-end" gap={2}>
                        {(isAdmin || isProfessor) ? (
                          <Button
                            asChild
                            size="xs"
                            variant="outline"
                            colorPalette="brand"
                          >
                            <Link href={`/assessments/${assessment.id}/edit`}>
                              Editar
                            </Link>
                          </Button>
                        ) : null}
                        {isAdmin ? (
                          <Button
                            size="xs"
                            variant="outline"
                            colorPalette="softRed"
                            color="softRed.fg"
                            borderColor="softRed.emphasized"
                            loading={
                              deleteMutation.isPending &&
                              deleteMutation.variables === assessment.id
                            }
                            onClick={() => setPendingDeleteId(assessment.id)}
                          >
                            Excluir
                          </Button>
                        ) : null}
                      </HStack>
                    </Table.Cell>
                  ) : null}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {meta ? <ListPagination meta={meta} onPageChange={setPage} /> : null}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        description="Tem certeza de que deseja excluir esta avaliação?"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return
          deleteMutation.mutate(pendingDeleteId)
        }}
      />
    </Stack>
  )
}
