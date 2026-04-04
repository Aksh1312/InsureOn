import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
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
        bg="white"
        p={{ base: 6, md: 10 }}
        borderRadius="32px"
        borderWidth="1px"
        borderColor="blackAlpha.200"
        boxShadow="lg"
        w="full"
        maxW="420px"
      >
        <Heading fontSize="2xl" color="ink.900">
          Worker login
        </Heading>
        <Text mt={2} color="ink.600">
          Access your weekly coverage, claims, and SmartWork tips.
        </Text>
        <Box mt={4} bg="ink.50" borderRadius="16px" px={4} py={3} borderWidth="1px" borderColor="blackAlpha.100">
          <Text fontSize="sm" color="ink.700">
            Test account: worker7@sim.insureon.dev
          </Text>
          <Text fontSize="sm" color="ink.700">
            Password: sim-worker-7-pass
          </Text>
        </Box>
        <Stack mt={6} as="form" gap={4} onSubmit={handleSubmit}>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Email
            </Text>
            <Input mt={2} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Password
            </Text>
            <Input mt={2} value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
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
        <Text mt={6} fontSize="sm" color="ink.500">
          New to InsureOn?{' '}
          <Link as={RouterLink} to="/signup" color="brand.600">
            Create an account
          </Link>
        </Text>
      </Box>
    </Flex>
  )
}
