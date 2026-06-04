import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Input,
  Link,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOnboardingOptions, estimateProtection } from '../api'
import type { CalculatorEstimateResponse } from '../api/types'
import SectionTitle from '../components/SectionTitle'
import ThemeToggle from '../components/ui/ThemeToggle'

const MotionBox = motion(Box)



const benefits = [
  { title: 'Instant Payment', detail: '70% pay to UPI in 2 days.', icon: '💰' },
  { title: 'Weather Protection', detail: 'Auto cover when weather hits.', icon: '🌧️' },
  { title: 'No Paperwork', detail: 'No forms. Auto help.', icon: '📋' },
  { title: 'Smart Tips', detail: 'Tips to earn more.', icon: '💡' },
]

const coverageDetails = [
  {
    title: 'What We Cover',
    items: ['Rain & floods', 'Storms', 'Heat waves', 'App down', 'City curfews'],
  },
  {
    title: 'How It Works',
    items: ['Sign up in 2 mins', 'Pay small fee', 'Auto protection', 'UPI pay when stuck'],
  },
  {
    title: 'Who Can Join',
    items: ['Swiggy, Zomato riders', 'Part or full time', 'Earn ₹1,500+/week'],
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [hours, setHours] = useState('30')
  const [income, setIncome] = useState('5000')
  const [multiPlatform, setMultiPlatform] = useState(false)
  const [result, setResult] = useState<CalculatorEstimateResponse | null>(null)
  const [validation, setValidation] = useState('')

  const { data: options } = useQuery({
    queryKey: ['onboarding-options'],
    queryFn: getOnboardingOptions,
    staleTime: Infinity,
  })

  const estimate = useMutation({
    mutationFn: estimateProtection,
    onSuccess: (data) => {
      setResult(data)
      setValidation('')
    },
    onError: (err: Error) => {
      setResult(null)
      setValidation(err.message)
    },
  })

  const handleCalculate = () => {
    const h = parseFloat(hours)
    const inc = parseFloat(income)
    if (!city) { setValidation('Please select a city'); return }
    if (isNaN(h) || h < 10) { setValidation('Weekly hours must be at least 10'); return }
    if (isNaN(inc) || inc <= 0) { setValidation('Weekly income must be greater than Rs. 0'); return }
    setValidation('')
    estimate.mutate({
      city,
      weekly_hours: h,
      weekly_income: inc,
      multi_platform: multiPlatform,
    })
  }

  const riskColor = (cat: string) => {
    if (cat === 'LOW') return 'green.500'
    if (cat === 'MEDIUM') return 'yellow.500'
    if (cat === 'HIGH') return 'orange.500'
    return 'red.500'
  }

  return (
    <Box>
      {/* ── Top bar with theme toggle ── */}
      <Flex
        justify="flex-end"
        px={{ base: 4, md: 10 }}
        pt={4}
        align="center"
        gap={3}
      >
        <Button size="sm" variant="ghost" onClick={() => navigate('/admin-login')} color="text-muted">
          Admin
        </Button>
        <ThemeToggle />
      </Flex>

      {/* ── Hero ── */}
      <Box px={{ base: 4, md: 10 }} pt={{ base: 4, md: 8 }} pb={{ base: 12, md: 20 }}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={12} align="center">
          <Box flex="1">
            <Badge bg="tealish.100" color="tealish.900" px={3} py={1} fontSize="sm">
              For Delivery Partners
            </Badge>
            <Heading
              mt={5}
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight={700}
              color="text-primary"
              lineHeight="1.2"
            >
              Bad weather stops work? We pay you.
            </Heading>
            <Text mt={5} fontSize={{ base: 'md', md: 'lg' }} color="text-secondary">
              No forms needed.
            </Text>
            <HStack mt={8} gap={4} flexWrap="wrap">
              <Button size="lg" bg="brand.500" color="white" _hover={{ bg: 'brand.600' }} onClick={() => navigate('/signup')}>
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </HStack>
            <HStack mt={6} gap={4}>
              <Text fontSize="md" color="text-muted">
                ✓ No documents
              </Text>
              <Text fontSize="md" color="text-muted">
                ✓ UPI payouts
              </Text>
              <Text fontSize="md" color="text-muted">
                ✓ Starts at ₹35/week
              </Text>
            </HStack>
          </Box>
          <MotionBox
            flex="1"
            borderRadius="32px"
            bg="bg-surface"
            borderWidth="1px"
            borderColor="border-light"
            p={{ base: 6, md: 10 }}
            boxShadow="xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Text fontSize="md" textTransform="uppercase" letterSpacing="0.18em" color="text-muted">
              Example
            </Text>
            <Heading mt={4} fontSize="3xl" color="text-primary">
              ₹3,500 protected
            </Heading>
            <Text mt={2} fontSize="md" color="text-secondary">
              for just ₹90/week
            </Text>
            <Stack mt={6} gap={4}>
              {benefits.map((item) => (
                <HStack key={item.title} gap={4} align="start">
                  <Text fontSize="2xl">{item.icon}</Text>
                  <Box>
                    <Text fontWeight={600} color="text-primary">
                      {item.title}
                    </Text>
                    <Text fontSize="md" color="text-secondary">
                      {item.detail}
                    </Text>
                  </Box>
                </HStack>
              ))}
            </Stack>
          </MotionBox>
        </Flex>
      </Box>

      {/* ── Calculator ── */}
      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 20 }}>
        <SectionTitle
          kicker="Calculator"
          title="Estimate Your Weekly Protection"
          subtitle="See how much coverage you could get"
        />
        <Grid mt={10} templateColumns={{ base: '1fr', md: '1.1fr 0.9fr' }} gap={8}>
          <Box
            bg="rgba(255, 255, 255, 0.8)"
            _dark={{ bg: "rgba(26, 32, 44, 0.8)" }}
            backdropFilter="blur(12px)"
            borderRadius="24px"
            p={{ base: 6, md: 10 }}
            borderWidth="1px"
            borderColor="border-light"
            boxShadow="xl"
          >
            <Stack gap={6}>
              <FormControl>
                <FormLabel fontSize="md" fontWeight={600} color="text-primary">City</FormLabel>
                <Select
                  placeholder="Select your city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  bg="bg-body"
                  borderColor="border-light"
                  size="lg"
                  fontSize="md"
                >
                  {options?.zone_cities && Object.entries(options.zone_cities).flatMap(([, cities]) => cities).filter(Boolean).map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="md" fontWeight={600} color="text-primary">Weekly Hours</FormLabel>
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  bg="bg-body"
                  borderColor="border-light"
                  min={10}
                  size="lg"
                  fontSize="md"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="md" fontWeight={600} color="text-primary">Weekly Income (Rs.)</FormLabel>
                <Input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  bg="bg-body"
                  borderColor="border-light"
                  min={1}
                  size="lg"
                  fontSize="md"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel fontSize="md" fontWeight={600} color="text-primary" mb={0}>
                  Multi-Platform Worker
                </FormLabel>
                <Switch
                  isChecked={multiPlatform}
                  onChange={(e) => setMultiPlatform(e.target.checked)}
                  colorScheme="tealish"
                  size="lg"
                />
              </FormControl>
              {validation && (
                <Text fontSize="md" fontWeight={500} color="red.500">{validation}</Text>
              )}
              <Button
                size="lg"
                bg="brand.500"
                color="white"
                height="56px"
                fontSize="md"
                fontWeight="bold"
                _hover={{ bg: 'brand.600', transform: 'translateY(-1px)', boxShadow: 'lg' }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
                onClick={handleCalculate}
                isDisabled={estimate.isPending}
                w="full"
              >
                {estimate.isPending ? <Spinner size="sm" mr={2} /> : null}
                {estimate.isPending ? 'Calculating...' : 'Calculate Protection'}
              </Button>
            </Stack>
          </Box>
          <Box
            bg="rgba(244, 143, 26, 0.05)"
            _dark={{ bg: "rgba(244, 143, 26, 0.02)" }}
            borderRadius="24px"
            p={{ base: 6, md: 10 }}
            borderWidth="2px"
            borderColor="brand.300"
            borderStyle="dashed"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            boxShadow="inner"
          >
            {result ? (
              <Stack gap={5}>
                <Text textTransform="uppercase" letterSpacing="0.15em" fontSize="xs" fontWeight="bold" color="brand.600">
                  Your Estimated Protection
                </Text>
                <HStack justify="space-between" align="baseline">
                  <Text fontSize="md" fontWeight={500} color="text-secondary">Amount Covered</Text>
                  <Heading fontSize="3xl" color="text-primary">
                    Rs.{result.coverage_amount.toLocaleString('en-IN')}
                  </Heading>
                </HStack>
                <Box h="1px" bg="border-light" my={1} />
                <HStack justify="space-between">
                  <Text fontSize="md" fontWeight={500} color="text-secondary">Weekly Premium</Text>
                  <Text fontWeight={800} fontSize="xl" color="brand.500">
                    Rs.{result.premium.toLocaleString('en-IN')}
                  </Text>
                </HStack>
                <Box h="1px" bg="border-light" my={1} />
                <HStack justify="space-between">
                  <Text fontSize="md" fontWeight={500} color="text-secondary">Risk Category</Text>
                  <Badge
                    bg={riskColor(result.risk_category)}
                    color={result.risk_category === 'MEDIUM' ? 'black' : 'white'}
                    px={4}
                    py={1.5}
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {result.risk_category}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="md" fontWeight={500} color="text-secondary">Tier</Text>
                  <Text fontWeight={600} fontSize="md" color="text-primary">
                    {result.tier.replace('_', ' ')}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="md" fontWeight={500} color="text-secondary">Zone</Text>
                  <Text fontWeight={600} fontSize="md" color="text-primary">
                    {result.zone}{result.is_overridden ? ' (overridden)' : ''}
                  </Text>
                </HStack>
                <Box h="1px" bg="border-light" my={1} />
                <Text fontSize="sm" fontWeight={600} color="text-muted" textAlign="center">
                  {(result.coverage_pct * 100).toFixed(0)}% of weekly income covered
                </Text>
              </Stack>
            ) : (
              <Stack gap={4} align="center" textAlign="center" py={8}>
                <Text fontSize="5xl" style={{ animation: 'pulse 2s infinite' }}>🛡️</Text>
                <Text color="text-secondary" fontSize="md" fontWeight={500}>
                  Fill in your details and click Calculate to see your estimated protection plan
                </Text>
              </Stack>
            )}
          </Box>
        </Grid>
      </Box>

      {/* ── Protection for you ── */}
      <Box bg="bg-surface-muted" py={16}>
        <Box px={{ base: 4, md: 10 }}>
          <Heading textAlign="center" fontSize={{ base: '2xl', md: '3xl' }} color="text-primary">
              Protection for you
          </Heading>
          <Text textAlign="center" mt={4} color="text-secondary" fontSize="lg">
            Simple help when needed
          </Text>
          <SimpleGrid mt={10} columns={{ base: 1, md: 3 }} gap={8}>
            {coverageDetails.map((section) => (
              <Box key={section.title} bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
                <Heading fontSize="lg" color="text-primary" mb={4}>
                  {section.title}
                </Heading>
                <Stack gap={3}>
                  {section.items.map((item) => (
                    <HStack key={item} gap={3}>
                      <Box w={2} h={2} borderRadius="full" bg="tealish.400" />
                      <Text color="text-secondary">{item}</Text>
                    </HStack>
                  ))}
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      {/* ── Pricing by Zone ── */}
      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }}>
        <SectionTitle
          kicker="Pricing"
          title="Low price for all workers"
          subtitle="Fee by city and hours"
        />
        <Grid mt={10} templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
          {[
            {
              zone: 'Area A', cities: 'Mumbai, Chennai, Kolkata',
              rate: '2.5%', example: '₹4,000 income → ₹90/week', color: 'orange',
            },
            {
              zone: 'Area B', cities: 'Bengaluru, Hyderabad, Ahmedabad',
              rate: '1.7%', example: '₹4,000 income → ₹60/week', color: 'blue',
            },
            {
              zone: 'Area C', cities: 'Delhi, Pune, Jaipur',
              rate: '1.2%', example: '₹4,000 income → ₹40/week', color: 'green',
            },
          ].map((tier) => (
            <Box
              key={tier.zone}
              bg="bg-surface"
              borderRadius="24px"
              p={6}
              borderWidth="1px"
              borderColor="border-light"
              textAlign="center"
            >
              <Badge colorScheme={tier.color} fontSize="sm" px={3} py={1}>
                {tier.zone}
              </Badge>
              <Text mt={3} color="text-secondary" fontSize="sm">
                {tier.cities}
              </Text>
              <Heading mt={4} fontSize="2xl" color="text-primary">
                {tier.rate}
              </Heading>
              <Text mt={2} color="text-secondary" fontSize="sm">
                of protected pay
              </Text>
              <Box mt={4} pt={4} borderTopWidth="1px" borderColor="border-muted">
                <Text fontSize="sm" color="text-muted">Example:</Text>
                <Text fontWeight={600} color="text-primary">{tier.example}</Text>
              </Box>
            </Box>
          ))}
        </Grid>
        <Text textAlign="center" mt={6} color="text-muted" fontSize="sm">
          Protected: 70% of income (max ₹12,000/week)
        </Text>
      </Box>

      {/* ── Get paid fast ── */}
      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} bg="bg-surface">
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={10}>
          <Box>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color="text-primary">
              Get paid fast
            </Heading>
            <Stack mt={6} gap={4}>
              {[
                { days: '5 days', payout: '70% of protected amount' },
                { days: '6 days', payout: '85% of protected amount' },
                { days: '7 days', payout: '100% of protected amount' },
              ].map((item) => (
                <HStack key={item.days} p={4} bg="bg-surface-muted" borderRadius="16px">
                  <Box flex="1">
                    <Text fontWeight={600} color="text-primary">
                      {item.days} lost
                    </Text>
                  </Box>
                  <Text fontWeight={600} color="text-secondary">
                    {item.payout}
                  </Text>
                </HStack>
              ))}
            </Stack>
            <Text mt={4} fontSize="sm" color="text-muted">
              UPI pay in 1-2 days
            </Text>
          </Box>
          <Box
            borderRadius="24px"
            bg="bg-surface-muted"
            p={8}
            textAlign="center"
          >
            <Text fontSize="4xl" mb={4}>🛡️</Text>
            <Heading fontSize="xl" color="text-primary">
              Safety Net
            </Heading>
            <Text mt={4} color="text-secondary">
              We track pay. Auto-open help. No forms.
            </Text>
          </Box>
        </Grid>
      </Box>

      {/* ── Price by type ── */}
      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} bg="bg-surface-muted">
        <SectionTitle kicker="Worker Types" title="Price by type" subtitle="By hours and pay" />
        <SimpleGrid mt={10} columns={{ base: 1, md: 3 }} gap={6}>
          {[
            {
              tier: 'Type 1', type: 'Part-time', hours: '10–25 hrs/week',
              income: '₹1,500–₹4,500/week', coverage: '₹1,050–₹3,150',
              premium: '₹15–₹70/week', persona: 'Extra income', color: 'teal',
            },
            {
              tier: 'Type 2', type: 'Regular', hours: '26–40 hrs/week',
              income: '₹4,501–₹8,000/week', coverage: '₹3,150–₹5,600',
              premium: '₹40–₹130/week', persona: 'Regular worker', color: 'orange',
            },
            {
              tier: 'Type 3', type: 'Full-time', hours: '41+ hrs/week',
              income: '₹8,001–₹12,000+/week', coverage: '₹5,600–₹8,400',
              premium: '₹75–₹210/week', persona: 'Main earner', color: 'red',
            },
          ].map((t) => (
            <Box key={t.tier} bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
              <Badge colorScheme={t.color}>{t.tier}</Badge>
              <Heading fontSize="lg" mt={3} color="text-primary">{t.type}</Heading>
              <Text fontSize="md" color="text-muted">{t.hours}</Text>
              <Box h="1px" bg="border-muted" my={3} />
              <Stack gap={2}>
                <HStack justify="space-between">
                  <Text fontSize="md" color="text-secondary">Earnings</Text>
                  <Text fontWeight={600} fontSize="md" color="text-primary">{t.income}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="md" color="text-secondary">Protected (70%)</Text>
                  <Text fontWeight={600} fontSize="md" color="text-primary">{t.coverage}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="md" color="text-secondary">Fee</Text>
                  <Text fontWeight={600} fontSize="md" color="text-primary">{t.premium}</Text>
                </HStack>
                <Box p={2} bg="bg-surface-muted" borderRadius="8px" mt={2}>
                  <Text fontSize="sm" color="text-secondary" fontWeight={600}>{t.persona}</Text>
                </Box>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* ── How it works ── */}
      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }}>
        <SectionTitle kicker="Automatic" title="Auto. No forms." subtitle="Works on weather alerts." />
        <SimpleGrid mt={10} columns={{ base: 1, md: 4 }} gap={4}>
          {[
            { step: '1', title: 'Weather Alert', desc: 'Checks every 15 mins', icon: '🌤️' },
            { step: '2', title: 'Auto Help', desc: 'Request for your area', icon: '📋' },
            { step: '3', title: 'Earning Check', desc: 'Checks 7 day pay', icon: '📊' },
            { step: '4', title: 'Instant Payment', desc: 'UPI pay after 5 days', icon: '⚡' },
          ].map(({ step, title, desc, icon }) => (
            <Box key={step} bg="bg-surface" borderRadius="20px" p={5} borderWidth="1px" borderColor="border-light" textAlign="center">
              <Text fontSize="3xl">{icon}</Text>
              <Badge mt={2} colorScheme="brand">Step {step}</Badge>
              <Heading fontSize="md" mt={3} color="text-primary">{title}</Heading>
              <Text mt={2} fontSize="sm" color="text-secondary">{desc}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* ── Safety ── */}
      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} bg="bg-surface">
        <SectionTitle kicker="Safety" title="Fake claim check" subtitle="8 checks. Stops fakes. Pays fast." />
        <SimpleGrid mt={10} columns={{ base: 1, md: 4 }} gap={4}>
          {[
            { pct: '80–90%', label: 'Auto paid', desc: 'Paid fast' },
            { pct: '5–10%', label: 'Quick check', desc: 'Extra checks' },
            { pct: '3–5%', label: 'Manual check', desc: 'Team checks' },
            { pct: '<2%', label: 'Fake group found', desc: 'Deep check' },
          ].map(({ pct, label, desc }) => (
            <Box key={label} p={5} bg="bg-surface-muted" borderRadius="16px" textAlign="center">
              <Text fontSize="2xl" fontWeight={700} color="text-primary">{pct}</Text>
              <Text fontWeight={600} color="text-primary">{label}</Text>
              <Text fontSize="sm" color="text-muted">{desc}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Box h="1px" bg="border-muted" />

      {/* ── CTA ── */}
      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} textAlign="center">
        <Heading fontSize={{ base: '2xl', md: '4xl' }} color="text-primary">
          Ready to get protected?
        </Heading>
        <Text mt={4} color="text-secondary" fontSize="lg">
          Join riders who trust us
        </Text>
        <HStack mt={8} justify="center" gap={4} flexWrap="wrap">
          <Button size="lg" bg="brand.500" color="white" _hover={{ bg: 'brand.600' }} onClick={() => navigate('/signup')}>
            Sign Up Now
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
            Have an account?
          </Button>
        </HStack>
      </Box>

      {/* ── Footer ── */}
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Box h="1px" bg="border-muted" />
        <Flex mt={6} justify="space-between" align="center" wrap="wrap" gap={4}>
          <Text color="text-muted">© 2026 InsureOn</Text>
          <HStack gap={4}>
            <Link
              color="text-muted"
              fontSize="sm"
              onClick={() => navigate('/privacy')}
            >
              Privacy
            </Link>
            <Link
              color="text-muted"
              fontSize="sm"
              onClick={() => navigate('/terms')}
            >
              Terms
            </Link>
            <Link
              color="text-muted"
              fontSize="sm"
              onClick={() => navigate('/contact')}
            >
              Contact
            </Link>
          </HStack>
        </Flex>
      </Box>
    </Box>
  )
}
