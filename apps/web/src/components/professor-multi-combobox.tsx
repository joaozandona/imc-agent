'use client'

import {
  Box,
  Combobox,
  HStack,
  Portal,
  Text,
  chakra,
  useFilter,
  useListCollection,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listUsers } from '@/lib/users-api'

export type ProfessorOption = {
  id: string
  name: string
}

type ProfessorMultiComboboxProps = {
  value: string[]
  selectedProfessors?: ProfessorOption[]
  onChange: (professorIds: string[], professors: ProfessorOption[]) => void
  placeholder?: string
}

export function ProfessorMultiCombobox({
  value,
  selectedProfessors = [],
  onChange,
  placeholder = 'Digite para buscar professor',
}: ProfessorMultiComboboxProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selected, setSelected] = useState<ProfessorOption[]>(() => {
    const byId = new Map(selectedProfessors.map((item) => [item.id, item]))
    return value
      .map((id) => byId.get(id) ?? { id, name: id })
      .filter(Boolean)
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(inputValue.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [inputValue])

  useEffect(() => {
    const byId = new Map(selectedProfessors.map((item) => [item.id, item]))
    setSelected((current) => {
      const next = value.map((id) => {
        return (
          current.find((item) => item.id === id) ??
          byId.get(id) ?? { id, name: id }
        )
      })
      return next
    })
  }, [value, selectedProfessors])

  const searchQuery = useQuery({
    queryKey: ['users', { purpose: 'professor-search', name: debouncedQuery }],
    queryFn: () =>
      listUsers({
        page: 1,
        limit: 20,
        name: debouncedQuery || undefined,
        role: 'professor',
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    enabled: debouncedQuery.length > 0,
  })

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected])

  const options = useMemo(
    () =>
      (searchQuery.data?.data ?? [])
        .filter((user) => user.status === 'ativo' && !selectedIds.has(user.id))
        .map((user) => ({
          label: user.name,
          value: user.id,
        })),
    [searchQuery.data, selectedIds],
  )

  const { contains } = useFilter({ sensitivity: 'base' })
  const { collection, filter, set } = useListCollection({
    initialItems: options,
    filter: contains,
  })

  useEffect(() => {
    set(options)
    filter(inputValue)
  }, [options, set, filter, inputValue])

  function commitSelection(next: ProfessorOption[]) {
    setSelected(next)
    onChange(
      next.map((item) => item.id),
      next,
    )
  }

  function addProfessor(id: string, name: string) {
    if (selectedIds.has(id)) {
      return
    }

    commitSelection([...selected, { id, name }])
    setInputValue('')
    setDebouncedQuery('')
  }

  function removeProfessor(id: string) {
    commitSelection(selected.filter((item) => item.id !== id))
  }

  return (
    <Box width="full">
      {selected.length > 0 ? (
        <HStack gap={2} flexWrap="wrap" mb={2}>
          {selected.map((professor) => (
            <HStack
              key={professor.id}
              as="span"
              gap={1}
              px={2}
              py={0.5}
              borderRadius="md"
              bg="brand.subtle"
              color="brand.fg"
              fontSize="sm"
            >
              <Text as="span">{professor.name}</Text>
              <chakra.button
                type="button"
                aria-label={`Remover ${professor.name}`}
                cursor="pointer"
                lineHeight={1}
                bg="transparent"
                border="none"
                p={0}
                onClick={() => removeProfessor(professor.id)}
              >
                ×
              </chakra.button>
            </HStack>
          ))}
        </HStack>
      ) : null}

      <Combobox.Root
        collection={collection}
        inputValue={inputValue}
        value={[]}
        onValueChange={(details) => {
          const id = details.value[0]
          if (!id) return
          const option = options.find((item) => item.value === id)
          addProfessor(id, option?.label ?? id)
        }}
        onInputValueChange={(details) => {
          setInputValue(details.inputValue)
          filter(details.inputValue)
        }}
        openOnChange={(details) => details.inputValue.trim().length > 0}
        openOnClick={false}
        selectionBehavior="clear"
        width="full"
      >
        <Combobox.Control>
          <Combobox.Input
            placeholder={placeholder}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !inputValue && selected.length > 0) {
                removeProfessor(selected[selected.length - 1].id)
              }
            }}
          />
          <Combobox.IndicatorGroup>
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Empty>
                {searchQuery.isFetching
                  ? 'Buscando...'
                  : 'Nenhum professor encontrado.'}
              </Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item key={item.value} item={item}>
                  <Combobox.ItemText>{item.label}</Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
    </Box>
  )
}
