import { IconButton, useColorMode } from '@chakra-ui/react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <IconButton
      aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      variant="ghost"
      size="sm"
      fontSize="lg"
      onClick={toggleColorMode}
      icon={colorMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      color="text-primary"
      _dark={{ color: 'whiteAlpha.900' }}
    />
  )
}
