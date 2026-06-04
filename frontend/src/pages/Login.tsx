import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
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

    // Separation check: Reject admins on worker portal
    if (email.toLowerCase().includes('admin')) {
      setError('Administrative account detected. Please sign in via the Administrative Portal (/admin-login).')
      setIsSubmitting(false)
      return
    }

    try {
      await login(email, password)
      navigate('/app')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" px={4}>
      <Box
        bg="bg-surface"
        p={{ base: 6, md: 10 }}
        borderRadius="32px"
        borderWidth="1px"
        borderColor="border-light"
        boxShadow="lg"
        w="full"
        maxW="420px"
      >
        <Heading fontSize="2xl" color="text-primary">
          Worker Login
        </Heading>
        <Text mt={2} color="text-secondary">
           Your protection, requests, and tips.
        </Text>
        <Stack mt={6} as="form" gap={4} onSubmit={handleSubmit}>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="text-secondary">
              Email
            </Text>
            <Input required mt={2} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="text-secondary">
              Password
            </Text>
            <Input required mt={2} value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </Box>
          {error ? (
            <Text fontSize="sm" color="red.500">
              {error}
            </Text>
          ) : null}
          <Button type="submit" size="lg" isDisabled={isSubmitting}>
            Sign in
          </Button>
        </Stack>
        
        <Flex justify="space-between" mt={6} fontSize="sm">
          <Text color="text-secondary">
            New here?{' '}
            <Text as="span" color="brand.600" fontWeight="600" cursor="pointer" onClick={() => navigate('/signup')} _hover={{ textDecoration: 'underline' }}>
              Create account
            </Text>
          </Text>
          <Text 
            color="brand.600" 
            fontWeight="600" 
            cursor="pointer" 
            onClick={() => navigate('/admin-login')} 
            _hover={{ textDecoration: 'underline' }}
          >
            Admin Login
          </Text>
        </Flex>
      </Box>
    </Flex>
  )
}
