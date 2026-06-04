import { Box, Button, Heading, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

type EmptyStateProps = {
  icon?: string
  title: string
  message: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  variant?: 'default' | 'compact'
}

export default function EmptyState({
  icon = '📋',
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const navigate = useNavigate()

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else if (actionTo) {
      navigate(actionTo)
    }
  }

  if (variant === 'compact') {
    return (
      <Box textAlign="center" py={8} px={4}>
        <Text fontSize="3xl" mb={3}>{icon}</Text>
        <Heading fontSize="md" color="text-secondary" mb={1}>{title}</Heading>
        <Text fontSize="sm" color="text-secondary">{message}</Text>
        {actionLabel && (
          <Button size="sm" mt={3} onClick={handleAction}>
            {actionLabel}
          </Button>
        )}
      </Box>
    )
  }

  return (
    <Box
      textAlign="center"
      py={16}
      px={8}
      bg="bg-surface"
      borderRadius="28px"
      borderWidth="1px"
      borderColor="border-muted"
    >
      <Text fontSize="5xl" mb={4}>{icon}</Text>
      <Heading fontSize="xl" color="text-primary" mb={2}>{title}</Heading>
      <Text color="text-secondary" maxW="480px" mx="auto" mb={6}>{message}</Text>
      {actionLabel && (
        <Button size="lg" onClick={handleAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
