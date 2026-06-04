import { Box, Text, HStack, Badge, Spinner, useToast } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import { CloudSun, Droplets, Thermometer } from 'lucide-react'
import { useWeatherAdvisory } from '../../hooks/useWeather'

const RISK_COLORS: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  SEVERE: 'red',
  UNKNOWN: 'gray',
}

type Props = {
  city: string | undefined
}

export default function WeatherAdvisoryCard({ city }: Props) {
  const { data: weather, isLoading, isError, dataUpdatedAt } = useWeatherAdvisory(city)
  const toast = useToast()
  const notified = useRef(false)

  useEffect(() => {
    if (weather && (weather.risk_level === 'HIGH' || weather.risk_level === 'SEVERE') && !notified.current) {
      notified.current = true
      toast({
        title: 'Heavy rainfall expected in your area today.',
        status: 'warning',
        duration: 8000,
        isClosable: true,
        position: 'top',
      })
    }
  }, [weather, toast])

  if (!city) return null

  if (isLoading) {
    return (
      <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
        <HStack gap={2} mb={4}>
          <CloudSun size={18} color="var(--chakra-colors-brand-500)" />
        <Text fontSize="lg" fontWeight={600} color="text-primary">🌦 LIVE WEATHER ADVISORY</Text>
        </HStack>
        <HStack gap={2}>
          <Spinner size="sm" />
          <Text fontSize="sm" color="text-secondary">Loading weather data...</Text>
        </HStack>
      </Box>
    )
  }

  if (isError || !weather || weather.risk_level === 'UNKNOWN') {
    return null
  }

  const badgeColor = RISK_COLORS[weather.risk_level] || 'gray'

  return (
    <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
      <HStack gap={2} mb={4}>
        <CloudSun size={18} color="var(--chakra-colors-brand-500)" />
        <Text fontSize="lg" fontWeight={600} color="text-primary">🌦 LIVE WEATHER ADVISORY</Text>
      </HStack>

      <Text fontSize="xl" fontWeight={700} color="text-primary" mb={3}>
        {weather.city}
      </Text>

      <HStack gap={4} mb={3} wrap="wrap">
        {weather.temperature !== null && (
          <HStack gap={1}>
            <Thermometer size={16} color="var(--chakra-colors-text-muted)" />
            <Text fontSize="sm" fontWeight={600} color="text-primary">{weather.temperature}°C</Text>
          </HStack>
        )}
        {weather.rainfall_mm !== null && (
          <HStack gap={1}>
            <Droplets size={16} color="var(--chakra-colors-text-muted)" />
            <Text fontSize="sm" fontWeight={600} color="text-primary">{weather.rainfall_mm} mm Rainfall</Text>
          </HStack>
        )}
        <Badge colorScheme={badgeColor} borderRadius="999px" fontSize="2xs" px={2}>
          {weather.risk_level} RISK
        </Badge>
      </HStack>

      <Text fontSize="sm" color="text-secondary" mb={1}>
        {weather.summary}
      </Text>

      {weather.recommendation && (
        <Text fontSize="xs" color="text-muted">
          Recommendation: {weather.recommendation}
        </Text>
      )}

      <Text fontSize="2xs" color="text-muted" mt={3}>
        Updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'just now'}
      </Text>
    </Box>
  )
}
