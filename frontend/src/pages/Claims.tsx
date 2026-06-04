import {
  Badge,
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  Divider,
  Collapse,
  IconButton,
  Button,
} from '@chakra-ui/react'
import { ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useActiveClaim, useClaimHistory, useFraudSignal, useIncomeLogs } from '../hooks/useClaims'
import SectionTitle from '../components/SectionTitle'
import AmountDisplay from '../components/fintech/AmountDisplay'
import TransactionTimeline from '../components/fintech/TransactionTimeline'
import TrustBadge from '../components/fintech/TrustBadge'
import EmptyState from '../components/ui/EmptyState'
import ActivityFeed, { type ActivityItemData } from '../components/ui/ActivityFeed'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { formatDate, formatCurrency, timeAgo } from '../utils/format'
import { queryClient } from '../lib/query'
import { QUERY_KEYS } from '../lib/query'
import type { Claim } from '../api/types'

function getClaimTimeline(claim: Claim): Array<{
  label: string
  state: string
  timestamp: string
  description: string
  status: 'completed' | 'current' | 'pending' | 'failed'
}> {
  const states = []
  const created = claim.created_at
  const isResolved = claim.resolved
  const isRejected = claim.status === 'rejected' || claim.is_payout_cancelled
  const isPayoutReady = claim.status === 'payout_ready'
  const isMonitoring = claim.status === 'monitoring' || claim.loss_counter > 0
  const hasFraudCheck = claim.fraud_probability != null

  states.push({
      label: 'Request Opened',
    state: 'OPENED',
    timestamp: created,
    description: `Opened for ${claim.alert_name || 'Weather'}`,
    status: 'completed' as const,
  })

  if (isMonitoring || isResolved || isRejected || isPayoutReady) {
    states.push({
      label: 'Watching',
      state: 'MONITORING',
      timestamp: claim.monitoring_start || created,
      description: `${claim.loss_counter || 0} days lost`,
      status: 'completed' as const,
    })
  } else if (!isResolved && !isRejected) {
    states.push({
      label: 'Watching',
      state: 'MONITORING',
      timestamp: '',
      description: 'Waiting',
      status: 'current' as const,
    })
  }

  if (hasFraudCheck) {
    states.push({
      label: 'Fake Check Done',
      state: 'FRAUD_CHECKED',
      timestamp: '',
        description: `Fake: ${(claim.fraud_probability! * 100).toFixed(1)}%. ${claim.is_fraud_flagged ? 'Needs review' : 'Passed'}`,
      status: claim.is_fraud_flagged ? 'current' as const : 'completed' as const,
    })
  } else if (isMonitoring && !isResolved && !isRejected) {
    states.push({
      label: 'Fake Check',
      state: 'FRAUD_CHECKED',
      timestamp: '',
      description: 'Checking',
      status: 'pending' as const,
    })
  }

  if (isRejected) {
    states.push({
      label: 'Rejected',
      state: 'REJECTED',
      timestamp: '',
      description: 'Rejected',
      status: 'failed' as const,
    })
    return states
  }

  if (isPayoutReady) {
    states.push({
      label: 'Payment Ready',
      state: 'PAYOUT_READY',
      timestamp: '',
        description: `Ready: ${formatCurrency(claim.payout_amount)}`,
      status: 'current' as const,
    })
  } else if (isResolved) {
    states.push({
      label: 'Payment Ready',
      state: 'PAYOUT_READY',
      timestamp: '',
        description: `Ready: ${formatCurrency(claim.payout_amount)}`,
      status: 'completed' as const,
    })
  }

  if (isResolved && claim.payout_amount && !isRejected) {
    states.push({
      label: 'Paid',
      state: 'PAID',
      timestamp: claim.monitoring_end || '',
      description: `Sent: ${formatCurrency(claim.payout_amount)}`,
      status: 'completed' as const,
    })
    states.push({
      label: 'Closed',
      state: 'CLOSED',
      timestamp: '',
      description: 'Request complete.',
      status: 'completed' as const,
    })
  } else if (isResolved && isRejected) {
    states.push({
      label: 'Closed',
      state: 'CLOSED',
      timestamp: '',
      description: 'Closed',
      status: 'completed' as const,
    })
  }

  return states
}

export default function Claims() {
  const { data: activeClaim, isLoading: activeLoading, isFetching: activeFetching } = useActiveClaim()
  const { data: claimHistory = [], isLoading: historyLoading } = useClaimHistory()
  const activeClaimId = activeClaim?.id ?? null
  const { data: fraudSignal } = useFraudSignal(activeClaimId)
  const { data: incomeLogs } = useIncomeLogs(activeClaimId)

  const loading = activeLoading || historyLoading

  const timelineSteps = useMemo(() => {
    if (!activeClaim) return []
    return getClaimTimeline(activeClaim)
  }, [activeClaim])

  const activityItems: ActivityItemData[] = useMemo(() => {
    const items: ActivityItemData[] = []
    if (activeClaim) {
      items.push({
        id: `active-${activeClaim.id}`,
        type: 'claim',
        title: `Request #${activeClaim.id}`,
        description: `${activeClaim.alert_name || 'Weather'} · ${activeClaim.loss_counter} days`,
        timestamp: activeClaim.created_at,
        relativeTime: timeAgo(activeClaim.created_at),
        status: activeClaim.resolved ? 'Completed' : 'Watching',
        category: 'Request',
      })
    }
    claimHistory.slice(0, 3).forEach((c) => {
      items.push({
        id: `hist-${c.id}`,
        type: 'claim',
        title: `Request #${c.id}`,
        description: `${c.loss_counter} days · ${formatCurrency(c.payout_amount)}`,
        timestamp: c.created_at,
        relativeTime: timeAgo(c.created_at),
        status: c.resolved ? 'Closed' : c.status,
        category: 'Request',
        categoryColor: 'orange',
      })
    })
    if (fraudSignal) {
      items.push({
        id: `fraud-${activeClaimId}`,
        type: 'fraud',
        title: fraudSignal.decision === 'reject' ? 'Fake found' : 'Fake passed',
        description: `${fraudSignal.decision} · ${(fraudSignal.fraud_probability * 100).toFixed(0)}%`,
        timestamp: fraudSignal.evaluated_at,
        relativeTime: timeAgo(fraudSignal.evaluated_at),
        status: fraudSignal.decision === 'reject' ? 'Needs review' : 'Passed',
        category: 'Fake',
        categoryColor: 'purple',
      })
    }
    return items
  }, [activeClaim, claimHistory, fraudSignal, activeClaimId])

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeClaim })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.claimHistory })
      if (activeClaimId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomeLogs(activeClaimId) })
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fraudSignal(activeClaimId) })
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [activeClaimId])

  if (loading) return <DashboardSkeleton />

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Help Requests"
        title="Your help requests"
        subtitle="Requests and checks"
      />

      {activeFetching && activeClaim && (
        <Text fontSize="xs" color="text-muted" textAlign="right">
          Updating...
        </Text>
      )}

      {activeClaim && (
        <ActiveClaimCard
          claim={activeClaim}
          fraudSignal={fraudSignal}
          incomeLogs={incomeLogs}
          timelineSteps={timelineSteps}
        />
      )}

      {!activeClaim && !activeLoading && (
        <EmptyState
          icon="📋"
          title="No requests"
          message="Bad weather"
        />
      )}

      {claimHistory.length > 0 && (
        <Box>
          <Heading fontSize="lg" color="text-primary" mb={4}>
            Past
          </Heading>
          <Stack gap={3}>
            {claimHistory.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </Stack>
        </Box>
      )}

      {claimHistory.length === 0 && !activeClaim && (
        <Box>
          <Heading fontSize="lg" color="text-primary" mb={4}>
            Past
          </Heading>
          <EmptyState variant="compact" icon="📁" title="None past" message="Appears here" />
        </Box>
      )}

      {activityItems.length > 0 && (
        <Box bg="bg-surface" borderRadius="28px" p={6} borderWidth="1px" borderColor="border-light">
          <Heading fontSize="lg" color="text-primary" mb={4}>Recent</Heading>
          <ActivityFeed items={activityItems} />
        </Box>
      )}
    </Stack>
  )
}

function ActiveClaimCard({
  claim,
  fraudSignal,
  incomeLogs,
  timelineSteps,
}: {
  claim: Claim
  fraudSignal: any
  incomeLogs: any
  timelineSteps: Array<{ label: string; state: string; timestamp: string; description: string; status: 'completed' | 'current' | 'pending' | 'failed' }>
}) {
  const currentStepIndex = timelineSteps.findIndex((s) => s.status === 'current' || s.status === 'pending')
  const currentState = currentStepIndex >= 0 ? timelineSteps[currentStepIndex].state : 'CLOSED'

  const stateColors: Record<string, string> = {
    OPENED: 'blue',
    MONITORING: 'orange',
    FRAUD_CHECKED: 'purple',
    PAYOUT_READY: 'teal',
    PAID: 'green',
    REJECTED: 'red',
    CLOSED: 'gray',
  }

  return (
    <Box
      bg="bg-surface"
      borderRadius="28px"
      p={6}
      borderWidth="1px"
      borderColor="border-light"
      borderLeft="4px solid"
      borderLeftColor={claim.is_fraud_flagged ? 'orange.400' : 'teal.400'}
    >
      <HStack justify="space-between" align="start" wrap="wrap" gap={4}>
        <Box>
          <HStack gap={2} mb={1}>
            <Heading fontSize="lg" color="text-primary">
              Request #{claim.id}
            </Heading>
            <Badge
              colorScheme={stateColors[currentState] || 'blue'}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="999px"
            >
              {currentState}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="text-secondary" mt={1}>
            Started {formatDate(claim.created_at)} · {claim.alert_name || 'Weather'}
          </Text>
        </Box>
        <HStack gap={2}>
          {claim.is_fraud_flagged ? (
            <TrustBadge type="fraud_review" />
          ) : (
            fraudSignal && !claim.is_fraud_flagged && <TrustBadge type="fraud_cleared" />
          )}
          <Badge colorScheme={claim.resolved ? 'teal' : 'blue'} fontSize="sm" px={3} py={1} borderRadius="999px">
            {claim.resolved ? 'Resolved' : claim.status}
          </Badge>
        </HStack>
      </HStack>

      {claim.alert_level && (
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mt={6}>
          <Box p={4} bg="bg-surface-muted" borderRadius="12px">
            <Text fontSize="sm" color="text-secondary">Level</Text>
            <Badge colorScheme={claim.alert_level === 'RED' ? 'red' : 'orange'} mt={1} fontSize="sm" px={3} py={1}>
              {claim.alert_level}
            </Badge>
            <Text fontSize="sm" color="text-secondary" mt={1}>{claim.alert_name || '—'}</Text>
          </Box>
          <Box p={4} bg="bg-surface-muted" borderRadius="12px">
            <Text fontSize="sm" color="text-secondary">Amount</Text>
            {claim.claim_amount || claim.payout_amount ? (
              <AmountDisplay amount={claim.claim_amount || claim.payout_amount} size="lg" />
            ) : (
              <Text fontWeight={700} fontSize="lg" color="text-muted" mt={1}>Pending</Text>
            )}
          </Box>
          <Box p={4} bg="bg-surface-muted" borderRadius="12px">
            <Text fontSize="sm" color="text-secondary">Days lost</Text>
            {claim.loss_counter || claim.days_of_loss ? (
              <Text fontWeight={700} fontSize="2xl" color="text-primary" mt={1}>{claim.loss_counter || claim.days_of_loss}d</Text>
            ) : (
              <Text fontWeight={700} fontSize="lg" color="text-muted" mt={1}>Tracking…</Text>
            )}
          </Box>
          <Box p={4} bg="bg-surface-muted" borderRadius="12px">
            <Text fontSize="sm" color="text-secondary">Fake</Text>
            <HStack mt={1} gap={2}>
              <Text fontWeight={700} fontSize="2xl" color={claim.is_fraud_flagged ? 'red.500' : 'teal.500'}>
                {claim.fraud_probability != null ? `${(claim.fraud_probability * 100).toFixed(0)}%` : '—'}
              </Text>
              {claim.is_fraud_flagged && <ShieldAlert size={20} color="var(--chakra-colors-orange-500)" />}
            </HStack>
          </Box>
        </SimpleGrid>
      )}

      {claim.resolved && claim.payout_amount && (
        <Box p={4} bg="teal.50" borderRadius="12px" mt={4}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="teal.700" fontWeight={600}>Sent</Text>
            <AmountDisplay amount={claim.payout_amount} colorScheme="positive" />
          </HStack>
        </Box>
      )}

      {fraudSignal && <FraudPanel signal={fraudSignal} />}

      {incomeLogs && incomeLogs.length > 0 && (
        <Box mt={6}>
          <Heading fontSize="sm" color="text-secondary" mb={3}>Earnings</Heading>
          <Stack gap={2}>
            {(incomeLogs as any[]).slice(0, 5).map((log: any) => (
              <HStack key={log.id} justify="space-between" bg="bg-surface-muted" p={3} borderRadius="8px">
                <Text fontSize="sm" color="text-secondary">{formatDate(log.log_date || log.date)}</Text>
                <HStack gap={3}>
                  <Text fontSize="sm" color={log.is_below_threshold ? 'red.500' : 'teal.500'}>
                    {log.is_below_threshold ? 'Below' : 'Normal'}
                  </Text>
                  <AmountDisplay amount={log.income_earned || log.amount} size="sm" />
                </HStack>
              </HStack>
            ))}
          </Stack>
        </Box>
      )}

      {timelineSteps.length > 0 && (
        <Box mt={6}>
          <Heading fontSize="sm" color="text-secondary" mb={3}>Timeline</Heading>
          <TransactionTimeline steps={timelineSteps} />
        </Box>
      )}
    </Box>
  )
}

function ClaimCard({ claim }: { claim: Claim }) {
  const [expanded, setExpanded] = useState(false)

  const statusColor = claim.resolved ? 'teal' : claim.is_fraud_flagged ? 'red' : claim.status === 'rejected' ? 'red' : 'blue'
  const statusLabel = claim.resolved ? 'Resolved' : claim.status === 'rejected' ? 'Rejected' : claim.status

  return (
    <Box
      bg="bg-surface"
      borderRadius="16px"
      borderWidth="1px"
      borderColor="border-muted"
    >
      <Box p={5}>
        <HStack justify="space-between" align="start" wrap="wrap" gap={3}>
          <Box flex={1}>
            <HStack gap={2} mb={1}>
              <Text fontWeight={600} color="text-primary">
                {claim.alert_name || `Request #${claim.id}`}
              </Text>
              {claim.alert_level && (
                <Badge colorScheme={claim.alert_level === 'RED' ? 'red' : 'orange'}>{claim.alert_level}</Badge>
              )}
              {claim.is_payout_cancelled && (
                <Badge colorScheme="red" variant="subtle">Cancelled</Badge>
              )}
            </HStack>
            <HStack gap={4} flexWrap="wrap">
              <Text fontSize="sm" color="text-secondary">{formatDate(claim.created_at)}</Text>
              <Text fontSize="sm" color="text-secondary">{claim.loss_counter || claim.days_of_loss || 0}d</Text>
              {claim.zone && <Text fontSize="sm" color="text-secondary">Area {claim.zone}</Text>}
            </HStack>
          </Box>
          <HStack gap={2}>
            <Badge colorScheme={statusColor} fontSize="sm" px={3} py={1} borderRadius="999px">
              {statusLabel}
              {claim.resolved && claim.payout_amount ? ` · ${formatCurrency(claim.payout_amount)}` : ''}
            </Badge>
            <IconButton
              aria-label="Expand"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </IconButton>
          </HStack>
        </HStack>
      </Box>
      <Collapse in={expanded}>
        <Box px={5} pb={5} pt={0}>
          <Divider mb={3} />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} fontSize="sm">
            <Text color="text-secondary">Status: <b>{claim.status}</b>.</Text>
            <Text color="text-secondary">Fake flagged: <b>{claim.is_fraud_flagged ? 'Yes' : 'No'}</b></Text>
            {claim.payout_amount != null && (
              <Text color="text-secondary">Payment: <b>{formatCurrency(claim.payout_amount)}</b>.</Text>
            )}
            {claim.payout_percentage != null && (
              <Text color="text-secondary">Payout: <b>{claim.payout_percentage}%</b>.</Text>
            )}
            {claim.fraud_probability != null && (
              <Text color="text-secondary">Fake: <b>{(claim.fraud_probability * 100).toFixed(1)}%</b>.</Text>
            )}
            <Text color="text-secondary">Cancelled: <b>{claim.is_payout_cancelled ? 'Yes' : 'No'}</b></Text>
          </SimpleGrid>
          <Button
            size="xs"
            variant="ghost"
            mt={3}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.claimHistory })
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeClaim })
            }}
          >
            Refresh
          </Button>
        </Box>
      </Collapse>
    </Box>
  )
}

function FraudPanel({ signal }: { signal: any }) {
  const isFlagged = signal.is_fraud_ring_flagged || signal.decision === 'reject'
  return (
    <Box p={4} bg={isFlagged ? 'orange.50' : 'green.50'} borderRadius="12px" mt={4}>
      <HStack gap={3}>
        <ShieldAlert size={20} color={isFlagged ? 'var(--chakra-colors-orange-500)' : 'var(--chakra-colors-green-500)'} />
        <Box>
          <Text fontWeight={600} color={isFlagged ? 'orange.700' : 'green.700'} fontSize="sm">
            {isFlagged ? 'Fake found' : 'No fake found'}
          </Text>
          <Text fontSize="sm" color={isFlagged ? 'orange.600' : 'green.600'}>
            {isFlagged
              ? `${signal.decision} · ${(signal.fraud_probability * 100).toFixed(1)}%`
              : 'Passed'}
          </Text>
        </Box>
      </HStack>
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={2} mt={3}>
        {[
          { label: 'Weather', key: 'layer_1_event_verification' },
          { label: 'Past Weather', key: 'layer_2_weather_baseline' },
          { label: 'Pattern', key: 'layer_3_worker_behaviour' },
          { label: 'App', key: 'layer_4_platform_activity' },
          { label: 'Earnings', key: 'layer_5_income_pattern' },
          { label: 'Area', key: 'layer_6_zone_correlation' },
          { label: 'Nearby', key: 'layer_7_neighboring_zone' },
          { label: 'Change', key: 'layer_8_behavioral_deviation' },
        ].map(({ label, key }) => (
          <HStack key={key} justify="space-between" bg="bg-surface-muted" px={3} py={1} borderRadius="8px">
            <Text fontSize="xs" color="text-secondary">{label}</Text>
            <Text fontSize="sm" fontWeight={600} color="text-primary">{(signal[key] ?? 0).toFixed(3)}</Text>
          </HStack>
        ))}
      </SimpleGrid>
    </Box>
  )
}
