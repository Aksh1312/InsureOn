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
  useToast,
} from '@chakra-ui/react'
import { useDashboard } from '../hooks/useDashboard'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import StatCard from '../components/StatCard'
import ActivityFeed from '../components/ui/ActivityFeed'
import EmptyState from '../components/ui/EmptyState'
import AmountDisplay from '../components/fintech/AmountDisplay'
import TrustBadge from '../components/fintech/TrustBadge'
import SectionTitle from '../components/SectionTitle'
import { formatCurrency, formatDate, timeAgo } from '../utils/format'
import { RefreshCw, TrendingUp, Zap, Shield, Activity, Download, FileText, CloudSun, Thermometer, Droplets, ChevronDown, MapPin, CloudRain, AlertTriangle, DollarSign } from 'lucide-react'
import { queryClient } from '../lib/query'
import { QUERY_KEYS } from '../lib/query'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore, type ActivityItem } from '../lib/store'
import { useEffect, useMemo, useCallback, useState } from 'react'
import { useRiskScoreHistory } from '../hooks/useRiskScore'
import { useDownloadPolicyCertificate } from '../hooks/usePolicies'
import { useNotifications } from '../hooks/useNotifications'
import { useFileClaim } from '../hooks/useClaims'
import { useWeatherAdvisory } from '../hooks/useWeather'
import type { SmartWorkTip } from '../api/types'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const GREETINGS = [
  'Welcome back',
  'Good to see you',
  'Ready to earn',
  'Stay safe',
  'Covered',
]

function getGreeting(name: string) {
  const base = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  return `${base}, ${name.split(' ')[0]}!`
}

function getRiskInsight(category: string | undefined) {
  switch (category) {
    case 'LOW': return { label: 'Safe', bg: 'teal.50', color: 'teal.700', icon: '🟢' }
    case 'MEDIUM': return { label: 'OK - Normal fee', bg: 'yellow.50', color: 'yellow.800', icon: '🟡' }
    case 'HIGH': return { label: 'Careful', bg: 'orange.50', color: 'orange.700', icon: '🟠' }
    case 'VERY_HIGH': return { label: 'Very careful', bg: 'red.50', color: 'red.700', icon: '🔴' }
    default: return { label: 'Checking...', bg: 'bg-surface-muted', color: 'text-secondary', icon: '⚪' }
  }
}

function getFactorRiskBadge(score: number) {
  if (score < 1.5) {
    return { label: 'Safe', bg: 'emerald.50', darkBg: 'emerald.800', color: 'emerald.700', darkColor: 'emerald.200' }
  } else if (score < 2.5) {
    return { label: 'OK', bg: 'yellow.100', darkBg: 'yellow.700', color: 'yellow.800', darkColor: 'yellow.100' }
  } else {
    return { label: 'Danger', bg: 'red.50', darkBg: 'red.800', color: 'red.700', darkColor: 'red.200' }
  }
}

function getFactorCardColors(score: number) {
  if (score < 1.5) return { bg: 'teal.50', darkBg: 'teal.900', border: 'teal.200', darkBorder: 'teal.700' }
  else if (score < 2.5) return { bg: 'yellow.50', darkBg: 'yellow.900', border: 'yellow.300', darkBorder: 'yellow.600' }
  else return { bg: 'red.50', darkBg: 'red.900', border: 'red.200', darkBorder: 'red.700' }
}

const CITY_MAP: Record<string, string> = {
  mumbai: 'Mumbai',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  hyderabad: 'Hyderabad',
  delhi: 'Delhi',
  kolkata: 'Kolkata',
  pune: 'Pune',
  chennai: 'Chennai',
  ahmedabad: 'Ahmedabad',
  jaipur: 'Jaipur',
  kochi: 'Kochi',
  cochin: 'Kochi',
  bhubaneswar: 'Bhubaneswar',
  vizag: 'Visakhapatnam',
  visakhapatnam: 'Visakhapatnam',
  surat: 'Surat',
  nagpur: 'Nagpur',
  lucknow: 'Lucknow',
  chandigarh: 'Chandigarh',
  indore: 'Indore',
}

const RISK_COLORS: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  SEVERE: 'red',
}

function getFactorDetails(label: string) {
  switch (label.toLowerCase()) {
    case 'pincode':
      return {
        title: 'Your Area',
        desc: 'Flood danger where you work',
      }
    case 'hours':
      return {
        title: 'Road Time',
        desc: 'Hours you work in bad weather',
      }
    case 'shift':
      return {
        title: 'Work Danger',
        desc: 'Heat or rain during your shift',
      }
    case 'claims':
      return {
        title: 'Safety History',
        desc: 'Discount if you never needed help',
      }
    default:
      return {
        title: label,
        desc: 'Auto safety score',
      }
  }
}

export default function Dashboard() {
  const { data: summary, isLoading, isFetching, isError, error, dataUpdatedAt } = useDashboard()
  const { data: riskHistory } = useRiskScoreHistory()
  const { user } = useAuth()
  const toast = useToast()
  const downloadCert = useDownloadPolicyCertificate()
  const storeActivity = useAppStore((s) => s.activityFeed)
  const { data: notifications } = useNotifications()
  const fileClaim = useFileClaim()

  const rawCity = summary?.user?.region?.trim() || ''
  const normCity = rawCity ? (CITY_MAP[rawCity.toLowerCase()] || rawCity) : undefined
  const { data: weather, isLoading: weatherLoading } = useWeatherAdvisory(normCity)

  const greeting = useMemo(() => getGreeting(user?.full_name || user?.email || 'worker'), [user])
  const riskInsight = useMemo(() => getRiskInsight(summary?.risk_score?.risk_category), [summary])

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeClaim })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payoutHistory })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartworkTip })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshAll, 60_000)
    return () => clearInterval(interval)
  }, [refreshAll])

  useEffect(() => {
    if (summary?.active_claim) {
      toast({
        title: 'Watching',
        description: summary.active_claim.is_fraud_flagged
          ? 'Checking'
          : `${summary.active_claim.loss_counter}/5 days`,
        status: summary.active_claim.is_fraud_flagged ? 'warning' : 'info',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [summary?.active_claim?.id])

  const activityItems: ActivityItem[] = useMemo(() => {
    const items: any[] = []
    if (summary?.payout_history?.length) {
      summary.payout_history.slice(0, 3).forEach((p) => {
        const isZeroPayout = p.amount === 0
        items.push({
          id: `payout-${p.id}`,
          type: isZeroPayout ? 'alert' as const : 'payout' as const,
          title: isZeroPayout ? 'Claim Closed' : `Paid ${formatCurrency(p.amount)}`,
          description: isZeroPayout ? 'No payout issued' : `#${p.claim_id}: ${p.alert_level}`,
          timestamp: p.sent_at || p.created_at,
          relativeTime: timeAgo(p.sent_at || p.created_at),
          status: 'Completed',
          category: 'Payment',
          categoryColor: 'teal',
        })
      })
    }
    if (summary?.claim_history?.length) {
      summary.claim_history.slice(0, 3).forEach((c) => {
        const status = c.resolved ? 'Completed' : c.is_fraud_flagged ? 'Flagged' : 'Watching'
        items.push({
          id: `claim-${c.id}`,
          type: 'claim' as const,
          title: `#${c.id}: ${status}`,
          description: `${c.loss_counter} days lost - ${formatCurrency(c.payout_amount)}`,
          timestamp: c.created_at,
          relativeTime: timeAgo(c.created_at),
          status: status,
          category: 'Request',
          categoryColor: 'orange',
        })
      })
    }
    if (summary?.smartwork_tip) {
      items.push({
        id: 'smartwork',
        type: 'smartwork' as const,
        title: 'New tips',
        description: 'Earn more',
        timestamp: new Date().toISOString(),
        relativeTime: 'This week',
        status: 'New',
        category: 'SmartWork',
        categoryColor: 'blue',
      })
    }
    if (summary?.active_policy?.is_paid) {
      items.push({
        id: 'policy-paid',
        type: 'policy' as const,
        title: 'Plan active',
        description: `Protected: ${formatCurrency(summary.active_policy.weekly_coverage)}`,
        timestamp: summary.active_policy.created_at,
        relativeTime: timeAgo(summary.active_policy.created_at),
        status: 'Active',
        category: 'Plan',
        categoryColor: 'green',
      })
    }
    if (notifications?.length) {
      const typeMap: Record<string, { type: ActivityItem['type']; category: string; categoryColor: string }> = {
        POLICY_CREATED: { type: 'policy', category: 'Policy', categoryColor: 'green' },
        POLICY_RENEWED: { type: 'policy', category: 'Policy', categoryColor: 'green' },
        PREMIUM_PAID: { type: 'premium', category: 'Payment', categoryColor: 'green' },
        CLAIM_OPENED: { type: 'alert', category: 'Alert', categoryColor: 'orange' },
        CLAIM_REJECTED: { type: 'claim', category: 'Claim', categoryColor: 'red' },
        CLAIM_APPROVED: { type: 'claim', category: 'Claim', categoryColor: 'teal' },
        FRAUD_REVIEW: { type: 'fraud', category: 'Review', categoryColor: 'purple' },
        PAYOUT_SENT: { type: 'payout', category: 'Payment', categoryColor: 'teal' },
        SMARTWORK_ALERT: { type: 'smartwork', category: 'Tip', categoryColor: 'blue' },
        WEATHER_ALERT: { type: 'alert', category: 'Weather', categoryColor: 'orange' },
        SYSTEM: { type: 'alert', category: 'System', categoryColor: 'gray' },
      }
      notifications.slice(0, 5).forEach((n) => {
        const mapping = typeMap[n.type] || { type: 'alert' as const, category: 'Update', categoryColor: 'gray' }
        items.push({
          id: `notification-${n.id}`,
          type: mapping.type,
          title: n.title,
          description: n.message,
          timestamp: n.created_at,
          relativeTime: timeAgo(n.created_at),
          status: n.is_read ? 'Read' : 'New',
          category: mapping.category,
          categoryColor: mapping.categoryColor,
        })
      })
    }
    const combined = [...items, ...storeActivity.slice(0, 3)]
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return combined.slice(0, 8)
  }, [summary, storeActivity, notifications])

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <Stack gap={8}>
        <SectionTitle kicker="Dashboard" title="Welcome to InsureOn" subtitle="Protect your pay" />
        <Box textAlign="center" py={16}>
          <Heading fontSize="lg" color="text-secondary" mb={2}>Could not load</Heading>
          <Text color="text-muted" mb={4}>{error?.message || 'Try again'}</Text>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })}>
            Retry
          </Button>
        </Box>
      </Stack>
    )
  }

  if (!summary) {
    return (
      <Stack gap={8}>
        <SectionTitle kicker="Dashboard" title="Welcome to InsureOn" subtitle="Protect your pay" />
        <EmptyState
          icon="🛡️"
          title="Nothing yet."
          message="Sign up"
        />
      </Stack>
    )
  }

  return (
    <Stack gap={8}>
      <Flex justify="space-between" align={{ base: 'start', md: 'center' }} wrap="wrap" gap={4}>
        <Box>
          <Text fontSize="md" color="text-secondary" mb={1}>
            {greeting} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Heading fontSize="3xl" fontWeight={700} color="text-primary">
            Protection
          </Heading>
          {dataUpdatedAt && (
            <Text fontSize="sm" color="text-muted">
              Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
              {isFetching && <span> · syncing...</span>}
            </Text>
          )}
        </Box>
        <HStack gap={3}>
          <TrustBadge type="policy_active" />
          {summary.profile?.weekly_premium && (
            <AmountDisplay amount={summary.profile.weekly_premium} size="sm" showCurrency prefix="Fee: " />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            isLoading={isFetching}
          >
            <RefreshCw size={16} />
          </Button>
        </HStack>
      </Flex>

      {weather && !weatherLoading && weather.risk_level === 'HIGH' && (
        <Box bg="#DD6B20" color="white" py={3} px={5} borderRadius="16px">
          <HStack gap={2}>
            <Text fontSize="lg">⚠</Text>
            <Text fontWeight={700} fontSize="sm">Heavy rainfall expected in your area today.</Text>
          </HStack>
        </Box>
      )}
      {weather && !weatherLoading && weather.risk_level === 'SEVERE' && (
        <Box bg="#E53E3E" color="white" py={3} px={5} borderRadius="16px">
          <HStack gap={2}>
            <Text fontSize="lg">⚠</Text>
            <Text fontWeight={700} fontSize="sm">Severe weather expected in your city.</Text>
          </HStack>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
        <StatCard
          label="Amount Covered"
          value={formatCurrency(summary.profile?.weekly_coverage ?? 0)}
          helper="Covered this week"
          accent="var(--chakra-colors-brand-400)"
        />
        <StatCard
          label="Your Fee"
          value={formatCurrency(summary.profile?.weekly_premium)}
          helper="Fee this week"
          accent="var(--chakra-colors-tealish-400)"
        />
        <StatCard
          label="Safety Score"
          value={summary.risk_score ? (
            summary.risk_score.risk_category === 'LOW' ? 'Safe' :
            summary.risk_score.risk_category === 'MEDIUM' ? 'Okay' :
            summary.risk_score.risk_category === 'HIGH' ? 'Careful' : 'Very Careful'
          ) : '--'}
          helper="Safety level"
          accent={
            summary.risk_score?.risk_category === 'LOW' ? 'var(--chakra-colors-teal-400)' :
            summary.risk_score?.risk_category === 'VERY_HIGH' ? 'var(--chakra-colors-red-400)' :
            'var(--chakra-colors-orange-400)'
          }
        />
        <StatCard
          label="Active Help Request"
          value={summary.active_claim ? summary.active_claim.status : 'None'}
          helper={summary.active_claim ? `${summary.active_claim.loss_counter}/5 days` : ''}
          accent="var(--chakra-colors-text-muted)"
        />
      </SimpleGrid>

      <Box bg="bg-surface" borderRadius="28px" p={6} borderWidth="1px" borderColor="border-light">
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <HStack>
            <TrendingUp size={18} color="var(--chakra-colors-brand-500)" />
            <Heading fontSize="lg" color="text-primary" fontFamily="Space Grotesk">Safety Check</Heading>
          </HStack>
          <Badge px={3} py={1.5} bg={riskInsight.bg} color={riskInsight.color} borderRadius="999px" fontSize="sm" fontWeight="700">
            {riskInsight.icon} {riskInsight.label}
          </Badge>
        </Flex>
        {summary.risk_score ? (
          <Stack gap={6}>
            {weather && !weatherLoading && normCity && weather.risk_level !== 'UNKNOWN' && (
              <Box
                p={5}
                bg="bg-surface-muted"
                border="1px solid"
                borderColor="border-light"
                borderRadius="20px"
              >
                <HStack gap={2} mb={3}>
                  <CloudSun size={18} color="var(--chakra-colors-brand-500)" />
                  <Text fontSize="sm" fontWeight={700} color="text-primary">🌦 LIVE WEATHER ADVISORY</Text>
                </HStack>
                <Text fontSize="xl" fontWeight={700} color="text-primary" mb={2}>
                  {weather.city}
                </Text>
                <HStack gap={4} mb={2} wrap="wrap">
                  {weather.temperature !== null && (
                    <HStack gap={1}>
                      <Thermometer size={14} color="var(--chakra-colors-text-muted)" />
                      <Text fontSize="sm" fontWeight={600} color="text-primary">{weather.temperature}°C</Text>
                    </HStack>
                  )}
                  {weather.rainfall_mm !== null && (
                    <HStack gap={1}>
                      <Droplets size={14} color="var(--chakra-colors-text-muted)" />
                      <Text fontSize="sm" fontWeight={600} color="text-primary">{weather.rainfall_mm} mm Rainfall</Text>
                    </HStack>
                  )}
                  <Badge colorScheme={RISK_COLORS[weather.risk_level] || 'gray'} borderRadius="999px" fontSize="xs" px={2.5} py={0.5}>
                    {weather.risk_level} RISK
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="text-secondary">{weather.summary}</Text>
                {weather.recommendation && (
                  <Text fontSize="sm" color="text-muted" mt={1}>
                    Recommendation: {weather.recommendation}
                  </Text>
                )}
              </Box>
            )}
            <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
              {[
                { label: 'Pincode', score: summary.risk_score.pincode_score },
                { label: 'Hours', score: summary.risk_score.hours_score },
                { label: 'Shift', score: summary.risk_score.shift_score },
                { label: 'Claims', score: summary.risk_score.claim_score },
              ].map(({ label, score }) => {
                const details = getFactorDetails(label)
                const badge = getFactorRiskBadge(score)
                const card = getFactorCardColors(score)
                return (
                  <Box 
                    key={label} 
                    p={4} 
                    bg={card.bg}
                    border="1px solid" 
                    borderColor={card.border}
                    _dark={{ bg: card.darkBg, borderColor: card.darkBorder }}
                    borderRadius="20px" 
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    minH="150px"
                  >
                    <Stack gap={1}>
                      <Text fontSize="sm" fontWeight={700} color="text-primary">{details.title}</Text>
                      <Text fontSize="xs" color="text-secondary" lineHeight="tall">{details.desc}</Text>
                    </Stack>
                    <Box mt={3}>
                      <Badge 
                        variant="solid" 
                        borderRadius="999px"
                        fontSize="xs"
                        px={2.5}
                        py={0.5}
                        bg={badge.bg}
                        color={badge.color}
                        _dark={{ bg: badge.darkBg, color: badge.darkColor }}
                      >
                        {badge.label}
                      </Badge>
                    </Box>
                  </Box>
                )
              })}
            </SimpleGrid>

            {summary.premium_breakdown && (
              <>
                <Box p={5} bg="bg-surface-muted" borderRadius="24px" border="1px solid" borderColor="border-muted">
                  <Heading fontSize="md" color="text-primary" mb={3} fontWeight="700">🔍 Your Fee Breakdown</Heading>
                  <Stack gap={3.5} fontSize="md" color="text-secondary">
                    <Flex justify="space-between" borderBottom="1px dashed" borderColor="border-light" pb={2.5} align="baseline">
                      <Box>
                        <Text fontWeight="700" color="text-primary">Average Weekly Hours</Text>
                        <Text fontSize="sm" color="text-muted" mt={0.5}>
                          Determines your pricing tier band
                        </Text>
                      </Box>
                      <Text fontWeight="800" fontSize="md" color="text-primary">{summary.premium_breakdown.avg_weekly_hours} hrs</Text>
                    </Flex>

                    <Flex justify="space-between" borderBottom="1px dashed" borderColor="border-light" pb={2.5} align="baseline">
                      <Box>
                        <Text fontWeight="700" color="text-primary">City Zone</Text>
                        <Text fontSize="sm" color="text-muted" mt={0.5}>
                          Resolved from region: {summary.user?.region}
                        </Text>
                      </Box>
                      <Text fontWeight="800" fontSize="md" color="text-primary">Zone {summary.premium_breakdown.zone}</Text>
                    </Flex>

                    <Flex justify="space-between" borderBottom="1px dashed" borderColor="border-light" pb={2.5} align="baseline">
                      <Box>
                        <Text fontWeight="700" color="text-primary">Protected Coverage Amount</Text>
                        <Text fontSize="sm" color="text-muted" mt={0.5}>
                          Based on standard hour bands table
                        </Text>
                      </Box>
                      <Text fontWeight="800" fontSize="md" color="text-primary">₹{summary.premium_breakdown.weekly_coverage.toLocaleString('en-IN')}</Text>
                    </Flex>

                    <Flex justify="space-between" pt={3} align="center">
                      <Box>
                        <Text fontWeight="800" color="text-primary" fontSize="md">Fixed Weekly Rate</Text>
                        <Text fontSize="sm" color="text-muted" mt={0.5}>Standard flat fee, no extra loadings/multipliers</Text>
                      </Box>
                      <Text fontWeight="800" color="brand.600" fontSize="2xl" style={{ textShadow: '0 0 12px rgba(244,143,26,0.1)' }}>
                        ₹{summary.premium_breakdown.weekly_premium.toFixed(0)}
                      </Text>
                    </Flex>
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        ) : (
          <Text color="text-muted" fontSize="sm">Sign up to see these.</Text>
        )}
      </Box>

      {riskHistory && riskHistory.length >= 2 ? (
        <Box bg="bg-surface" borderRadius="28px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack mb={4}>
            <Shield size={18} color="var(--chakra-colors-brand-500)" />
            <Heading fontSize="lg" color="text-primary">Safety Score History</Heading>
          </HStack>
          <Box h="180px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskHistory.slice().reverse().map(r => ({
                week: new Date(r.week_start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                score: r.total_score,
              }))}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 3]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--chakra-colors-border-light)' }}
                  formatter={(value: any) => [Number(value).toFixed(2), 'Score']}
                />
                <Bar dataKey="score" fill="var(--chakra-colors-brand-400)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      ) : riskHistory ? (
        <Box bg="bg-surface" borderRadius="28px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack mb={4}>
            <Shield size={18} color="var(--chakra-colors-brand-500)" />
            <Heading fontSize="lg" color="text-primary">Safety Score History</Heading>
          </HStack>
          <Text color="text-muted" fontSize="sm" py={8} textAlign="center">
            {riskHistory.length === 0
              ? 'No safety data yet. Scores appear after your first week.'
              : 'At least 2 weeks of data needed to show the trend.'}
          </Text>
        </Box>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Box
          bg="bg-surface"
          borderRadius="28px"
          p={6}
          borderWidth="1px"
          borderColor="border-light"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="4px"
            bgGradient="linear(to-r, brand.400, orange.400)"
          />
          <HStack mb={4}>
            <Shield size={18} color="var(--chakra-colors-brand-500)" />
            <Heading fontSize="lg" color="text-primary">Your Plan</Heading>
          </HStack>
          {summary.active_policy && summary.profile ? (
            <Stack gap={2}>
              <Flex justify="space-between" align="baseline" p={3} bg="brand.50" borderRadius="16px" _dark={{ bg: 'whiteAlpha.100' }}>
                <Box>
                  <Text fontSize="sm" color="text-muted">Amount Covered</Text>
                  <Text fontSize="xl" fontWeight={800} color="text-primary">
                    {formatCurrency(summary.active_policy.weekly_coverage)}
                  </Text>
                </Box>
                <Badge variant="solid" colorScheme={summary.active_policy.is_paid ? 'green' : 'orange'} borderRadius="999px" fontSize="sm" px={2}>
                  {summary.active_policy.is_paid ? 'Active / Paid' : 'Pending / Unpaid'}
                </Badge>
              </Flex>
              <SimpleGrid columns={2} gap={2}>
                <Box p={2}>
                  <Text fontSize="sm" color="text-muted">Your Fee</Text>
                  <Text fontWeight={700} color="text-primary">{formatCurrency(summary.active_policy.weekly_premium)}</Text>
                </Box>
                <Box p={2}>
                  <Text fontSize="sm" color="text-muted">Plan Dates</Text>
                  <Text fontWeight={700} color="text-primary" fontSize="sm">{formatDate(summary.active_policy.week_start_date)}</Text>
                </Box>
                <Box p={2}>
                  <Text fontSize="sm" color="text-muted">Area</Text>
                  <Text fontWeight={700} color="text-primary">{summary.premium_breakdown?.zone || summary.profile.zone}</Text>
                </Box>
                <Box p={2}>
                  <Text fontSize="sm" color="text-muted">Waiting Days</Text>
                  <Text fontWeight={700} color="text-primary">5 days</Text>
                </Box>
              </SimpleGrid>
              <Text fontSize="sm" color="text-muted" textAlign="center" mt={1}>
                Income Protection · Plan #{summary.active_policy.id}
              </Text>
              <Button size="sm" variant="outline" leftIcon={<Download size={14} />} mt={2} w="full"
                onClick={() => downloadCert.mutate(summary.active_policy!.id)}
                isLoading={downloadCert.isPending} loadingText="Generating PDF...">
                {summary.active_policy.is_paid ? 'Download Certificate' : 'Download Receipt'}
              </Button>
              {!summary.active_claim && (
                <Button size="sm" colorScheme="brand" leftIcon={<FileText size={14} />} mt={2} w="full"
                  onClick={() => fileClaim.mutate(undefined, {
                    onSuccess: () => {
                      toast({ title: 'Claim filed', description: 'It will be reviewed by the team.', status: 'success', duration: 5000, isClosable: true })
                      refreshAll()
                    },
                    onError: (err) => {
                      toast({ title: 'Failed', description: err.message, status: 'error', duration: 5000, isClosable: true })
                    },
                  })}
                  isLoading={fileClaim.isPending} loadingText="Filing...">
                  File a Claim
                </Button>
              )}
            </Stack>
          ) : (
            <Stack gap={3} align="center" py={3}>
              <Text color="text-secondary" fontSize="sm">No active plan</Text>
              <Button size="sm" variant="outline" onClick={() => window.location.href = '/app/policies'}>
                Get a Plan
              </Button>
            </Stack>
          )}
        </Box>

        <SmartWorkReport tip={summary.smartwork_tip} formatCurrency={formatCurrency} />
      </SimpleGrid>

      {activityItems.length > 0 && (
        <Box bg="bg-surface" borderRadius="28px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack mb={4} justify="space-between">
            <HStack>
              <Activity size={18} />
              <Heading fontSize="lg" color="text-primary">Recent Activity</Heading>
            </HStack>
            <Button
              variant="ghost"
              size="xs"
              onClick={refreshAll}
              leftIcon={<RefreshCw size={12} />}
            >
              Refresh
            </Button>
          </HStack>
          <ActivityFeed items={activityItems} />
        </Box>
      )}
    </Stack>
  )
}

function SmartWorkReport({ tip, formatCurrency: fmt }: { tip: SmartWorkTip | null | undefined; formatCurrency: (val: number) => string }) {
  const [expanded, setExpanded] = useState<number>(1)

  const slots = useMemo(() => {
    if (!tip?.recommended_slots) return []
    try { return JSON.parse(tip.recommended_slots) } catch { return [] }
  }, [tip?.recommended_slots])

  const riskOutlook = useMemo(() => {
    if (!tip?.risk_outlook) return null
    try { return JSON.parse(tip.risk_outlook) } catch { return null }
  }, [tip?.risk_outlook])

  const premiumProj = useMemo(() => {
    if (!tip?.premium_projection) return null
    try { return JSON.parse(tip.premium_projection) } catch { return null }
  }, [tip?.premium_projection])

  const cityInfo = useMemo(() => {
    if (!tip?.city_insights) return null
    try { return JSON.parse(tip.city_insights) } catch { return null }
  }, [tip?.city_insights])

  if (!tip) {
    return (
      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack mb={4}>
          <Zap size={18} color="var(--chakra-colors-brand-500)" />
          <Heading fontSize="lg" color="text-primary">SmartWork Report</Heading>
        </HStack>
        <Text color="text-secondary" fontSize="sm">
          We are collecting activity data to generate personalized recommendations.
        </Text>
      </Box>
    )
  }

  const toggleSection = (id: number) => setExpanded(expanded === id ? 0 : id)

  return (
    <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
      <HStack mb={4} justify="space-between">
        <HStack>
          <Zap size={18} color="var(--chakra-colors-brand-500)" />
          <Heading fontSize="lg" color="text-primary">SmartWork Report</Heading>
        </HStack>
        <Text fontSize="sm" color="text-secondary">Updated Today</Text>
      </HStack>
 
      <Stack gap={3}>
        <Box>
          <HStack justify="space-between" cursor="pointer" onClick={() => toggleSection(1)}>
            <HStack>
              <TrendingUp size={16} color="var(--chakra-colors-teal-500)" />
              <Text fontSize="sm" fontWeight="bold">Earnings Forecast</Text>
            </HStack>
            <ChevronDown size={14} style={{ transform: expanded === 1 ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </HStack>
          {expanded === 1 && (
            <Box mt={2} pl={6}>
              <Text fontSize="2xl" fontWeight="bold" color="text-primary">
                {tip.projected_earnings ? fmt(tip.projected_earnings) : '—'}
              </Text>
              <Text fontSize="sm" color="text-secondary" mt={1}>
                Based on historical income, city, platform, and weather conditions.
              </Text>
            </Box>
          )}
        </Box>

        <Box h="1px" bg="border-light" />

        <Box>
          <HStack justify="space-between" cursor="pointer" onClick={() => toggleSection(2)}>
            <HStack>
              <MapPin size={16} color="var(--chakra-colors-blue-500)" />
              <Text fontSize="sm" fontWeight="bold">Best Work Windows</Text>
            </HStack>
            <ChevronDown size={14} style={{ transform: expanded === 2 ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </HStack>
          {expanded === 2 && slots.length > 0 && (
            <Stack mt={2} pl={6} gap={2}>
              {slots.map((slot: any, i: number) => (
                <Box key={i} bg="bg-surface-muted" borderRadius="12px" p={3}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight={700}>{slot.time}</Text>
                    <Badge colorScheme={slot.demand === 'Very High' ? 'red' : slot.demand === 'High' ? 'orange' : 'yellow'} variant="subtle" fontSize="sm">
                      {slot.demand} demand expected
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="text-secondary" mt={1}>{slot.reason}</Text>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Box h="1px" bg="border-light" />

        <Box>
          <HStack justify="space-between" cursor="pointer" onClick={() => toggleSection(3)}>
            <HStack>
              <AlertTriangle size={16} color="var(--chakra-colors-orange-500)" />
              <Text fontSize="sm" fontWeight="bold">Risk Awareness</Text>
            </HStack>
            <ChevronDown size={14} style={{ transform: expanded === 3 ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </HStack>
          {expanded === 3 && riskOutlook && (
            <Box mt={2} pl={6}>
              <Badge bg={riskOutlook.category === 'LOW' ? 'teal.50' : riskOutlook.category === 'MEDIUM' ? 'yellow.50' : riskOutlook.category === 'HIGH' ? 'orange.50' : 'red.50'}
                color={riskOutlook.category === 'LOW' ? 'teal.700' : riskOutlook.category === 'MEDIUM' ? 'yellow.800' : riskOutlook.category === 'HIGH' ? 'orange.700' : 'red.700'}
                px={2} py={0.5} borderRadius="md" fontSize="sm" fontWeight="bold" textTransform="uppercase">
                {riskOutlook.category}
              </Badge>
              <Text fontSize="sm" color="text-secondary" mt={2}>{riskOutlook.warning}</Text>
              <Text fontSize="sm" color="text-muted" mt={1}>{riskOutlook.advice}</Text>
            </Box>
          )}
        </Box>

        <Box h="1px" bg="border-light" />

        <Box>
          <HStack justify="space-between" cursor="pointer" onClick={() => toggleSection(4)}>
            <HStack>
              <DollarSign size={16} color="var(--chakra-colors-green-500)" />
              <Text fontSize="sm" fontWeight="bold">Premium Impact</Text>
            </HStack>
            <ChevronDown size={14} style={{ transform: expanded === 4 ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </HStack>
          {expanded === 4 && premiumProj && (
            <Box mt={2} pl={6}>
              <Text fontSize="sm" color="text-secondary">{premiumProj.impact}</Text>
              <HStack mt={2} gap={6}>
                <Box>
                  <Text fontSize="sm" color="text-muted">Current Premium</Text>
                  <Text fontSize="md" fontWeight="bold">{fmt(premiumProj.current_premium)}</Text>
                </Box>
                {premiumProj.savings !== 0 && (
                  <Box>
                    <Text fontSize="sm" color="text-muted">Projected</Text>
                    <Text fontSize="md" fontWeight="bold" color={premiumProj.projected_premium < premiumProj.current_premium ? 'green.600' : 'orange.600'}>
                      {fmt(premiumProj.projected_premium)}
                    </Text>
                  </Box>
                )}
              </HStack>
            </Box>
          )}
        </Box>

        <Box h="1px" bg="border-light" />

        <Box>
          <HStack justify="space-between" cursor="pointer" onClick={() => toggleSection(5)}>
            <HStack>
              <CloudRain size={16} color="var(--chakra-colors-purple-500)" />
              <Text fontSize="sm" fontWeight="bold">City Insights</Text>
            </HStack>
            <ChevronDown size={14} style={{ transform: expanded === 5 ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </HStack>
          {expanded === 5 && cityInfo && (
            <Box mt={2} pl={6}>
              <Heading fontSize="sm" color="text-primary">{cityInfo.city} Market Insights</Heading>
              <Text fontSize="sm" color="text-secondary" mt={1}>{cityInfo.description}</Text>
              <Stack mt={2} gap={1.5}>
                <Text fontSize="sm" color="text-muted">{cityInfo.demand_trend}</Text>
                <Text fontSize="sm" color="text-muted">{cityInfo.weather_disruption_risk}</Text>
                <Text fontSize="sm" color="text-muted">{cityInfo.peak_day}</Text>
              </Stack>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  )
}
