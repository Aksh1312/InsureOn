import {
  Box,
  Button,
  Heading,
  Text,
  HStack,
  Stack,
  Input,
  Badge,
  SimpleGrid,
  Progress,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  IndianRupee,
  Shield,
  Briefcase,
} from 'lucide-react'
import * as api from '../api'
import type { OnboardingOptions } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../lib/store'
import AmountDisplay from '../components/fintech/AmountDisplay'

const MotionBox = motion(Box)

const README_BANDS = [
  { maxHours: 15, coverage: 1400, A: 35, B: 25, C: 15 },
  { maxHours: 20, coverage: 2100, A: 50, B: 35, C: 25 },
  { maxHours: 25, coverage: 2800, A: 70, B: 50, C: 35 },
  { maxHours: 30, coverage: 3500, A: 90, B: 60, C: 40 },
  { maxHours: 35, coverage: 4300, A: 110, B: 75, C: 50 },
  { maxHours: 40, coverage: 5150, A: 130, B: 90, C: 60 },
  { maxHours: 50, coverage: 6100, A: 150, B: 105, C: 75 },
  { maxHours: 60, coverage: 7150, A: 180, B: 120, C: 85 },
  { maxHours: 70, coverage: 8050, A: 200, B: 135, C: 95 },
  { maxHours: 999, coverage: 8400, A: 210, B: 145, C: 100 },
]

const resolveZone = (region: string): 'A' | 'B' | 'C' => {
  const r = (region || '').trim().toLowerCase()
  if (["chennai", "mumbai", "kolkata", "kochi", "bhubaneswar", "vizag"].includes(r)) return 'A'
  if (["bengaluru", "bangalore", "hyderabad", "ahmedabad", "surat", "nagpur"].includes(r)) return 'B'
  return 'C'
}

function getEstimatedPremiumAndCoverage(hours: number, zone: 'A' | 'B' | 'C') {
  for (const band of README_BANDS) {
    if (hours <= band.maxHours) {
      return {
        coverage: band.coverage,
        premium: band[zone],
      }
    }
  }
  const lastBand = README_BANDS[README_BANDS.length - 1]
  return {
    coverage: lastBand.coverage,
    premium: lastBand[zone],
  }
}

const STEPS = [
  { id: 'welcome', icon: Shield, label: 'Welcome' },
  { id: 'profile', icon: Briefcase, label: 'Profile' },
  { id: 'location', icon: MapPin, label: 'Location' },
  { id: 'income', icon: IndianRupee, label: 'Income' },
  { id: 'preview', icon: Check, label: 'Preview' },
] as const

type StepId = typeof STEPS[number]['id']

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setOnboardingComplete } = useAppStore()
  const [options, setOptions] = useState<OnboardingOptions | null>(null)
  const [step, setStep] = useState<StepId>('welcome')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estimatedPremium, setEstimatedPremium] = useState<{
    coverage: number
    base_premium: number
    final_premium: number
  } | null>(null)

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    platform: 'swiggy',
    region: '',
    income: 5000,
    pincode: '',
    upi_id: user?.email?.split('@')[0] + '@pay' || '',
    avg_weekly_hours: 30,
    primary_shift: 'afternoon',
    is_multi_platform: false,
  })

  useEffect(() => {
    api.getOnboardingOptions().then(setOptions).catch(() => null)
  }, [])

  const currentIndex = STEPS.findIndex((s) => s.id === step)
  const progress = ((currentIndex + 1) / STEPS.length) * 100

  useEffect(() => {
    if (step === 'preview' && form.region && form.avg_weekly_hours) {
      const zone = resolveZone(form.region)
      const { coverage, premium } = getEstimatedPremiumAndCoverage(form.avg_weekly_hours, zone)
      setEstimatedPremium({ coverage, base_premium: premium, final_premium: premium })
    }
  }, [step, form.region, form.avg_weekly_hours])

  const handleChange = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const nextStep = () => {
    const next = STEPS[currentIndex + 1]
    if (next) setStep(next.id)
  }

  const prevStep = () => {
    const prev = STEPS[currentIndex - 1]
    if (prev) setStep(prev.id)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await api.updateWorkerProfile({
        avg_weekly_hours: Number(form.avg_weekly_hours),
        avg_weekly_income: Number(form.income),
        primary_shift: form.primary_shift as any,
        is_multi_platform: form.is_multi_platform,
        pincode: form.pincode,
      })
      setOnboardingComplete(true)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box minH="100vh" bg="bg-surface-muted" display="flex" alignItems="center" justifyContent="center" px={4} py={8}>
      <Box w="full" maxW="600px">
        <Progress value={progress} borderRadius="full" size="sm" bg="border-muted" mb={8} />

        <AnimatePresence mode="wait">
          <MotionBox
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 'welcome' && (
              <Box textAlign="center" py={8}>
                <Box display="inline-flex" p={4} bg="brand.100" borderRadius="full" mb={6}>
                  <Shield size={40} color="var(--chakra-colors-brand-600)" />
                </Box>
                <Heading fontSize="3xl" color="text-primary" mb={3}>
                  Set up your coverage
                </Heading>
                <Text color="text-secondary" mb={8} maxW="440px" mx="auto">
                  Tell us about your work. Takes 2 minutes.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
                  <Box p={4} bg="bg-surface" borderRadius="16px" borderWidth="1px" borderColor="border-muted">
                    <Text fontSize="2xl" mb={2}>📋</Text>
                    <Text fontWeight={600} fontSize="sm" color="text-primary">Your profile.</Text>
                    <Text fontSize="xs" color="text-secondary">Your app, hours, and shift</Text>
                  </Box>
                  <Box p={4} bg="bg-surface" borderRadius="16px" borderWidth="1px" borderColor="border-muted">
                    <Text fontSize="2xl" mb={2}>📍</Text>
                    <Text fontWeight={600} fontSize="sm" color="text-primary">Your location.</Text>
                    <Text fontSize="xs" color="text-secondary">City and area for safety</Text>
                  </Box>
                  <Box p={4} bg="bg-surface" borderRadius="16px" borderWidth="1px" borderColor="border-muted">
                    <Text fontSize="2xl" mb={2}>💰</Text>
                    <Text fontWeight={600} fontSize="sm" color="text-primary">Your income.</Text>
                    <Text fontSize="xs" color="text-secondary">Sets your fee and coverage</Text>
                  </Box>
                </SimpleGrid>
                <Button size="lg" onClick={nextStep} rightIcon={<ArrowRight size={18} />}>
                  Get started
                </Button>
              </Box>
            )}

            {step === 'profile' && (
              <Box bg="bg-surface" borderRadius="32px" p={8} borderWidth="1px" borderColor="border-light">
                <Badge colorScheme="brand" mb={3}>Step 2 of 5</Badge>
                <Heading fontSize="2xl" color="text-primary" mb={2}>
                  Your work details.
                </Heading>
                <Text color="text-secondary" mb={6} fontSize="sm">
                  Your delivery work info
                </Text>
                <Stack gap={5}>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>Full name</Text>
                    <Input value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter your full name." />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>Delivery app</Text>
                    <Input as="select" value={form.platform} onChange={(e) => handleChange('platform', e.target.value)}>
                      {(options?.platforms || ['swiggy', 'zomato', 'dunzo', 'blinkit', 'other']).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Input>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>Multiple apps?</Text>
                    <Input as="select" value={form.is_multi_platform ? 'yes' : 'no'} onChange={(e) => handleChange('is_multi_platform', e.target.value === 'yes')}>
                      <option value="no">No, one app</option>
                      <option value="yes">Yes, multiple apps</option>
                    </Input>
                  </Box>
                  <HStack gap={3}>
                    <Button variant="outline" onClick={prevStep} leftIcon={<ArrowLeft size={16} />}>Back</Button>
                    <Button onClick={nextStep} rightIcon={<ArrowRight size={16} />}>Continue</Button>
                  </HStack>
                </Stack>
              </Box>
            )}

            {step === 'location' && (
              <Box bg="bg-surface" borderRadius="32px" p={8} borderWidth="1px" borderColor="border-light">
                <Badge colorScheme="brand" mb={3}>Step 3 of 5</Badge>
                <Heading fontSize="2xl" color="text-primary" mb={2}>
                  Your location.
                </Heading>
                <Text color="text-secondary" mb={6} fontSize="sm">
                  City sets safety level. Pincode for alerts.
                </Text>
                <Stack gap={5}>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>Your City</Text>
                    <Input value={form.region} onChange={(e) => handleChange('region', e.target.value)} placeholder="e.g., Mumbai, Delhi" />
                    <Text fontSize="xs" color="text-secondary" mt={1}>Area set from city</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>Pincode</Text>
                    <Input value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} placeholder="Enter your 6-digit pincode." maxLength={6} />
                    <Text fontSize="xs" color="text-secondary" mt={1}>For weather alerts</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>UPI ID</Text>
                    <Input value={form.upi_id} onChange={(e) => handleChange('upi_id', e.target.value)} placeholder="e.g., yourname@upi" />
                    <Text fontSize="xs" color="text-secondary" mt={1}>Payments sent to this UPI</Text>
                  </Box>
                  <HStack gap={3}>
                    <Button variant="outline" onClick={prevStep} leftIcon={<ArrowLeft size={16} />}>Back</Button>
                    <Button onClick={nextStep} rightIcon={<ArrowRight size={16} />}>Continue</Button>
                  </HStack>
                </Stack>
              </Box>
            )}

            {step === 'income' && (
              <Box bg="bg-surface" borderRadius="32px" p={8} borderWidth="1px" borderColor="border-light">
                <Badge colorScheme="brand" mb={3}>Step 4 of 5</Badge>
                <Heading fontSize="2xl" color="text-primary" mb={2}>
                  Your earnings.
                </Heading>
                <Text color="text-secondary" mb={6} fontSize="sm">
                  Sets your fee and coverage
                </Text>
                <Stack gap={5}>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>Weekly earnings (₹)</Text>
                    <Input
                      type="number"
                      value={form.income}
                      onChange={(e) => handleChange('income', Number(e.target.value))}
                      min={1500}
                    />
                    <Text fontSize="xs" color="text-secondary" mt={1}>Your usual weekly earnings</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={1}>Weekly work hours</Text>
                    <Input
                      type="number"
                      value={form.avg_weekly_hours}
                      onChange={(e) => handleChange('avg_weekly_hours', Number(e.target.value))}
                      min={1}
                      max={100}
                    />
                    <Text fontSize="xs" color="text-secondary" mt={1}>Your hours each week</Text>
                  </Box>
                  <Box p={4} bg="teal.50" borderRadius="16px">
                    <Text fontSize="sm" fontWeight={600} color="teal.800" mb={1}>
                      How it works
                    </Text>
                    <Text fontSize="xs" color="teal.700">
                      Cover: 70% of weekly earnings (up to ₹12,000/week). 
                      Paid if 5+ days lost.
                    </Text>
                  </Box>
                  <HStack gap={3}>
                    <Button variant="outline" onClick={prevStep} leftIcon={<ArrowLeft size={16} />}>Back</Button>
                    <Button onClick={nextStep} rightIcon={<ArrowRight size={16} />}>Review plan</Button>
                  </HStack>
                </Stack>
              </Box>
            )}

            {step === 'preview' && (
              <Box bg="bg-surface" borderRadius="32px" p={8} borderWidth="1px" borderColor="border-light">
                <Badge colorScheme="brand" mb={3}>Step 5 of 5</Badge>
                <Heading fontSize="2xl" color="text-primary" mb={2}>
                  Your Plan
                </Heading>
                <Text color="text-secondary" mb={6} fontSize="sm">
                  Check and confirm
                </Text>

                <Stack gap={4} mb={8}>
                  <HStack justify="space-between" p={4} bg="bg-surface-muted" borderRadius="16px">
                    <Text fontSize="sm" color="text-secondary">App</Text>
                    <Badge colorScheme="brand" variant="subtle">{form.platform}</Badge>
                  </HStack>
                  <HStack justify="space-between" p={4} bg="bg-surface-muted" borderRadius="16px">
                    <Text fontSize="sm" color="text-secondary">City</Text>
                    <Badge>
                      {form.region || '—'} → Area {resolveZone(form.region)}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between" p={4} bg="bg-surface-muted" borderRadius="16px">
                    <Text fontSize="sm" color="text-secondary">Weekly earnings</Text>
                    <AmountDisplay amount={form.income} size="md" />
                  </HStack>
                  <HStack justify="space-between" p={4} bg="bg-surface-muted" borderRadius="16px">
                    <Text fontSize="sm" color="text-secondary">Hours per week</Text>
                    <Text fontWeight={600}>{form.avg_weekly_hours}h</Text>
                  </HStack>
                  {estimatedPremium && (
                    <>
                      <Box h="1px" bg="border-muted" />
                      <HStack justify="space-between" p={4} bg="teal.50" borderRadius="16px">
                        <Text fontSize="sm" fontWeight={600} color="teal.800">Cover: 70% of earnings</Text>
                        <AmountDisplay amount={estimatedPremium.coverage} size="md" colorScheme="positive" />
                      </HStack>
                      <HStack justify="space-between" p={4} bg="teal.50" borderRadius="16px">
                        <Text fontSize="sm" fontWeight={600} color="teal.800">Weekly fee</Text>
                        <AmountDisplay amount={estimatedPremium.final_premium} size="md" colorScheme="positive" />
                      </HStack>
                      <Box p={4} bg="brand.50" borderRadius="16px">
                        <Text fontSize="sm" fontWeight={600} color="brand.800" mb={1}>
                          What you get
                        </Text>
                        <Text fontSize="xs" color="brand.700">
                          Up to ₹{estimatedPremium.coverage.toLocaleString('en-IN')} if 5+ days lost. Paid to your UPI.
                        </Text>
                      </Box>
                    </>
                  )}
                </Stack>

                {error && (
                  <Text fontSize="sm" color="red.500" mb={4}>{error}</Text>
                )}

                <HStack gap={3}>
                  <Button variant="outline" onClick={prevStep} leftIcon={<ArrowLeft size={16} />}>Change</Button>
                  <Button onClick={handleSubmit} isLoading={isSubmitting} loadingText="Setting up..." size="lg" flex={1}>
                    Start coverage
                  </Button>
                </HStack>
              </Box>
            )}
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Box>
  )
}
