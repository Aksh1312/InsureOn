import {
  Badge,
  Box,
  Heading,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import * as api from '../api'
import type { Payout } from '../api/types'
import SectionTitle from '../components/SectionTitle'
import { formatCurrency, formatDate } from '../utils/format'

export default function Payouts() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getPayoutHistory()
      .then(setPayouts)
      .catch((error) => setError(error instanceof Error ? error.message : 'Please try again.'))
  }, [])

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Payouts"
        title="Track disbursements and claim payouts"
        subtitle="View your UPI payouts and transaction details."
      />
      {error ? (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      ) : null}

      <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        <Heading fontSize="lg" color="ink.900">
          Payout history
        </Heading>
        <Box h="1px" bg="blackAlpha.200" my={4} />
        <Stack gap={4}>
          {payouts.length ? (
            payouts.map((payout) => (
              <Box key={payout.id} bg="ink.50" p={4} borderRadius="16px">
                <HStack justify="space-between" align="start" flexWrap="wrap" gap={3}>
                  <Box>
                    <Text fontWeight={600} color="ink.900">
                      {formatCurrency(payout.amount)} · Claim #{payout.claim_id}
                    </Text>
                    <Text fontSize="sm" color="ink.600">
                      Triggered {formatDate(payout.trigger_date)} · {payout.alert_level}
                    </Text>
                  </Box>
                  <Badge colorScheme={payout.is_sent ? 'teal' : 'orange'}>
                    {payout.is_sent ? 'Sent' : 'Pending'}
                  </Badge>
                </HStack>
                <Text mt={3} fontSize="sm" color="ink.600">
                  UPI {payout.upi_id} · Txn {payout.transaction_id || 'Pending'}
                </Text>
              </Box>
            ))
          ) : (
            <Text color="ink.600">No payouts yet.</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
