import { Box, Text, HStack, Badge, Progress, Spinner, Flex } from '@chakra-ui/react'
import { Calendar } from 'lucide-react'
import { useRenewalPreview } from '../../hooks/usePolicies'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ELIGIBLE: { label: 'Eligible for Renewal', color: 'green' },
  EXPIRED: { label: 'Expired', color: 'red' },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'yellow' },
  NO_POLICY: { label: 'No Policy', color: 'gray' },
}

export default function PolicyRenewalCard() {
  const { data, isLoading, isError } = useRenewalPreview()

  if (isLoading) {
    return (
      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack gap={2} mb={4}>
          <Calendar size={18} color="var(--chakra-colors-brand-500)" />
          <Text fontSize="lg" fontWeight={600} color="text-primary">Upcoming Renewal</Text>
        </HStack>
        <HStack gap={2}>
          <Spinner size="sm" />
          <Text fontSize="sm" color="text-secondary">Loading renewal info...</Text>
        </HStack>
      </Box>
    )
  }

  if (isError || !data || data.renewal_status === 'NO_POLICY') {
    return null
  }

  const statusInfo = STATUS_LABELS[data.renewal_status] || STATUS_LABELS.NO_POLICY
  const progressValue = Math.max(0, Math.min(100, (data.days_remaining / 7) * 100))

  return (
    <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
      <HStack gap={2} mb={4}>
        <Calendar size={18} color="var(--chakra-colors-brand-500)" />
        <Text fontSize="lg" fontWeight={600} color="text-primary">Upcoming Renewal</Text>
      </HStack>

      <Flex align="center" gap={3} mb={4}>
        <Text fontSize="3xl" fontWeight={800} color="text-primary">
          {data.days_remaining}
        </Text>
        <Box>
          <Text fontSize="sm" fontWeight={600} color="text-primary">Days Remaining</Text>
          <Text fontSize="2xs" color="text-muted">of 7 day coverage</Text>
        </Box>
      </Flex>

      <Progress
        value={progressValue}
        colorScheme={data.days_remaining <= 1 ? 'red' : data.days_remaining <= 3 ? 'orange' : 'brand'}
        borderRadius="999px"
        size="sm"
        mb={5}
      />

      <Flex gap={4} mb={4} wrap="wrap">
        <Box flex={1} minW="100px">
          <Text fontSize="2xs" color="text-muted" mb={0.5}>Current Premium</Text>
          <Text fontSize="lg" fontWeight={700} color="text-primary">₹{data.current_premium}</Text>
        </Box>
        <Box flex={1} minW="100px">
          <Text fontSize="2xs" color="text-muted" mb={0.5}>Next Week Premium</Text>
          <Text fontSize="lg" fontWeight={700} color="brand.500">₹{data.next_week_premium}</Text>
        </Box>
      </Flex>

      <Flex gap={4} mb={4} wrap="wrap">
        <Box flex={1} minW="100px">
          <Text fontSize="2xs" color="text-muted" mb={0.5}>Current Coverage</Text>
          <Text fontSize="md" fontWeight={600} color="text-primary">₹{data.current_coverage.toLocaleString('en-IN')}</Text>
        </Box>
        <Box flex={1} minW="100px">
          <Text fontSize="2xs" color="text-muted" mb={0.5}>Next Week Coverage</Text>
          <Text fontSize="md" fontWeight={600} color="brand.500">₹{data.next_week_coverage.toLocaleString('en-IN')}</Text>
        </Box>
      </Flex>

      <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="border-light">
        <Text fontSize="xs" color="text-secondary">Status:</Text>
        <Badge colorScheme={statusInfo.color} borderRadius="999px" px={2.5} py={0.5} fontSize="2xs">
          {statusInfo.label}
        </Badge>
      </Flex>
    </Box>
  )
}