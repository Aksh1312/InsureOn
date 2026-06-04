import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()
  return (
    <Box px={{ base: 4, md: 10 }} py={{ base: 12, md: 16 }} maxW="800px" mx="auto">
      <Flex justify="space-between" align="center" mb={8}>
        <Heading fontSize="3xl" color="text-primary">Privacy Policy</Heading>
        <Button variant="ghost" onClick={() => navigate('/')}>← Back</Button>
      </Flex>
      <Stack gap={5} color="text-secondary" fontSize="md" lineHeight="1.7">
        <Text><b>Last updated:</b> May 2026</Text>
        <Text>InsureOn respects your privacy. This policy explains how we collect, use, and protect your information.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Information We Collect</Heading>
        <Text>We collect your name, email, phone number, UPI ID, location (city/pincode), platform usage data, and income information solely for providing insurance coverage and payouts.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>How We Use Your Data</Heading>
        <Text>Your data is used to calculate premiums, assess risk scores, process claims, send payouts via UPI, and generate SmartWork tips. We never sell your data to third parties.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Data Security</Heading>
        <Text>We use industry-standard encryption and access controls. Your financial information (UPI ID) is only used for payout processing.</Text>
        <Heading fontSize="lg" color="text-primary" mt={4}>Contact</Heading>
        <Text>For privacy concerns, email us at <Link color="brand.500" href="mailto:privacy@insureon.dev">privacy@insureon.dev</Link>.</Text>
      </Stack>
    </Box>
  )
}
