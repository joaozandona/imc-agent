'use client'

import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ListPagination } from '@/components/list-pagination'
import {
  SortableColumnHeader,
  toggleSortOrder,
} from '@/components/sortable-column-header'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { deleteUser, listUsers, type UserSortBy } from '@/lib/users-api'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  type SortOrder,
} from '@/types/pagination'
import type { UserRole } from '@/types/user'

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  aluno: 'Aluno',
}

type PendingDeleteUser = {
  id: string
  name: string
}

export function UsersList() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const [page, setPage] = useState(1)
  const [nameFilter, setNameFilter] = useState('')
  const [usernameFilter, setUsernameFilter] = useState('')
  const [sortBy, setSortBy] = useState<UserSortBy>(DEFAULT_SORT_BY)
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteUser | null>(
    null,
  )

  const filters = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      name: nameFilter.trim() || undefined,
      username: usernameFilter.trim() || undefined,
      sortBy,
      sortOrder,
    }),
    [page, nameFilter, usernameFilter, sortBy, sortOrder],
  )

  const usersQuery = useQuery({
    queryKey: ['users', filters],
    queryFn: () => listUsers(filters),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setActionError(null)
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Não foi possível excluir o usuário.'),
      )
      setPendingDelete(null)
    },
  })

  const isAdmin = currentUser?.role === 'admin'
  const hasFilters = Boolean(nameFilter.trim() || usernameFilter.trim())

  const clearFilters = () => {
    setNameFilter('')
    setUsernameFilter('')
    setPage(1)
  }

  const handleSort = (column: UserSortBy) => {
    const next = toggleSortOrder(sortBy, sortOrder, column)
    setSortBy(next.sortBy as UserSortBy)
    setSortOrder(next.sortOrder)
    setPage(1)
  }

  if (usersQuery.isLoading && !usersQuery.data) {
    return (
      <Flex justify="center" py={16}>
        <Spinner size="lg" color="brand.solid" />
      </Flex>
    )
  }

  if (usersQuery.isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>
          {getApiErrorMessage(usersQuery.error, 'Não foi possível carregar usuários.')}
        </Alert.Title>
      </Alert.Root>
    )
  }

  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta

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
            Usuários
          </Heading>
        </Box>
        <Button asChild colorPalette="brand">
          <Link href="/users/new">Novo usuário</Link>
        </Button>
      </Flex>

      <HStack
        gap={4}
        align="flex-end"
        flexWrap="wrap"
        bg="white"
        borderWidth="1px"
        borderColor="blackAlpha.200"
        p={4}
      >
        <Box minW="200px" flex="1">
          <Text fontSize="sm" mb={1} fontWeight="medium">
            Nome
          </Text>
          <Input
            placeholder="Filtrar por nome"
            value={nameFilter}
            onChange={(event) => {
              setNameFilter(event.target.value)
              setPage(1)
            }}
          />
        </Box>
        <Box minW="200px" flex="1">
          <Text fontSize="sm" mb={1} fontWeight="medium">
            Usuário
          </Text>
          <Input
            placeholder="Filtrar por usuário"
            value={usernameFilter}
            onChange={(event) => {
              setUsernameFilter(event.target.value)
              setPage(1)
            }}
          />
        </Box>
        {hasFilters ? (
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        ) : null}
      </HStack>

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
                label="Nome"
                column="name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableColumnHeader
                label="Usuário"
                column="username"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableColumnHeader
                label="Perfil"
                column="role"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableColumnHeader
                label="Situação"
                column="status"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <Table.ColumnHeader textAlign="end">Ações</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <Text color="fg.muted" py={4}>
                    Nenhum usuário encontrado.
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell>{user.username}</Table.Cell>
                  <Table.Cell>{roleLabels[user.role]}</Table.Cell>
                  <Table.Cell>
                    <Text
                      as="span"
                      display="inline-block"
                      px={2}
                      py={0.5}
                      fontSize="xs"
                      fontWeight="medium"
                      borderRadius="md"
                      bg={user.status === 'ativo' ? 'blue.100' : 'red.100'}
                      color={user.status === 'ativo' ? 'blue.800' : 'red.800'}
                    >
                      {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack justify="flex-end" gap={2}>
                      <Button asChild size="xs" variant="outline" colorPalette="brand">
                        <Link href={`/users/${user.id}/edit`}>Editar</Link>
                      </Button>
                      {isAdmin ? (
                        <Button
                          size="xs"
                          variant="outline"
                          colorPalette="softRed"
                          color="softRed.fg"
                          borderColor="softRed.emphasized"
                          loading={
                            deleteMutation.isPending &&
                            deleteMutation.variables === user.id
                          }
                          onClick={() =>
                            setPendingDelete({ id: user.id, name: user.name })
                          }
                        >
                          Excluir
                        </Button>
                      ) : null}
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {meta ? <ListPagination meta={meta} onPageChange={setPage} /> : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        description={
          pendingDelete
            ? `Tem certeza de que deseja excluir o usuário "${pendingDelete.name}"?`
            : ''
        }
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteMutation.mutate(pendingDelete.id)
        }}
      />
    </Stack>
  )
}
