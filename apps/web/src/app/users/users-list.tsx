'use client'

import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { deleteUser, listUsers } from '@/lib/users-api'
import type { UserRole } from '@/types/user'

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  aluno: 'Aluno',
}

export function UsersList() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const [actionError, setActionError] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setActionError(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Não foi possível excluir o usuário.'),
      )
    },
  })

  const isAdmin = currentUser?.role === 'admin'

  const handleDelete = (id: string, name: string) => {
    const confirmed = window.confirm(`Excluir o usuário "${name}"?`)
    if (!confirmed) return
    deleteMutation.mutate(id)
  }

  if (usersQuery.isLoading) {
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

  const users = usersQuery.data ?? []

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
              <Table.ColumnHeader>Nome</Table.ColumnHeader>
              <Table.ColumnHeader>Usuário</Table.ColumnHeader>
              <Table.ColumnHeader>Perfil</Table.ColumnHeader>
              <Table.ColumnHeader>Situação</Table.ColumnHeader>
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
                  <Table.Cell>{user.status}</Table.Cell>
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
                          onClick={() => handleDelete(user.id, user.name)}
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
    </Stack>
  )
}
