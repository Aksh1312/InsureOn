import { Box, Button, Heading, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFound() {
  return (
    <Box textAlign="center" py={20}>
      <Heading fontSize="4xl" color="ink.900">
        404
      </Heading>
      <Text mt={3} color="ink.600">
        This page does not exist yet.
      </Text>
      <Button as={RouterLink} to="/" mt={6}>
        Back to home
      </Button>
    </Box>
  )
}
