import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Fraunces', serif",
    body: "'Space Grotesk', sans-serif",
  },
  colors: {
    brand: {
      50: '#fff4e6',
      100: '#ffe2bf',
      200: '#ffd096',
      300: '#ffbd6e',
      400: '#ffab45',
      500: '#f48f1a',
      600: '#d87706',
      700: '#b45f02',
      800: '#8f4800',
      900: '#6a3200',
    },
    ink: {
      50: '#f6f5f2',
      100: '#e5e0d8',
      200: '#c8c1b5',
      300: '#a9a094',
      400: '#8a8076',
      500: '#6e645b',
      600: '#574f48',
      700: '#443d37',
      800: '#302b27',
      900: '#1f1a18',
    },
    tealish: {
      50: '#e8fbfb',
      100: '#c6f4f5',
      200: '#9beaed',
      300: '#6edee3',
      400: '#3fcfd7',
      500: '#20b4bd',
      600: '#118f98',
      700: '#0b6c74',
      800: '#07484f',
      900: '#052c30',
    },
  },
  semanticTokens: {
    colors: {
      'bg-body': { _light: 'ink.50', _dark: 'gray.800' },
      'bg-surface': { _light: 'white', _dark: 'gray.700' },
      'bg-surface-muted': { _light: 'ink.50', _dark: 'gray.600' },
      'text-primary': { _light: 'ink.900', _dark: 'whiteAlpha.900' },
      'text-secondary': { _light: 'ink.600', _dark: 'whiteAlpha.700' },
      'text-muted': { _light: 'ink.400', _dark: 'whiteAlpha.500' },
      'border-light': { _light: 'blackAlpha.200', _dark: 'whiteAlpha.200' },
      'border-muted': { _light: 'blackAlpha.100', _dark: 'whiteAlpha.100' },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'bg-body',
        color: 'text-primary',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          borderRadius: '999px',
          fontWeight: 600,
        },
        outline: {
          borderRadius: '999px',
          fontWeight: 600,
        },
        ghost: {
          borderRadius: '999px',
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: '999px',
        textTransform: 'none',
        letterSpacing: '0.01em',
      },
    },
  },
})

export default theme
