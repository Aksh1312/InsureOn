import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { Clock, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { useActivePolicy, usePolicyHistory, useIssuePolicy, usePayPolicy, useDownloadPolicyCertificate } from '../hooks/usePolicies'
import SectionTitle from '../components/SectionTitle'
import AmountDisplay from '../components/fintech/AmountDisplay'
import EmptyState from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { formatDate } from '../utils/format'

export default function Policies() {
  const { data: active, isLoading: activeLoading } = useActivePolicy()
  const { data: history = [], isLoading: historyLoading } = usePolicyHistory()
  const issuePolicy = useIssuePolicy()
  const payPolicy = usePayPolicy()
  const downloadCert = useDownloadPolicyCertificate()
  const toast = useToast()

  const handleIssue = () => {
    issuePolicy.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'Done', status: 'success', duration: 3000 })
      },
      onError: (err) => {
        toast({ title: 'Failed', description: err.message, status: 'error', duration: 4000 })
      },
    })
  }

  const handlePay = (policyId: number) => {
    payPolicy.mutate(policyId, {
      onSuccess: () => {
        toast({ title: 'Paid', description: 'Active', status: 'success', duration: 3000 })
      },
      onError: (err) => {
        toast({ title: 'Failed', description: err.message, status: 'error', duration: 4000 })
      },
    })
  }

  if (activeLoading || historyLoading) return <DashboardSkeleton />

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Plan"
        title="Your plans"
        subtitle="Weekly pay plans"
      />

      <Box
        bg="bg-surface"
        borderRadius="28px"
        p={6}
        borderWidth="1px"
        borderColor="border-light"
      >
        <HStack justify="space-between" align="start" wrap="wrap" gap={4}>
          <Box>
            <Heading fontSize="lg" color="text-primary">
              Your Plan for This Week
            </Heading>
            <Text mt={1} color="text-secondary" fontSize="sm">
              {active
                ? `Starts ${formatDate(active.week_start_date)}. Area: ${active.zone}.`
                : 'No plan this week.'}
            </Text>
          </Box>
          <Button
            onClick={handleIssue}
            isLoading={issuePolicy.isPending}
            loadingText="Issuing..."
            isDisabled={!!active}
          >
            {active ? 'Active' : 'Create New Plan'}
          </Button>
        </HStack>

        {active ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mt={6}>
            <Box p={4} bg="teal.50" borderRadius="16px">
              <Text fontSize="sm" color="teal.600" fontWeight={600}>Amount Covered</Text>
              <AmountDisplay amount={active.weekly_coverage} size="xl" colorScheme="positive" />
              <Text fontSize="sm" color="teal.500" mt={1}>70% of income</Text>
            </Box>
            <Box p={4} bg="brand.50" borderRadius="16px">
              <Text fontSize="sm" color="brand.600" fontWeight={600}>Weekly Fee</Text>
              <AmountDisplay amount={active.weekly_premium} size="xl" />
              <Text fontSize="sm" color="brand.500" mt={1}>Type: {active.tier}. Area: {active.zone}.</Text>
            </Box>
            <Box p={4} bg={active.is_paid ? 'teal.50' : 'orange.50'} borderRadius="16px">
              <Text fontSize="sm" color={active.is_paid ? 'teal.600' : 'orange.600'} fontWeight={600}>Status</Text>
              <HStack mt={2} gap={2}>
                {active.is_paid ? (
                  <CheckCircle size={24} color="var(--chakra-colors-teal-500)" />
                ) : (
                  <Clock size={24} color="var(--chakra-colors-orange-500)" />
                )}
                <Text fontWeight={700} fontSize="lg" color={active.is_paid ? 'teal.700' : 'orange.700'}>
                  {active.is_paid ? 'Paid' : 'Pay now'}
                </Text>
              </HStack>
              {active.is_paid ? (
                <Button mt={3} size="sm" leftIcon={<Download size={14} />}
                  onClick={() => downloadCert.mutate(active.id)}
                  isLoading={downloadCert.isPending} loadingText="Generating PDF..." w="full">
                  Download Certificate
                </Button>
              ) : (
                <Stack mt={3} gap={2} w="full">
                  <Button size="sm" onClick={() => handlePay(active.id)} isLoading={payPolicy.isPending} w="full">
                    Pay {active.weekly_premium}
                  </Button>
                  <Button size="sm" variant="outline" leftIcon={<Download size={14} />}
                    onClick={() => downloadCert.mutate(active.id)}
                    isLoading={downloadCert.isPending} loadingText="Generating PDF..." w="full">
                    Download Receipt
                  </Button>
                </Stack>
              )}
            </Box>
          </SimpleGrid>
        ) : (
          <Box mt={6} p={4} bg="bg-surface-muted" borderRadius="16px">
            <HStack gap={3}>
              <AlertCircle size={20} color="var(--chakra-colors-text-muted)" />
              <Text fontSize="sm" color="text-secondary">
                No plan. Create one.
              </Text>
            </HStack>
          </Box>
        )}
      </Box>

      <Box>
        <Heading fontSize="lg" color="text-primary" mb={4}>
          Past Plans
        </Heading>
        {history.length === 0 ? (
          <EmptyState
            variant="compact"
            icon="📜"
            title="No past plans"
            message="Check back"
          />
        ) : (
          <Stack gap={3}>
            {history.map((policy) => (
              <Box
                key={policy.id}
                bg="bg-surface"
                borderRadius="16px"
                p={5}
                borderWidth="1px"
                borderColor="border-muted"
              >
                <HStack justify="space-between" align="start" wrap="wrap" gap={4}>
                  <Box>
                    <Text fontWeight={600} color="text-primary">
                      {formatDate(policy.week_start_date)} — {formatDate(policy.week_end_date)}
                    </Text>
                    <Text fontSize="sm" color="text-secondary">
                      Area: {policy.zone}. Tier: {policy.tier}.
                    </Text>
                  </Box>
                  <HStack gap={3}>
                    <AmountDisplay amount={policy.weekly_premium} size="sm" />
                    <Badge colorScheme={policy.is_paid ? 'teal' : 'orange'}>
                      {policy.is_paid ? 'Paid' : 'Unpaid'}
                    </Badge>
                    {policy.is_paid && (
                      <Button size="sm" variant="outline" leftIcon={<Download size={12} />}
                        onClick={() => downloadCert.mutate(policy.id)}
                        isLoading={downloadCert.isPending && downloadCert.variables === policy.id}
                        loadingText="PDF...">
                        Certificate
                      </Button>
                    )}
                    {!policy.is_paid && (
                      <Button size="sm" onClick={() => handlePay(policy.id)} isLoading={payPolicy.isPending}>
                        Pay
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
