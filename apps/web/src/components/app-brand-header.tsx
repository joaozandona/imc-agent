import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'

type AppBrandHeaderProps = {
  title?: string
  description?: string
  align?: 'center' | 'start'
  compact?: boolean
}

export function AppBrandHeader({
  title,
  description,
  align = 'center',
  compact = false,
}: AppBrandHeaderProps) {
  return (
    <Stack gap={compact ? 3 : 4} align={align} textAlign={align}>
      <Flex align="center" gap={3} justify={align === 'center' ? 'center' : 'flex-start'}>
        <Box
          w={compact ? '10' : '12'}
          h={compact ? '10' : '12'}
          bg="brand.solid"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="bold"
          fontSize={compact ? 'sm' : 'md'}
          letterSpacing="0.04em"
          flexShrink={0}
        >
          IMC
        </Box>
        <Box>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="brand.fg"
            lineHeight="short"
          >
            Painel da academia
          </Text>
          {title ? (
            <Heading size={compact ? 'lg' : 'xl'} color="brand.fg" mt={1}>
              {title}
            </Heading>
          ) : null}
        </Box>
      </Flex>
      {description ? (
        <Text color="fg.muted" maxW="md">
          {description}
        </Text>
      ) : null}
    </Stack>
  )
}
