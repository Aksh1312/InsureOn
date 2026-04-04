import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Heading,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Link as RouterLink } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'

const MotionBox = motion(Box)

const highlights = [
  {
    title: '70% income coverage',
    detail: 'Parametric payouts tied to IMD alert triggers.',
  },
  {
    title: 'Claims in 48-72 hours',
    detail: 'Auto-opened, auto-monitored, and paid without paperwork.',
  },
  {
    title: 'Multi-layer fraud defense',
    detail: 'Eight-step signal funnel + graph ring detection.',
  },
]

const modules = [
  {
    title: 'Risk Assessment & Pricing',
    detail:
      'Zone-based tiers, weekly repricing, and dynamic risk multipliers for every worker persona.',
  },
  {
    title: 'Fraud Detection System',
    detail:
      'Event verification, platform activity, income pattern analysis, and ML-backed scoring.',
  },
  {
    title: 'Parametric Automation',
    detail:
      'Real-time IMD triggers open claims automatically and pay once loss counters hit 5 days.',
  },
]

const timeline = [
  'IMD alert fires and validates event severity.',
  'Claims open automatically for all eligible workers in the zone.',
  'Daily income logs tracked for 7 days with baseline comparisons.',
  'Payouts trigger after 5 consecutive loss days and close within 72 hours.',
]

export default function Landing() {
  return (
    <Box>
      <Box px={{ base: 4, md: 10 }} pt={{ base: 12, md: 24 }} pb={{ base: 12, md: 20 }}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={12} align="center">
          <Box flex="1">
            <Badge bg="tealish.100" color="tealish.900" px={3} py={1}>
              Built for delivery gig workers
            </Badge>
            <Heading
              mt={5}
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight={700}
              color="ink.900"
            >
              InsureOn protects weekly income when disasters shut the city down.
            </Heading>
            <Text mt={5} fontSize={{ base: 'md', md: 'lg' }} color="ink.600">
              Parametric protection for Swiggy, Zomato, Dunzo, and Blinkit riders. Automated triggers, instant
              payouts, and SmartWork guidance to keep earning safely.
            </Text>
            <HStack mt={8} gap={4} flexWrap="wrap">
              <Button as={RouterLink} to="/signup" size="lg">
                Start coverage
              </Button>
              <Button as={RouterLink} to="/login" size="lg" variant="outline">
                Worker login
              </Button>
            </HStack>
            <HStack mt={8} gap={3} flexWrap="wrap">
              <Badge variant="subtle" colorScheme="brand">
                Zone A: 2.5%
              </Badge>
              <Badge variant="subtle" colorScheme="brand">
                Zone B: 1.7%
              </Badge>
              <Badge variant="subtle" colorScheme="brand">
                Zone C: 1.2%
              </Badge>
            </HStack>
          </Box>
          <MotionBox
            flex="1"
            borderRadius="32px"
            bg="white"
            borderWidth="1px"
            borderColor="blackAlpha.200"
            p={{ base: 6, md: 10 }}
            boxShadow="xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.18em" color="ink.500">
              Weekly protection scorecard
            </Text>
            <Heading mt={4} fontSize="3xl" color="ink.900">
              Smart payouts, not paperwork.
            </Heading>
            <Stack mt={6} gap={4}>
              {highlights.map((item) => (
                <Box
                  key={item.title}
                  borderRadius="20px"
                  bg="ink.50"
                  p={4}
                  borderWidth="1px"
                  borderColor="blackAlpha.100"
                >
                  <Text fontWeight={600} color="ink.900">
                    {item.title}
                  </Text>
                  <Text mt={1} fontSize="sm" color="ink.600">
                    {item.detail}
                  </Text>
                </Box>
              ))}
            </Stack>
          </MotionBox>
        </Flex>
      </Box>

      <Box h="1px" bg="blackAlpha.200" />

      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }}>
        <SectionTitle
          kicker="What we cover"
          title="Income protection across disasters, storms, and outages."
          subtitle="Coverage is triggered by official IMD alerts and validated activity patterns."
        />
        <SimpleGrid mt={10} columns={{ base: 1, md: 3 }} gap={6}>
          {[
            'Floods, cyclones, earthquakes, and civil unrest.',
            'Extreme weather disruptions and platform outages.',
            'Coverage for multi-platform workers with bonus discounts.',
          ].map((text) => (
            <Box
              key={text}
              bg="white"
              borderRadius="24px"
              p={6}
              borderWidth="1px"
              borderColor="blackAlpha.200"
              boxShadow="sm"
            >
              <Text fontWeight={600} color="ink.900">
                {text}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} bg="white">
        <SectionTitle
          kicker="Core modules"
          title="Three systems orchestrated end-to-end."
          subtitle="Risk scoring, fraud defense, and automation work in sync to protect real workers."
        />
        <SimpleGrid mt={10} columns={{ base: 1, md: 3 }} gap={6}>
          {modules.map((module) => (
            <Box
              key={module.title}
              borderRadius="24px"
              p={6}
              borderWidth="1px"
              borderColor="blackAlpha.200"
            >
              <Heading fontSize="xl" color="ink.900">
                {module.title}
              </Heading>
              <Text mt={3} color="ink.600">
                {module.detail}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }}>
        <Grid templateColumns={{ base: '1fr', md: '1.1fr 0.9fr' }} gap={10}>
          <Box>
            <SectionTitle
              kicker="Trigger timeline"
              title="From IMD alert to payout in five steps."
              subtitle="Automation monitors income for 7 days with a 5-day loss trigger."
            />
            <Stack mt={6} gap={3}>
              {timeline.map((step, index) => (
                <HStack key={step} gap={4} align="start">
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg="brand.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight={700}
                    color="ink.900"
                  >
                    {index + 1}
                  </Box>
                  <Text color="ink.700">{step}</Text>
                </HStack>
              ))}
            </Stack>
          </Box>
          <Box
            borderRadius="28px"
            borderWidth="1px"
            borderColor="blackAlpha.200"
            bg="white"
            p={6}
          >
            <Text textTransform="uppercase" fontSize="xs" letterSpacing="0.2em" color="ink.500">
              SmartWork impact
            </Text>
            <Heading mt={4} fontSize="2xl" color="ink.900">
              Shift smarter, earn 10-15% more.
            </Heading>
            <Text mt={4} color="ink.600">
              SmartWork tips flag surge windows, safe routes, and weather windows every Monday.
            </Text>
            <Stack mt={6} gap={3}>
              {[
                'Best time slots by city demand curve.',
                'Risk advisories for active IMD alerts.',
                'Zone rotation to maximize orders per hour.',
              ].map((item) => (
                <HStack key={item} gap={3}>
                  <Box w={2} h={2} borderRadius="full" bg="tealish.400" />
                  <Text fontSize="sm" color="ink.700">
                    {item}
                  </Text>
                </HStack>
              ))}
            </Stack>
          </Box>
        </Grid>
      </Box>

      <Box h="1px" bg="blackAlpha.200" />

      <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} textAlign="center">
        <Heading fontSize={{ base: '2xl', md: '4xl' }} color="ink.900">
          Ready to protect your weekly income?
        </Heading>
        <Text mt={4} color="ink.600">
          Start with a simple signup, verify your zone, and get weekly coverage in minutes.
        </Text>
        <HStack mt={6} justify="center" gap={4} flexWrap="wrap">
          <Button as={RouterLink} to="/signup" size="lg">
            Get started
          </Button>
          <Button as={RouterLink} to="/login" size="lg" variant="outline">
            View dashboard
          </Button>
        </HStack>
      </Box>

      <Box px={{ base: 4, md: 10 }} pb={12}>
        <Box h="1px" bg="blackAlpha.200" />
        <Flex mt={6} justify="space-between" align="center" wrap="wrap" gap={4}>
          <Text color="ink.500">InsureOn · Parametric income protection for gig workers</Text>
          <Link href="https://github.com" color="ink.500">
            Built for DEVTrails 2026
          </Link>
        </Flex>
      </Box>
    </Box>
  )
}
