import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export default function Contact() {
  const navigate = useNavigate()
  return (
    <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} maxW="600px" mx="auto">
      <Flex justify="space-between" align="center" mb={8}>
        <Heading fontSize="3xl" color="text-primary">Contact Us</Heading>
        <Button variant="ghost" onClick={() => navigate('/')}>← Back</Button>
      </Flex>
      <Stack gap={6} color="text-secondary" fontSize="md">
        <Box p={6} bg="bg-surface" borderRadius="16px" borderWidth="1px" borderColor="border-light">
          <Heading fontSize="lg" color="text-primary" mb={2}>Email</Heading>
          <Link color="brand.500" href="mailto:support@insureon.dev" fontSize="lg">support@insureon.dev</Link>
        </Box>
        <Box p={6} bg="bg-surface" borderRadius="16px" borderWidth="1px" borderColor="border-light">
          <Heading fontSize="lg" color="text-primary" mb={2}>Partnerships</Heading>
          <Link color="brand.500" href="mailto:partners@insureon.dev" fontSize="lg">partners@insureon.dev</Link>
        </Box>
        <Box p={6} bg="bg-surface" borderRadius="16px" borderWidth="1px" borderColor="border-light">
          <Heading fontSize="lg" color="text-primary" mb={2}>Office</Heading>
          <Text>InsureOn Technologies<br />Bengaluru, India</Text>
        </Box>
      </Stack>
    </Box>
  )
}
