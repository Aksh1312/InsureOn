import { Box, HStack, Text, Stack, Badge } from '@chakra-ui/react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

type TimelineStep = {
  label: string
  timestamp?: string
  status: 'completed' | 'current' | 'pending' | 'failed'
  description?: string
}

type TransactionTimelineProps = {
  steps: TimelineStep[]
  title?: string
}

const STATUS_ICON = {
  completed: { icon: CheckCircle, color: 'teal.500' },
  current: { icon: Clock, color: 'orange.500' },
  pending: { icon: Clock, color: 'text-muted' },
  failed: { icon: XCircle, color: 'red.500' },
}

export default function TransactionTimeline({ steps, title }: TransactionTimelineProps) {
  return (
    <Box>
      {title && (
        <Text fontSize="sm" fontWeight={600} color="text-secondary" mb={4}>{title}</Text>
      )}
      <Stack gap={0} position="relative">
        {steps.map((step, i) => {
          const meta = STATUS_ICON[step.status]
          const Icon = meta.icon
          const isLast = i === steps.length - 1
          return (
            <HStack key={step.label} gap={4} align="start" position="relative">
              <Stack align="center" gap={0}>
                <Icon size={18} color={meta.color} />
                {!isLast && (
                  <Box
                    w="2px"
                    flex={1}
                    minH="24px"
                    bg={step.status === 'completed' ? 'teal.200' : 'border-light'}
                  />
                )}
              </Stack>
              <Box pb={isLast ? 0 : 4} flex={1}>
                <HStack justify="space-between" align="center">
                  <Text
                    fontSize="sm"
                    fontWeight={step.status === 'current' ? 700 : 500}
                    color={step.status === 'pending' ? 'text-muted' : 'text-primary'}
                  >
                    {step.label}
                  </Text>
                  <HStack gap={2}>
                    {step.timestamp && (
                      <Text fontSize="xs" color="text-muted">{step.timestamp}</Text>
                    )}
                    {step.status === 'failed' && (
                      <Badge colorScheme="red" fontSize="2xs">Failed</Badge>
                    )}
                    {step.status === 'current' && (
                      <Badge colorScheme="orange" fontSize="2xs">In Progress</Badge>
                    )}
                  </HStack>
                </HStack>
                {step.description && (
                  <Text fontSize="xs" color="text-secondary" mt={1}>{step.description}</Text>
                )}
              </Box>
            </HStack>
          )
        })}
      </Stack>
    </Box>
  )
}
