import {
  Box,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Flex,
} from '@chakra-ui/react'
import {
  Wallet,
  ArrowUpRight,
  Download,
  CheckCircle,
  RefreshCw,
  Receipt,
  TrendingUp,
  Shield,
  Activity,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useWalletTransactions } from '../hooks/useWallet'
import { useDashboard } from '../hooks/useDashboard'
import SectionTitle from '../components/SectionTitle'
import AmountDisplay from '../components/fintech/AmountDisplay'
import EmptyState from '../components/ui/EmptyState'
import { TimelineSkeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatDate } from '../utils/format'
import type { TransactionItem } from '../api/types'

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  PREMIUM_PAYMENT: { label: 'Premium Payment', icon: '💳', color: 'blue' },
  CLAIM_PAYOUT: { label: 'Claim Payout', icon: '💰', color: 'teal' },
  POLICY_RENEWAL: { label: 'Policy Renewal', icon: '🔄', color: 'purple' },
  REFUND: { label: 'Refund', icon: '↩️', color: 'orange' },
  ADJUSTMENT: { label: 'Adjustment', icon: '⚖️', color: 'yellow' },
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'green',
  PENDING: 'orange',
  FAILED: 'red',
}

function TransactionRow({ txn }: { txn: TransactionItem }) {
  const cfg = TYPE_CONFIG[txn.transaction_type] || { label: txn.transaction_type, icon: '📄', color: 'gray' }
  const statusColor = STATUS_COLORS[txn.status] || 'gray'
  const date = formatDate(txn.created_at)

  return (
    <Box
      p={4}
      bg="bg-surface"
      borderRadius="16px"
      borderWidth="1px"
      borderColor="border-light"
      transition="all 0.2s"
      _hover={{ shadow: 'sm' }}
    >
      <HStack justify="space-between" align="start" wrap="wrap" gap={3}>
        <HStack gap={3} flex={1}>
          <Text fontSize="xl">{cfg.icon}</Text>
          <Box>
            <HStack gap={2} mb={0.5}>
              <Text fontWeight={600} fontSize="sm" color="text-primary">
                {cfg.label}
              </Text>
              <Badge colorScheme={statusColor} fontSize="2xs" px={2} borderRadius="999px">
                {txn.status}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="text-secondary">{date}</Text>
            {txn.description && (
              <Text fontSize="xs" color="text-muted" mt={0.5}>{txn.description}</Text>
            )}
          </Box>
        </HStack>
        <Text fontWeight={700} fontSize="md" color="text-primary" whiteSpace="nowrap">
          {txn.transaction_type === 'PREMIUM_PAYMENT' || txn.transaction_type === 'POLICY_RENEWAL' ? '- ' : '+ '}
          {formatCurrency(txn.amount)}
        </Text>
      </HStack>
    </Box>
  )
}

function GroupedTransactions({ date, txns }: { date: string; txns: TransactionItem[] }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={2} px={1}>
        {date} · {txns.length} transaction{txns.length !== 1 ? 's' : ''}
      </Text>
      <Stack gap={2}>
        {txns.map((txn) => (
          <TransactionRow key={txn.id} txn={txn} />
        ))}
      </Stack>
    </Box>
  )
}

export default function PayoutCenter() {
  const { data: transactions = [], isLoading, isFetching } = useWalletTransactions()
  const { data: summary } = useDashboard()
  const [activeTab, setActiveTab] = useState(0)

  const totalPremiums = useMemo(
    () => transactions
      .filter(t => t.transaction_type === 'PREMIUM_PAYMENT' && t.status === 'SUCCESS')
      .reduce((s, t) => s + t.amount, 0),
    [transactions],
  )
  const totalPayouts = useMemo(
    () => transactions
      .filter(t => t.transaction_type === 'CLAIM_PAYOUT' && t.status === 'SUCCESS')
      .reduce((s, t) => s + t.amount, 0),
    [transactions],
  )
  const lifetimeTxns = transactions.length

  const netCoverage = totalPayouts - totalPremiums

  const filteredTransactions = useMemo(() => {
    switch (activeTab) {
      case 1: return transactions.filter(t => t.transaction_type === 'PREMIUM_PAYMENT')
      case 2: return transactions.filter(t => t.transaction_type === 'CLAIM_PAYOUT')
      case 3: return transactions.filter(t => t.transaction_type === 'POLICY_RENEWAL')
      default: return transactions
    }
  }, [transactions, activeTab])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {}
    filteredTransactions.forEach((t) => {
      const dateKey = formatDate(t.created_at)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredTransactions])

  if (isLoading) return <TimelineSkeleton />

  return (
    <Stack gap={8}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <SectionTitle
          kicker="Wallet"
          title="Transaction Ledger"
          subtitle="Complete financial history"
        />
        {isFetching && (
          <HStack gap={1} color="text-muted">
            <RefreshCw size={14} />
            <Text fontSize="xs">Refreshing...</Text>
          </HStack>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="text-secondary">Total Premiums Paid</Text>
            <Receipt size={18} color="var(--chakra-colors-brand-500)" />
          </HStack>
          <AmountDisplay amount={totalPremiums} size="2xl" colorScheme="positive" />
          <Text fontSize="xs" color="text-muted" mt={1}>Lifetime premium payments</Text>
        </Box>
        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="text-secondary">Total Payouts Received</Text>
            <TrendingUp size={18} color="var(--chakra-colors-teal-500)" />
          </HStack>
          <AmountDisplay amount={totalPayouts} size="2xl" colorScheme="positive" />
          <Text fontSize="xs" color="text-muted" mt={1}>From {transactions.filter(t => t.transaction_type === 'CLAIM_PAYOUT').length} claim payouts</Text>
        </Box>
        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="text-secondary">Coverage Balance</Text>
            <Shield size={18} color={netCoverage >= 0 ? 'var(--chakra-colors-teal-500)' : 'var(--chakra-colors-red-500)'} />
          </HStack>
          <AmountDisplay amount={netCoverage} size="2xl" colorScheme={netCoverage >= 0 ? 'positive' : 'negative'} />
          <Text fontSize="xs" color="text-muted" mt={1}>Payouts minus premiums</Text>
        </Box>
        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="text-secondary">Lifetime Transactions</Text>
            <Activity size={18} color="var(--chakra-colors-purple-500)" />
          </HStack>
          <Text fontWeight={800} fontSize="3xl" color="text-primary">{lifetimeTxns}</Text>
          <Text fontSize="xs" color="text-muted" mt={1}>All financial activity</Text>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="text-secondary">Fee</Text>
            <ArrowUpRight size={18} color="var(--chakra-colors-brand-500)" />
          </HStack>
          <AmountDisplay amount={summary?.active_policy?.weekly_premium} size="2xl" />
          <Text fontSize="xs" color="text-muted" mt={1}>
            {summary?.active_policy?.is_paid ? (
              <HStack gap={1}>
                <CheckCircle size={12} color="var(--chakra-colors-teal-500)" />
                <Text color="teal.600">Paid ✓</Text>
              </HStack>
            ) : (
              'Due this week.'
            )}
          </Text>
        </Box>
        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="text-secondary">UPI ID</Text>
            <Download size={18} color="var(--chakra-colors-blue-500)" />
          </HStack>
          <Text fontWeight={700} fontSize="lg" color="text-primary" fontFamily="mono">
            {summary?.user?.upi_id || '—'}
          </Text>
          <Text fontSize="xs" color="text-muted" mt={1}>
            Your UPI
          </Text>
        </Box>
        {summary?.active_policy?.weekly_coverage && (
          <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="text-secondary">Coverage</Text>
              <Wallet size={18} color="var(--chakra-colors-brand-500)" />
            </HStack>
            <AmountDisplay amount={summary.active_policy.weekly_coverage} size="2xl" />
            <Text fontSize="xs" color="text-muted" mt={1}>Protected this week</Text>
          </Box>
        )}
      </SimpleGrid>

      <Box bg="bg-surface" borderRadius="28px" p={6} borderWidth="1px" borderColor="border-light">
        <Tabs variant="soft-rounded" colorScheme="brand" onChange={setActiveTab} index={activeTab}>
          <TabList mb={6}>
            <Tab>All ({transactions.length})</Tab>
            <Tab>Premiums ({transactions.filter(t => t.transaction_type === 'PREMIUM_PAYMENT').length})</Tab>
            <Tab>Payouts ({transactions.filter(t => t.transaction_type === 'CLAIM_PAYOUT').length})</Tab>
            <Tab>Renewals ({transactions.filter(t => t.transaction_type === 'POLICY_RENEWAL').length})</Tab>
          </TabList>
          <TabPanels>
            {[0, 1, 2, 3].map((idx) => (
              <TabPanel key={idx} px={0}>
                {filteredTransactions.length === 0 ? (
                  <EmptyState
                    variant="compact"
                    icon="💳"
                    title={idx === 1 ? 'No premiums yet' : idx === 2 ? 'No payouts yet' : idx === 3 ? 'No renewals yet' : 'No transactions yet'}
                    message={idx === 0 ? 'Premium payments and claim payouts appear here.' : ''}
                  />
                ) : (
                  <Stack gap={6}>
                    {groupedByDate.map(([date, txns]) => (
                      <GroupedTransactions key={date} date={date} txns={txns} />
                    ))}
                  </Stack>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </Stack>
  )
}
