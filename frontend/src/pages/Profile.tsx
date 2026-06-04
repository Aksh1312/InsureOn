import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
  SimpleGrid,
  HStack,
  Badge,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { User, MapPin } from 'lucide-react'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import SectionTitle from '../components/SectionTitle'
import AmountDisplay from '../components/fintech/AmountDisplay'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { formatCurrency } from '../utils/format'

export default function Profile() {
  const { data: profile, isLoading, isError } = useProfile()
  const updateProfile = useUpdateProfile()
  const toast = useToast()
  const [form, setForm] = useState({
    pincode: '',
    avg_weekly_hours: 0,
    avg_weekly_income: 0,
    primary_shift: 'morning',
    is_multi_platform: false,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        pincode: profile.pincode || '',
        avg_weekly_hours: profile.avg_weekly_hours,
        avg_weekly_income: profile.avg_weekly_income,
        primary_shift: profile.primary_shift,
        is_multi_platform: profile.is_multi_platform,
      })
    }
  }, [profile])

  if (isLoading) return <DashboardSkeleton />
  if (isError || !profile) {
    return (
      <Stack gap={8}>
        <SectionTitle kicker="Profile" title="Work profile" subtitle="Profile not set up yet" />
        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
            <Text color="text-secondary">Finish setup</Text>
          <Button mt={4} as="a" href="/onboarding">Finish Setup</Button>
        </Box>
      </Stack>
    )
  }

  const hrs = form.avg_weekly_hours || profile.avg_weekly_hours
  let dynamicTier = 'Tier 1 (Part-time)'
  let personaName = 'Ravi'
    let     personaDesc = 'You use delivery work for extra income. You are smart about protecting yourself.'

  if (hrs > 40) {
    dynamicTier = 'Tier 3 (Full-time)'
    personaName = 'Karthik'
    personaDesc = 'Delivery work is your main source of income. You are worried about losing money in bad weather.'
  } else if (hrs > 25) {
    dynamicTier = 'Tier 2 (Regular Worker)'
    personaName = 'Regular Worker'
    personaDesc = 'You depend on delivery work for steady income.'
  }

  const handleSave = () => {
    updateProfile.mutate(form, {
      onSuccess: () => {
        toast({ title: 'Profile updated', status: 'success', duration: 3000 })
      },
      onError: (err) => {
        toast({ title: 'Update failed', description: err.message, status: 'error', duration: 4000 })
      },
    })
  }

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Profile"
        title="Your work settings"
        subtitle="Update hours, earnings, and shifts"
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Stack gap={6}>
          <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
            <Heading fontSize="lg" color="text-primary" mb={4}>Your Plan</Heading>
            <SimpleGrid columns={2} gap={4}>
              <Box>
                    <Text fontSize="sm" color="text-secondary">Amount Covered</Text>
                <Text fontWeight={600} fontSize="xl" color="text-primary">{formatCurrency(profile.weekly_coverage)}</Text>
              </Box>
              <Box>
                    <Text fontSize="sm" color="text-secondary">Fee</Text>
                <AmountDisplay amount={profile.weekly_premium} size="md" />
              </Box>
              <Box>
                    <Text fontSize="sm" color="text-secondary">Area</Text>
                <HStack><MapPin size={16} color="var(--chakra-colors-text-muted)"/><Text fontWeight={600} color="text-primary">{profile.zone}</Text></HStack>
              </Box>
              <Box>
                    <Text fontSize="sm" color="text-secondary">Worker Type</Text>
                <Badge colorScheme="brand" mt={1}>{dynamicTier}</Badge>
              </Box>
            </SimpleGrid>
          </Box>

          <Box bg="teal.50" borderRadius="24px" p={6} borderWidth="1px" borderColor="teal.200">
            <HStack mb={2} gap={3}>
              <User color="var(--chakra-colors-teal-600)" />
              <Heading fontSize="md" color="teal.900">Profile: "{personaName}"</Heading>
            </HStack>
            <Text color="teal.800" fontSize="sm">{personaDesc}</Text>
            <Text mt={2} color="teal.700" fontSize="xs" fontWeight={600}>
              Based on {hrs} hours/week
            </Text>
          </Box>
        </Stack>

        <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
          <Heading fontSize="lg" color="text-primary">Update Details</Heading>
          <Stack mt={4} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight={600} color="text-secondary">Pincode</Text>
              <Input
                mt={2}
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              />
              <Text fontSize="xs" color="text-secondary" mt={1}>For weather alerts</Text>
            </Box>
            <HStack gap={4}>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight={600} color="text-secondary">Weekly work hours</Text>
                <Input
                  mt={2}
                  type="number"
                  value={form.avg_weekly_hours}
                  onChange={(e) => setForm((f) => ({ ...f, avg_weekly_hours: Number(e.target.value) }))}
                />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight={600} color="text-secondary">Weekly earnings (₹)</Text>
                <Input
                  mt={2}
                  type="number"
                  value={form.avg_weekly_income}
                  onChange={(e) => setForm((f) => ({ ...f, avg_weekly_income: Number(e.target.value) }))}
                />
              </Box>
            </HStack>
            <Box>
              <Text fontSize="sm" fontWeight={600} color="text-secondary">Multiple apps worker</Text>
              <Input
                as="select"
                mt={2}
                value={form.is_multi_platform ? 'yes' : 'no'}
                onChange={(e) => setForm((f) => ({ ...f, is_multi_platform: e.target.value === 'yes' }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Input>
            </Box>
            <Button mt={2} alignSelf="flex-start" onClick={handleSave} isLoading={updateProfile.isPending}>
              Save
            </Button>
          </Stack>
        </Box>
      </SimpleGrid>
    </Stack>
  )
}
