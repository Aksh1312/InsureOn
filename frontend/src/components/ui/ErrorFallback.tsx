import { Box, Button, Heading, Text } from '@chakra-ui/react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useEffect } from 'react'

type ErrorFallbackProps = {
  error: Error | null
  resetErrorBoundary?: () => void
  title?: string
}

export default function ErrorFallback({ error, resetErrorBoundary, title }: ErrorFallbackProps) {
  const queryReset = useQueryErrorResetBoundary()

  useEffect(() => {
    queryReset.reset()
  }, [queryReset])

  return (
    <Box textAlign="center" py={16} px={4}>
      <Box display="inline-flex" p={4} bg="red.50" borderRadius="full" mb={4}>
        <AlertTriangle size={32} color="var(--chakra-colors-red-500)" />
      </Box>
      <Heading fontSize="xl" color="text-primary" mb={2}>
        {title || 'Unable to load data'}
      </Heading>
      <Text color="text-secondary" mb={6} maxW="400px" mx="auto" fontSize="sm">
        {error?.message || 'Something went wrong. Please try again.'}
      </Text>
      {resetErrorBoundary && (
        <Button onClick={resetErrorBoundary} leftIcon={<RefreshCw size={16} />}>
          Try again
        </Button>
      )}
    </Box>
  )
}
