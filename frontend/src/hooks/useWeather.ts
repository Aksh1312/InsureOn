import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { WeatherAdvisory } from '../api/types'

export function useWeatherAdvisory(city: string | undefined) {
  return useQuery<WeatherAdvisory>({
    queryKey: QUERY_KEYS.weatherAdvisory(city || ''),
    queryFn: () => api.getWeatherAdvisory(city!),
    enabled: !!city,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })
}
