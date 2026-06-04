import { Box, HStack, Text, Stack, Badge } from '@chakra-ui/react'
import { Bell, Shield, DollarSign, CloudRain, FileText, Zap, CreditCard } from 'lucide-react'

export type ActivityItemData = {
  id: string
  type: 'claim' | 'payout' | 'policy' | 'alert' | 'fraud' | 'smartwork' | 'premium'
  title: string
  description: string
  timestamp: string
  relativeTime?: string
  status?: string
  category?: string
  categoryColor?: string
}

const ICON_MAP = {
  claim: { icon: FileText, color: 'orange.500', bg: 'orange.50', darkBg: 'orange.800' },
  payout: { icon: DollarSign, color: 'teal.500', bg: 'teal.50', darkBg: 'teal.800' },
  policy: { icon: Shield, color: 'brand.500', bg: 'brand.50', darkBg: 'brand.800' },
  alert: { icon: CloudRain, color: 'red.500', bg: 'red.50', darkBg: 'red.800' },
  fraud: { icon: Bell, color: 'purple.500', bg: 'purple.50', darkBg: 'purple.800' },
  smartwork: { icon: Zap, color: 'blue.500', bg: 'blue.50', darkBg: 'blue.800' },
  premium: { icon: CreditCard, color: 'green.500', bg: 'green.50', darkBg: 'green.800' },
}

const STATUS_COLORS: Record<string, string> = {
  Completed: 'teal',
  Pending: 'orange',
  Active: 'blue',
  Rejected: 'red',
  New: 'purple',
  Paid: 'green',
  Monitoring: 'orange',
  Closed: 'gray',
}

export default function ActivityFeed({ items }: { items: ActivityItemData[] }) {
  if (!items.length) {
    return (
      <Box textAlign="center" py={8} color="text-muted">
        <Text fontSize="sm">No recent activity</Text>
      </Box>
    )
  }

  return (
    <Stack gap={2}>
      {items.map((item) => {
        const meta = ICON_MAP[item.type]
        const Icon = meta.icon
        return (
          <HStack
            key={item.id}
            gap={3}
            p={3}
            bg="bg-surface"
            borderRadius="14px"
            borderWidth="1px"
            borderColor="border-muted"
            _hover={{ borderColor: 'border-light', bg: 'bg-surface-muted', _dark: { bg: 'whiteAlpha.100' } }}
            transition="all 0.15s"
          >
            <Box p={2} bg={meta.bg} _dark={{ bg: meta.darkBg }} borderRadius="10px" flexShrink={0}>
              <Icon size={16} color={meta.color} />
            </Box>
            <Box flex="1" minW={0}>
              <Text fontWeight={600} fontSize="sm" color="text-primary" noOfLines={1}>
                {item.title}
              </Text>
              <Text fontSize="xs" color="text-secondary" noOfLines={1}>
                {item.description}
              </Text>
            </Box>
            <Stack align="flex-end" gap={1} flexShrink={0}>
              <Text fontSize="2xs" color="text-muted" whiteSpace="nowrap">
                {item.relativeTime || item.timestamp}
              </Text>
              {item.status && (
                <Badge
                  colorScheme={STATUS_COLORS[item.status] || 'gray'}
                  fontSize="2xs"
                  px={2}
                  py={0.5}
                >
                  {item.status}
                </Badge>
              )}
            </Stack>
          </HStack>
        )
      })}
    </Stack>
  )
}

export function ActivityFeedSkeleton() {
  return (
    <Stack gap={2}>
      {[1, 2, 3].map((i) => (
        <HStack key={i} gap={3} p={3}>
          <Box boxSize="36px" bg="blackAlpha.100" borderRadius="10px" flexShrink={0} _dark={{ bg: 'whiteAlpha.100' }} />
          <Box flex={1}>
            <Box h="14px" w="60%" bg="blackAlpha.100" borderRadius="4px" mb={1} _dark={{ bg: 'whiteAlpha.100' }} />
            <Box h="10px" w="80%" bg="blackAlpha.50" borderRadius="4px" _dark={{ bg: 'whiteAlpha.50' }} />
          </Box>
          <Box h="10px" w="50px" bg="blackAlpha.50" borderRadius="4px" _dark={{ bg: 'whiteAlpha.50' }} />
        </HStack>
      ))}
    </Stack>
  )
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'gray'
}
