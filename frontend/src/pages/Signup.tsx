import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import type { OnboardingOptions } from '../api/types'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [options, setOptions] = useState<OnboardingOptions | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    platform: 'swiggy',
    region: '',
    income: 4000,
    pincode: '',
    upi_id: '',
    avg_weekly_hours: 22,
    primary_shift: 'afternoon',
    is_multi_platform: false,
  })

  useEffect(() => {
    api
      .getOnboardingOptions()
      .then(setOptions)
      .catch(() => null)
  }, [])

  const handleChange = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await signup({
        ...form,
        income: Number(form.income),
        avg_weekly_hours: Number(form.avg_weekly_hours),
      })
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
        maxW="520px"
      >
        <Heading fontSize="2xl" color="ink.900">
          Create your worker account
        </Heading>
        <Text mt={2} color="ink.600">
          Set your platform details and get weekly coverage right away.
        </Text>
        <Box mt={4} bg="ink.50" borderRadius="16px" px={4} py={3} borderWidth="1px" borderColor="blackAlpha.100">
          <Text fontSize="sm" color="ink.700">
            Testing login: worker7@sim.insureon.dev
          </Text>
          <Text fontSize="sm" color="ink.700">
            Password: sim-worker-7-pass
          </Text>
        </Box>
        <Stack mt={6} as="form" gap={4} onSubmit={handleSubmit}>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Full name
            </Text>
            <Input mt={2} value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Email
            </Text>
            <Input mt={2} value={form.email} onChange={(e) => handleChange('email', e.target.value)} type="email" />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Password
            </Text>
            <Input mt={2} value={form.password} onChange={(e) => handleChange('password', e.target.value)} type="password" />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Platform
            </Text>
            <Input
              as="select"
              mt={2}
              value={form.platform}
              onChange={(e) => handleChange('platform', e.target.value)}
            >
              {(options?.platforms || ['swiggy', 'zomato', 'dunzo', 'blinkit', 'other']).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Input>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Region (City)
            </Text>
            <Input mt={2} value={form.region} onChange={(e) => handleChange('region', e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Weekly income (INR)
            </Text>
            <Input
              mt={2}
              value={form.income}
              onChange={(e) => handleChange('income', Number(e.target.value))}
              type="number"
              min={1500}
            />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Pincode
            </Text>
            <Input mt={2} value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              UPI ID
            </Text>
            <Input mt={2} value={form.upi_id} onChange={(e) => handleChange('upi_id', e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Average weekly hours
            </Text>
            <Input
              mt={2}
              value={form.avg_weekly_hours}
              onChange={(e) => handleChange('avg_weekly_hours', Number(e.target.value))}
              type="number"
              min={1}
            />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Primary shift
            </Text>
            <Input
              as="select"
              mt={2}
              value={form.primary_shift}
              onChange={(e) => handleChange('primary_shift', e.target.value)}
            >
              {(options?.shifts || ['morning', 'afternoon', 'night']).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Input>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <input
              type="checkbox"
              checked={form.is_multi_platform}
              onChange={(e) => handleChange('is_multi_platform', e.target.checked)}
            />
            <Text fontSize="sm" color="ink.700">
              I work across multiple platforms
            </Text>
          </Box>
          {error ? (
            <Text fontSize="sm" color="red.500">
              {error}
            </Text>
          ) : null}
          <Button type="submit" size="lg" isDisabled={isSubmitting}>
            Create account
          </Button>
        </Stack>
      </Box>
    </Flex>
  )
}
