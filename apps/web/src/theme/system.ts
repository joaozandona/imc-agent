import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  globalCss: {
    html: {
      colorScheme: 'light',
    },
    body: {
      bg: '{colors.brand.50}',
      color: '{colors.brand.800}',
      margin: 0,
      minHeight: '100%',
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#F2F0F8' },
          100: { value: '#E0DCEC' },
          200: { value: '#C2BBD9' },
          300: { value: '#9A90C0' },
          400: { value: '#6B6090' },
          500: { value: '#221656' },
          600: { value: '#1B1248' },
          700: { value: '#150E3A' },
          800: { value: '#100A2C' },
          900: { value: '#0B071F' },
        },
        softRed: {
          50: { value: '#FBF2F2' },
          100: { value: '#F3DADA' },
          200: { value: '#E8B4B4' },
          300: { value: '#D98888' },
          400: { value: '#D06666' },
          500: { value: '#C94C4C' },
          600: { value: '#B53F3F' },
          700: { value: '#933434' },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: '{colors.brand.500}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.brand.600}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.50}' },
          emphasized: { value: '{colors.brand.200}' },
          focusRing: { value: '{colors.brand.400}' },
        },
        softRed: {
          solid: { value: '{colors.softRed.500}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.softRed.500}' },
          muted: { value: '{colors.softRed.100}' },
          subtle: { value: '{colors.softRed.50}' },
          emphasized: { value: '{colors.softRed.200}' },
          focusRing: { value: '{colors.softRed.400}' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
