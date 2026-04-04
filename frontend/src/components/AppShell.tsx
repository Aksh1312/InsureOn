import {
  Box,
  Button,
  Flex,
  HStack,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { label: 'Dashboard', to: '/app', end: true },
  { label: 'Policies', to: '/app/policies' },
  { label: 'Claims', to: '/app/claims' },
  { label: 'Payouts', to: '/app/payouts' },
  { label: 'SmartWork', to: '/app/smartwork' },
  { label: 'Profile', to: '/app/profile' },
]

export default function AppShell() {
  const { user, logout } = useAuth()

  return (
    <Box minH="100vh" bg="ink.50">
      <Box
        bg="whiteAlpha.900"
        backdropFilter="blur(12px)"
        position="sticky"
        top={0}
        zIndex={10}
        borderBottomWidth="1px"
        borderColor="blackAlpha.100"
      >
        <Flex
          maxW="1200px"
          mx="auto"
          px={{ base: 4, md: 8 }}
          py={4}
          align="center"
          justify="space-between"
          gap={4}
        >
          <VStack align="start" gap={0}>
            <Text fontWeight={700} fontSize="lg" color="ink.900">
              InsureOn
            </Text>
            <Text fontSize="xs" color="ink.500">
              Parametric income protection
            </Text>
          </VStack>
          <HStack gap={3} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <Link
                key={item.to}
                as={NavLink}
                to={item.to}
                end={item.end}
                px={3}
                py={1.5}
                borderRadius="999px"
                fontSize="sm"
                fontWeight={600}
                _activeLink={{ bg: 'brand.100', color: 'ink.900' }}
                _hover={{ textDecoration: 'none', bg: 'blackAlpha.100' }}
              >
                {item.label}
              </Link>
            ))}
          </HStack>
          <HStack gap={3}>
            <Text fontSize="sm" color="ink.600" display={{ base: 'none', md: 'block' }}>
              {user?.full_name || user?.email}
            </Text>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={8}>
        <Outlet />
      </Box>
    </Box>
  )
}
