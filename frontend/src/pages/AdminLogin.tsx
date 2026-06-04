import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Icon,
  HStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Terminal, Lock, ShieldAlert } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Strict frontend credentials separation
    const isAdmin = email.toLowerCase().includes('admin')
    if (!isAdmin) {
      setError('Only admin accounts can login here. Please use the Worker Login page.')
      setIsSubmitting(false)
      return
    }

    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Flex 
      minH="100vh" 
      align="center" 
      justify="center" 
      px={4} 
      bg="#120E0D"
      position="relative"
      overflow="hidden"
    >
      {/* Premium background glowing gradients */}
      <Box 
        position="absolute"
        top="-10%"
        left="-10%"
        w="50%"
        h="50%"
        bgGradient="radial(rgba(244, 143, 26, 0.08) 0%, transparent 70%)"
        borderRadius="full"
        pointerEvents="none"
      />
      <Box 
        position="absolute"
        bottom="-10%"
        right="-10%"
        w="50%"
        h="50%"
        bgGradient="radial(rgba(32, 180, 189, 0.05) 0%, transparent 70%)"
        borderRadius="full"
        pointerEvents="none"
      />

      <Box
        bg="rgba(31, 26, 24, 0.85)"
        backdropFilter="blur(20px)"
        p={{ base: 6, md: 10 }}
        borderRadius="32px"
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.08)"
        boxShadow="0 20px 50px rgba(0, 0, 0, 0.4)"
        w="full"
        maxW="450px"
        position="relative"
        zIndex={1}
      >
        <Flex justify="center" mb={6}>
          <HStack gap={2} bg="rgba(244, 143, 26, 0.1)" px={4} py={2} borderRadius="999px" border="1px solid" borderColor="rgba(244, 143, 26, 0.3)">
            <Icon as={Terminal} color="#F48F1A" boxSize={4} />
            <Text fontSize="2xs" fontWeight="bold" color="#F48F1A" letterSpacing="0.1em">ADMINISTRATIVE PORTAL</Text>
          </HStack>
        </Flex>

          <Heading fontSize="2xl" color="white" textAlign="center" fontFamily="Space Grotesk">
            Admin Login
          </Heading>
          <Text mt={2} color="rgba(255, 255, 255, 0.6)" textAlign="center" fontSize="sm">
            Access admin controls, safety checks, and payments.
          </Text>

        <Stack mt={8} as="form" gap={4} onSubmit={handleSubmit}>
          <Box>
            <Text fontSize="xs" fontWeight={600} color="rgba(255, 255, 255, 0.8)" mb={2} letterSpacing="0.05em">
              SECURE ADMIN EMAIL
            </Text>
            <Input 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email"
              bg="rgba(0, 0, 0, 0.2)"
              borderColor="rgba(255, 255, 255, 0.08)"
              color="white"
              _hover={{ borderColor: "rgba(244, 143, 26, 0.4)" }}
              _focus={{ borderColor: "#F48F1A", boxShadow: "0 0 8px rgba(244, 143, 26, 0.2)" }}
              placeholder="e.g., admin@insureon.dev"
            />
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight={600} color="rgba(255, 255, 255, 0.8)" mb={2} letterSpacing="0.05em">
              PASSWORD
            </Text>
            <Input 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              bg="rgba(0, 0, 0, 0.2)"
              borderColor="rgba(255, 255, 255, 0.08)"
              color="white"
              _hover={{ borderColor: "rgba(244, 143, 26, 0.4)" }}
              _focus={{ borderColor: "#F48F1A", boxShadow: "0 0 8px rgba(244, 143, 26, 0.2)" }}
              placeholder="••••••••"
            />
          </Box>

          {error && (
            <Alert 
              status="error" 
              borderRadius="16px" 
              bg="rgba(229, 62, 62, 0.1)" 
              border="1px solid" 
              borderColor="red.500" 
              color="red.200" 
              fontSize="xs"
              alignItems="start"
            >
              <AlertIcon as={ShieldAlert} color="red.400" mt={0.5} />
              <Text>{error}</Text>
            </Alert>
          )}

          <Button 
            type="submit" 
            size="lg" 
            isLoading={isSubmitting}
            bgGradient="linear(to-r, #F48F1A, #E07D10)"
            color="white"
            _hover={{ bgGradient: "linear(to-r, #FF9C2B, #ED8916)", boxShadow: "0 4px 15px rgba(244, 143, 26, 0.3)" }}
            _active={{ bgGradient: "linear(to-r, #D67406, #BF6500)" }}
            borderRadius="16px"
            mt={2}
            leftIcon={<Lock size={16} />}
          >
            Authenticate Console
          </Button>
        </Stack>
        
        <Text mt={6} fontSize="xs" color="rgba(255, 255, 255, 0.4)" textAlign="center">
          Are you a delivery partner?{' '}
          <Text 
            as="span" 
            color="#F48F1A" 
            fontWeight="600" 
            cursor="pointer" 
            onClick={() => navigate('/login')} 
            _hover={{ textDecoration: 'underline', color: "#FF9C2B" }}
          >
            Go to Worker Portal
          </Text>
        </Text>
      </Box>
    </Flex>
  )
}
