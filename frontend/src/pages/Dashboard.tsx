import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import * as api from '../api'
import type { DashboardSummary } from '../api/types'
import StatCard from '../components/StatCard'
import SectionTitle from '../components/SectionTitle'
import { formatCurrency, formatDate } from '../utils/format'

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getDashboardSummary()
      setSummary(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  if (isLoading) {
    return <Text>Loading dashboard...</Text>
  }

  if (!summary) {
    return <Text>No dashboard data yet.</Text>
  }

  return (
    <Stack gap={8}>
      <Flex justify="space-between" align={{ base: 'start', md: 'center' }} wrap="wrap" gap={4}>
        <SectionTitle
          kicker="Weekly dashboard"
          title={`Welcome, ${summary.user.full_name || summary.user.email}`}
          subtitle="Your active coverage, claims, and SmartWork insights for the week."
        />
        <Button variant="outline" onClick={loadSummary}>
          Refresh
        </Button>
      </Flex>
      {error ? (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <StatCard
          label="Weekly premium"
          value={formatCurrency(summary.profile?.weekly_premium)}
          helper={`Coverage ${formatCurrency(summary.profile?.weekly_coverage)}`}
          accent="var(--chakra-colors-brand-400)"
        />
        <StatCard
          label="Risk score"
          value={summary.risk_score ? summary.risk_score.total_score.toFixed(2) : '--'}
          helper={summary.risk_score?.risk_category || 'Not scored'}
          accent="var(--chakra-colors-tealish-400)"
        />
        <StatCard
          label="Active claim"
          value={summary.active_claim ? summary.active_claim.status : 'None'}
          helper={summary.active_claim ? `Loss counter ${summary.active_claim.loss_counter}/5` : ''}
          accent="var(--chakra-colors-ink-400)"
        />
      </SimpleGrid>

      <Box bg="white" borderRadius="28px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        <Heading fontSize="xl" color="ink.900">
          Premium breakdown
        </Heading>
        <Text mt={2} color="ink.600">
          Based on zone, tier, risk multiplier, and applied discounts or loadings.
        </Text>
        <Box h="1px" bg="blackAlpha.200" my={5} />
        {summary.premium_breakdown ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Zone / Tier
              </Text>
              <Text fontWeight={600} color="ink.900">
                {summary.premium_breakdown.zone} · {summary.premium_breakdown.tier}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Base premium
              </Text>
              <Text fontWeight={600} color="ink.900">
                {formatCurrency(summary.premium_breakdown.base_premium)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Weekly premium
              </Text>
              <Text fontWeight={600} color="ink.900">
                {formatCurrency(summary.premium_breakdown.weekly_premium)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Risk multiplier
              </Text>
              <Text fontWeight={600} color="ink.900">
                {summary.premium_breakdown.risk_multiplier.toFixed(2)}x
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Loadings
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {summary.premium_breakdown.applied_loadings.length ? (
                  summary.premium_breakdown.applied_loadings.map((item) => (
                    <Badge key={item} colorScheme="orange">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <Text fontSize="sm" color="ink.600">
                    None
                  </Text>
                )}
              </HStack>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Discounts
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {summary.premium_breakdown.applied_discounts.length ? (
                  summary.premium_breakdown.applied_discounts.map((item) => (
                    <Badge key={item} colorScheme="teal">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <Text fontSize="sm" color="ink.600">
                    None
                  </Text>
                )}
              </HStack>
            </Box>
          </SimpleGrid>
        ) : (
          <Text mt={4} color="ink.600">
            Premium breakdown will appear after onboarding.
          </Text>
        )}
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
          <Heading fontSize="lg" color="ink.900">
            Active policy
          </Heading>
          <Text mt={2} color="ink.600">
            {summary.active_policy
              ? `Week of ${formatDate(summary.active_policy.week_start_date)} · ${summary.active_policy.zone}`
              : 'No active policy issued yet.'}
          </Text>
          {summary.active_policy ? (
            <Text mt={3} fontWeight={600} color="ink.900">
              {formatCurrency(summary.active_policy.weekly_coverage)} coverage ·{' '}
              {formatCurrency(summary.active_policy.weekly_premium)} premium
            </Text>
          ) : null}
        </Box>
        <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
          <Heading fontSize="lg" color="ink.900">
            SmartWork tip
          </Heading>
          <Text mt={2} color="ink.600">
            {summary.smartwork_tip?.risk_advisory || 'No SmartWork advisory available yet.'}
          </Text>
        </Box>
      </SimpleGrid>
    </Stack>
  )
}
