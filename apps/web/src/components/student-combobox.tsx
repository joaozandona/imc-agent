'use client'

import { Combobox, Portal, useFilter, useListCollection } from '@chakra-ui/react'
import { useEffect, useMemo } from 'react'
import type { ListUser } from '@/types/user'

type StudentComboboxProps = {
  students: ListUser[]
  value: string
  onChange: (studentId: string) => void
  placeholder?: string
  resetKey?: number
}

export function StudentCombobox({
  students,
  value,
  onChange,
  placeholder = 'Digite para buscar aluno',
  resetKey = 0,
}: StudentComboboxProps) {
  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        label: student.name,
        value: student.id,
      })),
    [students],
  )

  const { contains } = useFilter({ sensitivity: 'base' })
  const { collection, filter, set } = useListCollection({
    initialItems: studentOptions,
    filter: contains,
  })

  useEffect(() => {
    set(studentOptions)
  }, [studentOptions, set, resetKey])

  return (
    <Combobox.Root
      key={resetKey}
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(details) => {
        onChange(details.value[0] ?? '')
      }}
      onInputValueChange={(details) => {
        filter(details.inputValue)
        if (!details.inputValue.trim()) {
          onChange('')
        }
      }}
      openOnChange={(details) => details.inputValue.trim().length > 0}
      openOnClick={false}
      selectionBehavior="replace"
      width="full"
    >
      <Combobox.Control>
        <Combobox.Input placeholder={placeholder} />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>

      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>Nenhum aluno encontrado.</Combobox.Empty>
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
  )
}
