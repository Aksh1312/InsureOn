import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()
  return (
    <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} maxW="800px" mx="auto">
      <Flex justify="space-between" align="center" mb={8}>
        <Heading fontSize="3xl" color="text-primary">Terms of Service</Heading>
        <Button variant="ghost" onClick={() => navigate('/')}>← Back</Button>
      </Flex>
      <Stack gap={5} color="text-secondary" fontSize="md" lineHeight="1.7">
        <Text><b>Last updated:</b> May 2026</Text>
        <Text>By using InsureOn, you agree to these terms. Please read them carefully.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Coverage</Heading>
        <Text>InsureOn provides parametric income protection for registered gig delivery workers. Coverage is based on your zone, tier, and weekly premium payment.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Premiums & Payments</Heading>
        <Text>Weekly premiums are calculated based on your zone, working hours, income, and risk profile. Payments are processed via UPI. Non-payment results in coverage suspension.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Claims</Heading>
        <Text>Claims are automatically triggered by verified weather/disaster alerts. Payouts are made via UPI after 5 consecutive days of confirmed income loss.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Limitations</Heading>
        <Text>InsureOn is not a replacement for comprehensive health or life insurance. Coverage is limited to income loss from verified parametric triggers.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Contact</Heading>
        <Text>For questions, email <Link color="brand.500" href="mailto:support@insureon.dev">support@insureon.dev</Link>.</Text>
      </Stack>
    </Box>
  )
}
