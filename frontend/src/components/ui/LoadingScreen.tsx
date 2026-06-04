import { Box, Text, Spinner } from '@chakra-ui/react'

type LoadingScreenProps = {
  message?: string
}

export default function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minH="60vh"
      gap={4}
    >
      <Spinner size="xl" color="brand.500" thickness="3px" />
      <Text color="text-secondary" fontSize="sm">{message}</Text>
    </Box>
  )
}
