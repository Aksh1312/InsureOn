import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import * as api from '../api'
import type { WorkerProfile } from '../api/types'
import SectionTitle from '../components/SectionTitle'
import { formatCurrency } from '../utils/format'

export default function Profile() {
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = async () => {
    try {
      const data = await api.getWorkerProfile()
      setProfile(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      const updated = await api.updateWorkerProfile({
        avg_weekly_hours: profile.avg_weekly_hours,
        avg_weekly_income: profile.avg_weekly_income,
        primary_shift: profile.primary_shift,
        is_multi_platform: profile.is_multi_platform,
      })
      setProfile(updated)
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!profile) {
    return <Text>Loading profile...</Text>
  }

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="Profile"
        title="Manage your weekly work settings"
        subtitle="Update hours, income, and shifts to keep premiums accurate."
      />
      {error ? (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      ) : null}

      <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        <Heading fontSize="lg" color="ink.900">
          Coverage summary
        </Heading>
        <Text mt={2} color="ink.600">
          Weekly coverage {formatCurrency(profile.weekly_coverage)} · Premium{' '}
          {formatCurrency(profile.weekly_premium)}
        </Text>
      </Box>

      <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        <Heading fontSize="lg" color="ink.900">
          Update work profile
        </Heading>
        <Stack mt={4} gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Average weekly hours
            </Text>
            <Input
              mt={2}
              type="number"
              value={profile.avg_weekly_hours}
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, avg_weekly_hours: Number(e.target.value) } : prev))
              }
            />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Average weekly income (INR)
            </Text>
            <Input
              mt={2}
              type="number"
              value={profile.avg_weekly_income}
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, avg_weekly_income: Number(e.target.value) } : prev))
              }
            />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Primary shift
            </Text>
            <Input
              as="select"
              mt={2}
              value={profile.primary_shift}
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, primary_shift: e.target.value } : prev))
              }
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="night">Night</option>
            </Input>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Multi-platform worker
            </Text>
            <Input
              as="select"
              mt={2}
              value={profile.is_multi_platform ? 'yes' : 'no'}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, is_multi_platform: e.target.value === 'yes' } : prev
                )
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Input>
          </Box>
          <Button alignSelf="flex-start" onClick={handleSave} isDisabled={isSaving}>
            Save profile
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}
