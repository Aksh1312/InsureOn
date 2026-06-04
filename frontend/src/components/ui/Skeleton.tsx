import { Box, Skeleton as CSkeleton, SkeletonCircle, SkeletonText, SimpleGrid, Stack } from '@chakra-ui/react'

export function StatCardSkeleton() {
  return (
    <Box bg="bg-surface" borderWidth="1px" borderColor="border-light" borderRadius="24px" p={6}>
      <CSkeleton height="14px" width="60%" mb={3} startColor="blackAlpha.50" endColor="blackAlpha.200" />
      <CSkeleton height="32px" width="40%" mb={2} startColor="blackAlpha.50" endColor="blackAlpha.200" />
      <CSkeleton height="12px" width="80%" startColor="blackAlpha.50" endColor="blackAlpha.200" />
    </Box>
  )
}

export function DashboardSkeleton() {
  return (
    <Stack gap={8}>
      <SimpleGrid columns={{ base: 1, md: 4 }} gap={6}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </SimpleGrid>
      <Box bg="bg-surface" borderWidth="1px" borderColor="border-light" borderRadius="28px" p={6}>
        <SkeletonText noOfLines={1} width="40%" mb={4} startColor="blackAlpha.50" endColor="blackAlpha.200" />
        <SkeletonText noOfLines={3} spacing={3} startColor="blackAlpha.50" endColor="blackAlpha.200" />
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Box bg="bg-surface" borderWidth="1px" borderColor="border-light" borderRadius="24px" p={6}>
          <SkeletonCircle size="10" mb={4} startColor="blackAlpha.50" endColor="blackAlpha.200" />
          <SkeletonText noOfLines={2} spacing={3} startColor="blackAlpha.50" endColor="blackAlpha.200" />
        </Box>
        <Box bg="bg-surface" borderWidth="1px" borderColor="border-light" borderRadius="24px" p={6}>
          <SkeletonCircle size="10" mb={4} startColor="blackAlpha.50" endColor="blackAlpha.200" />
          <SkeletonText noOfLines={2} spacing={3} startColor="blackAlpha.50" endColor="blackAlpha.200" />
        </Box>
      </SimpleGrid>
    </Stack>
  )
}

export function TimelineSkeleton() {
  return (
    <Stack gap={4}>
      {[1, 2, 3].map((i) => (
        <Box key={i} bg="bg-surface" borderWidth="1px" borderColor="border-light" borderRadius="16px" p={4}>
          <CSkeleton height="16px" width="30%" mb={2} startColor="blackAlpha.50" endColor="blackAlpha.200" />
          <CSkeleton height="12px" width="60%" startColor="blackAlpha.50" endColor="blackAlpha.200" />
        </Box>
      ))}
    </Stack>
  )
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Stack gap={3}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} bg="bg-surface" borderWidth="1px" borderColor="border-light" borderRadius="16px" p={5}>
          <HStackSkeleton />
        </Box>
      ))}
    </Stack>
  )
}

function HStackSkeleton() {
  return (
    <Box>
      <CSkeleton height="16px" width="60%" mb={2} startColor="blackAlpha.50" endColor="blackAlpha.200" />
      <CSkeleton height="12px" width="40%" startColor="blackAlpha.50" endColor="blackAlpha.200" />
    </Box>
  )
}
