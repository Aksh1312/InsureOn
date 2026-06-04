import {
  Box,
  Text,
  Stack,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Button,
  HStack,
  Flex,
  useBreakpointValue,
  Drawer,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { Bell, BellDot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications'

const TYPE_ICON: Record<string, string> = {
  POLICY_CREATED: '\u2713',
  POLICY_RENEWED: '\u2713',
  PREMIUM_PAID: '\u20B9',
  CLAIM_OPENED: '\u26A0',
  CLAIM_REJECTED: '\u2716',
  CLAIM_APPROVED: '\u2713',
  FRAUD_REVIEW: '\u26A0',
  PAYOUT_SENT: '\u20B9',
  SMARTWORK_ALERT: '\uD83D\uDCA1',
  WEATHER_ALERT: '\u26A1',
  SYSTEM: '\u2139',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function navigateFromNotification(navigate: ReturnType<typeof useNavigate>, n: { type: string; metadata_json: string | null }) {
  let claimId: number | null = null
  if (n.metadata_json) {
    try {
      const meta = JSON.parse(n.metadata_json)
      claimId = meta.claim_id ?? null
    } catch {}
  }
  const claimTypes = ['CLAIM_OPENED', 'CLAIM_REJECTED', 'CLAIM_APPROVED', 'FRAUD_REVIEW']
  if (claimTypes.includes(n.type)) {
    navigate(claimId ? `/app/claims?claim=${claimId}` : '/app/claims')
  } else if (n.type === 'PAYOUT_SENT') {
    navigate('/app/payout-center')
  }
}

export default function NotificationCenter() {
  const navigate = useNavigate()
  const { data: notifications } = useNotifications()
  const { data: unread } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })

  const count = unread?.count ?? 0
  const list = notifications ?? []
  const recent = list.slice(0, 10)

  const trigger = (
    <Box position="relative" cursor="pointer" onClick={onOpen}>
      <IconButton
        aria-label="Notifications"
        variant="ghost"
        size="sm"
        icon={count > 0 ? <BellDot size={20} /> : <Bell size={20} />}
        color="text-primary"
      />
      {count > 0 && (
        <Box
          position="absolute"
          top="6px"
          right="6px"
          boxSize="18px"
          bg="red.500"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="10px"
          fontWeight={700}
          color="white"
          lineHeight="1"
          zIndex={1}
          pointerEvents="none"
        >
          {count > 9 ? '9+' : count}
        </Box>
      )}
    </Box>
  )

  const panel = (
    <Box>
      <Flex justify="space-between" align="center" px={4} py={3} borderBottomWidth="1px" borderColor="border-muted">
        <Text fontWeight={600} color="text-primary">Notifications</Text>
        {count > 0 && (
          <Button size="xs" variant="ghost" fontSize="xs" onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
        )}
      </Flex>
      {recent.length === 0 ? (
        <Box p={8} textAlign="center">
          <Text fontSize="4xl" mb={2}>&#128276;</Text>
          <Text fontSize="sm" color="text-muted">No notifications yet</Text>
        </Box>
      ) : (
        <Stack gap={0}>
          {recent.map((n) => (
            <Box
              key={n.id}
              p={4}
              bg={n.is_read ? 'bg-surface' : 'brand.50'}
              _dark={{ bg: n.is_read ? undefined : 'whiteAlpha.100' }}
              borderBottomWidth="1px"
              borderColor="border-muted"
              cursor="pointer"
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id)
                navigateFromNotification(navigate, n)
              }}
              _hover={{ bg: 'blackAlpha.50', _dark: { bg: 'whiteAlpha.200' } }}
              transition="background 0.15s"
            >
              <HStack gap={3} align="start">
                <Text fontSize="lg" mt={0.5}>{TYPE_ICON[n.type] || '\u2139'}</Text>
                <Box flex={1}>
                  <HStack justify="space-between" mb={0.5}>
                    <Text fontSize="sm" fontWeight={600} color="text-primary">
                      {n.title}
                    </Text>
                    <Text fontSize="2xs" color="text-muted" whiteSpace="nowrap">
                      {timeAgo(n.created_at)}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="text-secondary" noOfLines={2}>
                    {n.message}
                  </Text>
                </Box>
              </HStack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="full">
          <DrawerOverlay />
          <DrawerContent bg="bg-body">
            <DrawerCloseButton />
            <DrawerHeader p={0}>{panel}</DrawerHeader>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <Popover placement="bottom-end" closeOnBlur={false}>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent w="380px" maxH="480px" overflow="hidden" display="flex" flexDirection="column" bg="bg-surface" borderColor="border-light">
        <PopoverArrow />
        <PopoverBody p={0} overflowY="auto" flex={1}>
          {panel}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
