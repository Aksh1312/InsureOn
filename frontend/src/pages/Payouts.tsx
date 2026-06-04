import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react'
import { usePayoutHistory } from '../hooks/usePayouts'
import SectionTitle from '../components/SectionTitle'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatDate } from '../utils/format'
import { RefreshCw } from 'lucide-react'
import { queryClient } from '../lib/query'
import { QUERY_KEYS } from '../lib/query'

export default function Payouts() {
  const { data: payouts = [], isLoading, isError, isFetching } = usePayoutHistory()

  const totalPaid = payouts.filter((p) => p.is_sent).reduce((sum, p) => sum + p.amount, 0)

  if (isLoading) return <DashboardSkeleton />

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Payments"
        title="Track your payments"
        subtitle="All payments"
      />
      {isError && (
        <Text fontSize="sm" color="red.500">
          Could not load
        </Text>
      )}

       <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
         <HStack justify="space-between" align="center" mb={4}>
           <Heading fontSize="lg" color="text-primary">
              Payment History
           </Heading>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payoutHistory })}
             isLoading={isFetching}
           >
             <RefreshCw size={16} />
           </Button>
         </HStack>
         <Box h="1px" bg="border-light" mb={4} />
         <Stack gap={4}>
           <Text fontWeight={600} color="text-primary">
             Total Paid: {formatCurrency(totalPaid)}
           </Text>
           {payouts.length ? (
             payouts.map((payout) => (
               <Box key={payout.id} bg="bg-surface-muted" p={4} borderRadius="16px">
                 <HStack justify="space-between" align="start" flexWrap="wrap" gap={3}>
                   <Box>
                     <Text fontWeight={600} color="text-primary">
                        {formatCurrency(payout.amount)} · Request #{payout.claim_id}
                     </Text>
                     <Text fontSize="sm" color="text-secondary">
                        Alert: {formatDate(payout.trigger_date)} · {payout.alert_level}
                     </Text>
                   </Box>
                   <Badge colorScheme={payout.is_sent ? 'teal' : 'orange'}>
                     {payout.is_sent ? 'Sent' : 'Wait'}
                   </Badge>
                 </HStack>
                 <Text mt={3} fontSize="sm" color="text-secondary">
                    UPI {payout.upi_id} · {payout.transaction_id || 'Wait'}
                 </Text>
               </Box>
             ))
           ) : (
              <Text color="text-secondary">None yet</Text>
           )}
         </Stack>
       </Box>
    </Stack>
  )
}
