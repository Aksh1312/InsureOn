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
import type { Claim, DailyIncomeLog, FraudSignal } from '../api/types'
import SectionTitle from '../components/SectionTitle'
import { formatCurrency, formatDate } from '../utils/format'

export default function Claims() {
  const [active, setActive] = useState<Claim | null>(null)
  const [history, setHistory] = useState<Claim[]>([])
  const [incomeLogs, setIncomeLogs] = useState<DailyIncomeLog[]>([])
  const [fraudSignal, setFraudSignal] = useState<FraudSignal | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadClaims = async () => {
    try {
      const [activeClaim, claimHistory] = await Promise.all([
        api.getActiveClaim().catch(() => null),
        api.getClaimHistory(),
      ])
      setActive(activeClaim)
      setHistory(claimHistory)
      if (activeClaim) {
        const [logs, signal] = await Promise.all([
          api.getIncomeLogs(activeClaim.id).catch(() => []),
          api.getFraudSignal(activeClaim.id).catch(() => null),
        ])
        setIncomeLogs(logs)
        setFraudSignal(signal)
      } else {
        setIncomeLogs([])
        setFraudSignal(null)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    }
  }

  useEffect(() => {
    loadClaims()
  }, [])

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Claims"
        title="Watch your active disaster claims"
        subtitle="Claims open automatically after IMD alerts and track daily income loss."
      />
      {error ? (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      ) : null}

      <Box bg="white" borderRadius="28px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        <Heading fontSize="lg" color="ink.900">
          Active claim
        </Heading>
        {active ? (
          <SimpleGrid mt={5} columns={{ base: 1, md: 3 }} gap={4}>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Status
              </Text>
              <Badge colorScheme={active.is_fraud_flagged ? 'red' : 'teal'}>{active.status}</Badge>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Loss counter
              </Text>
              <Text fontWeight={600} color="ink.900">
                {active.loss_counter} / 5 days
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="ink.500">
                Estimated payout
              </Text>
              <Text fontWeight={600} color="ink.900">
                {formatCurrency(active.payout_amount)}
              </Text>
            </Box>
          </SimpleGrid>
        ) : (
          <Text mt={3} color="ink.600">
            No active claims at the moment.
          </Text>
        )}
      </Box>

      {active ? (
        <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
          <Heading fontSize="lg" color="ink.900">
            Income logs
          </Heading>
          <Box h="1px" bg="blackAlpha.200" my={4} />
          <Stack gap={3}>
            {incomeLogs.length ? (
              incomeLogs.map((log) => (
                <HStack key={log.id} justify="space-between" align="center">
                  <Box>
                    <Text fontWeight={600} color="ink.900">
                      {formatDate(log.log_date)}
                    </Text>
                    <Text fontSize="sm" color="ink.600">
                      Earned {formatCurrency(log.income_earned)} · Baseline{' '}
                      {formatCurrency(log.baseline_income)}
                    </Text>
                  </Box>
                  <Badge colorScheme={log.is_below_threshold ? 'orange' : 'teal'}>
                    {log.is_below_threshold ? 'Below 50%' : 'Healthy'}
                  </Badge>
                </HStack>
              ))
            ) : (
              <Text color="ink.600">No income logs yet.</Text>
            )}
          </Stack>
        </Box>
      ) : null}

      {fraudSignal ? (
        <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
          <Heading fontSize="lg" color="ink.900">
            Fraud signal summary
          </Heading>
          <Text mt={2} color="ink.600">
            Decision: {fraudSignal.decision} · Probability {fraudSignal.fraud_probability.toFixed(2)}
          </Text>
          <SimpleGrid mt={4} columns={{ base: 1, md: 4 }} gap={3}>
            {[
              fraudSignal.layer_1_event_verification,
              fraudSignal.layer_2_weather_baseline,
              fraudSignal.layer_3_worker_behaviour,
              fraudSignal.layer_4_platform_activity,
              fraudSignal.layer_5_income_pattern,
              fraudSignal.layer_6_zone_correlation,
              fraudSignal.layer_7_neighboring_zone,
              fraudSignal.layer_8_behavioral_deviation,
            ].map((value, index) => (
              <Box key={index} bg="ink.50" p={3} borderRadius="16px">
                <Text fontSize="xs" color="ink.500">
                  Layer {index + 1}
                </Text>
                <Text fontWeight={600} color="ink.900">
                  {value.toFixed(2)}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      ) : null}

      <Box>
        <Heading fontSize="lg" color="ink.900">
          Claim history
        </Heading>
        <Box h="1px" bg="blackAlpha.200" my={4} />
        <Stack gap={4}>
          {history.length ? (
            history.map((claim) => (
              <Box
                key={claim.id}
                bg="white"
                borderRadius="20px"
                p={5}
                borderWidth="1px"
                borderColor="blackAlpha.200"
              >
                <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                  <Box>
                    <Text fontWeight={600} color="ink.900">
                      Claim #{claim.id}
                    </Text>
                    <Text fontSize="sm" color="ink.600">
                      Monitoring start {formatDate(claim.monitoring_start)}
                    </Text>
                  </Box>
                  <Badge colorScheme={claim.is_fraud_flagged ? 'red' : 'teal'}>{claim.status}</Badge>
                </HStack>
                <HStack mt={3} gap={6} flexWrap="wrap">
                  <Text fontSize="sm" color="ink.600">
                    Loss days {claim.days_of_loss ?? '--'}
                  </Text>
                  <Text fontSize="sm" color="ink.600">
                    Payout {formatCurrency(claim.payout_amount)}
                  </Text>
                </HStack>
              </Box>
            ))
          ) : (
            <Text color="ink.600">No claims yet.</Text>
          )}
        </Stack>
      </Box>

      <Button alignSelf="flex-start" variant="outline" onClick={loadClaims}>
        Refresh claims
      </Button>
    </Stack>
  )
}
