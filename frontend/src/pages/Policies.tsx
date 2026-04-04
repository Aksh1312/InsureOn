import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import * as api from '../api'
import type { Policy } from '../api/types'
import SectionTitle from '../components/SectionTitle'
import { formatCurrency, formatDate } from '../utils/format'

export default function Policies() {
  const [active, setActive] = useState<Policy | null>(null)
  const [history, setHistory] = useState<Policy[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [activePolicy, policyHistory] = await Promise.all([
        api.getActivePolicy().catch(() => null),
        api.getPolicyHistory(),
      ])
      setActive(activePolicy)
      setHistory(policyHistory)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleIssue = async () => {
    try {
      await api.issueWeeklyPolicy()
      await loadData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handlePay = async (policyId: number) => {
    try {
      await api.payPolicy(policyId)
      await loadData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    }
  }

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Policies"
        title="Track and pay your weekly coverage"
        subtitle="Issue a new policy each week and keep premiums up to date."
      />
      {error ? (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      ) : null}

      <Box bg="white" borderRadius="28px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading fontSize="lg" color="ink.900">
              Active policy
            </Heading>
            <Text mt={2} color="ink.600">
              {active
                ? `Week of ${formatDate(active.week_start_date)} (${active.zone})`
                : 'No active policy detected.'}
            </Text>
          </Box>
          <Button onClick={handleIssue} variant="outline">
            Issue weekly policy
          </Button>
        </HStack>
        {active ? (
          <SimpleGrid mt={6} columns={{ base: 1, md: 3 }} gap={4}>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Coverage
              </Text>
              <Text fontWeight={600} color="ink.900">
                {formatCurrency(active.weekly_coverage)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Premium
              </Text>
              <Text fontWeight={600} color="ink.900">
                {formatCurrency(active.weekly_premium)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Status
              </Text>
              <Badge colorScheme={active.is_paid ? 'teal' : 'orange'}>
                {active.is_paid ? 'Paid' : 'Unpaid'}
              </Badge>
              {!active.is_paid ? (
                <Button mt={3} size="sm" onClick={() => handlePay(active.id)}>
                  Pay now
                </Button>
              ) : null}
            </Box>
          </SimpleGrid>
        ) : null}
      </Box>

      <Box>
        <Heading fontSize="lg" color="ink.900">
          Policy history
        </Heading>
        <Box h="1px" bg="blackAlpha.200" my={4} />
        <Stack gap={4}>
          {history.length ? (
            history.map((policy) => (
              <Box
                key={policy.id}
                bg="white"
                borderRadius="20px"
                p={5}
                borderWidth="1px"
                borderColor="blackAlpha.200"
              >
                <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                  <Box>
                    <Text fontWeight={600} color="ink.900">
                      {formatDate(policy.week_start_date)} - {formatDate(policy.week_end_date)}
                    </Text>
                    <Text fontSize="sm" color="ink.600">
                      Zone {policy.zone} · {policy.tier}
                    </Text>
                  </Box>
                  <HStack gap={3}>
                    <Badge colorScheme={policy.is_paid ? 'teal' : 'orange'}>
                      {policy.is_paid ? 'Paid' : 'Unpaid'}
                    </Badge>
                    {!policy.is_paid ? (
                      <Button size="sm" onClick={() => handlePay(policy.id)}>
                        Pay
                      </Button>
                    ) : null}
                  </HStack>
                </HStack>
                <HStack mt={4} gap={6} flexWrap="wrap">
                  <Text fontSize="sm" color="ink.600">
                    Coverage {formatCurrency(policy.weekly_coverage)}
                  </Text>
                  <Text fontSize="sm" color="ink.600">
                    Premium {formatCurrency(policy.weekly_premium)}
                  </Text>
                </HStack>
              </Box>
            ))
          ) : (
            <Text color="ink.600">No policy history available yet.</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
