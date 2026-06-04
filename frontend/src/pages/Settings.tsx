import { Box, Heading, Text, VStack, HStack, Badge, Button, useColorMode, Switch } from '@chakra-ui/react'
import { Info, HelpCircle, Moon, Sun, Monitor, Bell, User, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { colorMode, setColorMode } = useColorMode()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading fontSize="2xl" color="text-primary">Settings</Heading>
        <Text fontSize="sm" color="text-secondary" mt={1}>App info and preferences</Text>
      </Box>

      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack mb={4}>
          <User size={20} />
          <Heading fontSize="lg" color="text-primary">Account</Heading>
        </HStack>
        <Text fontSize="sm" color="text-secondary">{user?.full_name || user?.email}</Text>
        <HStack mt={4} gap={2}>
          <Button size="sm" variant="outline" onClick={() => navigate('/app/profile')}>
            View Profile
          </Button>
          <Button size="sm" variant="ghost" colorScheme="red" onClick={logout}>
            <LogOut size={14} /> Sign Out
          </Button>
        </HStack>
      </Box>

      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack mb={4}>
          {colorMode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          <Heading fontSize="lg" color="text-primary">Appearance</Heading>
        </HStack>
        <Text fontSize="sm" color="text-secondary" mb={4}>Choose your theme</Text>
        <HStack gap={3}>
          <Button
            size="sm"
            variant={colorMode === 'light' ? 'solid' : 'outline'}
            leftIcon={<Sun size={14} />}
            onClick={() => setColorMode('light')}
          >
            Light
          </Button>
          <Button
            size="sm"
            variant={colorMode === 'dark' ? 'solid' : 'outline'}
            leftIcon={<Moon size={14} />}
            onClick={() => setColorMode('dark')}
          >
            Dark
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Monitor size={14} />}
            onClick={() => setColorMode('system')}
          >
            System
          </Button>
        </HStack>
      </Box>

      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack mb={4}>
          <Bell size={20} />
          <Heading fontSize="lg" color="text-primary">Notifications</Heading>
        </HStack>
        <Text fontSize="sm" color="text-secondary">You get alerts for weather warnings and payment updates.</Text>
        <HStack mt={3} justify="space-between">
          <Text fontSize="sm" color="text-secondary">Weather alerts</Text>
          <Switch defaultChecked colorScheme="brand" />
        </HStack>
        <HStack mt={2} justify="space-between">
          <Text fontSize="sm" color="text-secondary">Payment updates</Text>
          <Switch defaultChecked colorScheme="brand" />
        </HStack>
      </Box>

      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack mb={4}>
          <Info size={20} />
          <Heading fontSize="lg" color="text-primary">About</Heading>
        </HStack>
        <Text fontSize="sm" color="text-secondary">
          InsureOn protects your earnings when bad weather stops you from working.
        </Text>
        <HStack mt={4} gap={2}>
          <Badge>Version 1.0</Badge>
          <Badge colorScheme="brand">Secure</Badge>
        </HStack>
      </Box>

      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack mb={4}>
          <HelpCircle size={20} />
          <Heading fontSize="lg" color="text-primary">Help</Heading>
        </HStack>
        <Text fontSize="sm" color="text-secondary">
          Questions? Contact your platform manager or email support@insureon.dev
        </Text>
      </Box>
    </VStack>
  )
}
