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
import type { SmartWorkTip } from '../api/types'
import SectionTitle from '../components/SectionTitle'
import { formatCurrency, formatDate } from '../utils/format'

export default function Smartwork() {
  const [tip, setTip] = useState<SmartWorkTip | null>(null)
  const [actualEarnings, setActualEarnings] = useState('')
  const [followedSafety, setFollowedSafety] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTip = async () => {
    try {
      const data = await api.getSmartworkTip()
      setTip(data)
      if (data.actual_earnings) {
        setActualEarnings(String(data.actual_earnings))
      }
      if (data.followed_safety_tips) {
        setFollowedSafety(data.followed_safety_tips)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    }
  }

  useEffect(() => {
    loadTip()
  }, [])

  const handleSave = async () => {
    if (!tip) return
    try {
      await api.updateSmartworkActuals(tip.id, {
        actual_earnings: Number(actualEarnings),
        followed_safety_tips: followedSafety,
      })
      setError(null)
      await loadTip()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    }
  }

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="SmartWork"
        title="Weekly guidance to earn safer, smarter"
        subtitle="Personalized shift advice and weather windows for your zone."
      />
      {error ? (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      ) : null}

      <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        {tip ? (
          <Stack gap={4}>
            <Heading fontSize="lg" color="ink.900">
              Week of {formatDate(tip.week_start_date)}
            </Heading>
            <Text color="ink.600">Best time slots: {tip.best_time_slots || 'Coming soon'}</Text>
            <Text color="ink.600">Best zones: {tip.best_zones || 'Coming soon'}</Text>
            <Text color="ink.600">Weather window: {tip.weather_window || 'Coming soon'}</Text>
            <Text color="ink.600">Surge alerts: {tip.surge_alerts || 'Coming soon'}</Text>
            <Text color="ink.600">Risk advisory: {tip.risk_advisory || 'Stay safe'}</Text>
            <Text color="ink.600">
              Projected earnings: {formatCurrency(tip.projected_earnings)}
            </Text>
          </Stack>
        ) : (
          <Text color="ink.600">No SmartWork tip yet.</Text>
        )}
      </Box>

      <Box bg="white" borderRadius="24px" p={6} borderWidth="1px" borderColor="blackAlpha.200">
        <Heading fontSize="lg" color="ink.900">
          Log your actuals
        </Heading>
        <Stack mt={4} gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Actual weekly earnings (INR)
            </Text>
            <Input mt={2} value={actualEarnings} onChange={(e) => setActualEarnings(e.target.value)} type="number" />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight={600} color="ink.700">
              Followed safety tips?
            </Text>
            <Input
              as="select"
              mt={2}
              value={followedSafety ? 'yes' : 'no'}
              onChange={(e) => setFollowedSafety(e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Input>
          </Box>
          <Button alignSelf="flex-start" onClick={handleSave}>
            Save actuals
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}
