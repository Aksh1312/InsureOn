import {
  Badge,
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
  SimpleGrid,
  HStack,
  Flex,
  Spinner,
} from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { MapPin, TrendingUp, CloudRain, AlertTriangle, DollarSign } from 'lucide-react'
import { useSmartworkTip, useUpdateSmartworkActuals } from '../hooks/useSmartwork'
import SectionTitle from '../components/SectionTitle'
import { DashboardSkeleton } from '../components/ui/Skeleton'

const MOCK_CHART_DATA = [
  { name: 'Week 1', projected: 4000, actual: 4200 },
  { name: 'Week 2', projected: 4200, actual: 3900 },
  { name: 'Week 3', projected: 4500, actual: 4800 },
  { name: 'Current', projected: 5000, actual: 0 },
]

function formatCurrency(val: number) {
  return '₹' + val.toLocaleString('en-IN')
}

export default function Smartwork() {
  const { data: tip, isLoading, isFetching, error: queryError } = useSmartworkTip()
  const updateActuals = useUpdateSmartworkActuals()
  const [actualEarnings, setActualEarnings] = useState('')
  const [followedSafety, setFollowedSafety] = useState(false)
  const slots = useMemo(() => {
    if (!tip?.recommended_slots) return []
    try { return JSON.parse(tip.recommended_slots) } catch { return [] }
  }, [tip?.recommended_slots])

  const parsedZones = useMemo(() => {
    if (!tip?.best_zones) return []
    try {
      const parsed = JSON.parse(tip.best_zones)
      return Array.isArray(parsed) ? parsed : [parsed.toString()]
    } catch {
      return [tip.best_zones]
    }
  }, [tip?.best_zones])

  const riskOutlook = useMemo(() => {
    if (!tip?.risk_outlook) return null
    try { return JSON.parse(tip.risk_outlook) } catch { return null }
  }, [tip?.risk_outlook])

  const premiumProj = useMemo(() => {
    if (!tip?.premium_projection) return null
    try { return JSON.parse(tip.premium_projection) } catch { return null }
  }, [tip?.premium_projection])

  const cityInfo = useMemo(() => {
    if (!tip?.city_insights) return null
    try { return JSON.parse(tip.city_insights) } catch { return null }
  }, [tip?.city_insights])

  const chartData = useMemo(() => {
    if (!tip) return MOCK_CHART_DATA
    return MOCK_CHART_DATA.map((item, i) => {
      if (i !== 3) return item
      return {
        ...item,
        actual: tip.actual_earnings || item.actual,
        projected: tip.projected_earnings || item.projected,
      }
    })
  }, [tip])

  const handleSave = async () => {
    if (!tip) return
    updateActuals.mutate({
      tipId: tip.id,
      payload: {
        actual_earnings: Number(actualEarnings),
        followed_safety_tips: followedSafety,
      },
    })
  }

  if (isLoading) return <DashboardSkeleton />

  return (
    <Stack gap={8}>
      <SectionTitle
        kicker="SmartWork"
        title="Worker Intelligence Report"
        subtitle="Personalized earnings forecast, risk outlook, and city insights"
      />
      {queryError && <Text fontSize="sm" color="red.500">{(queryError as any)?.message || 'Could not load report'}</Text>}
      {isFetching && !isLoading && (
        <HStack gap={1} color="text-muted" justify="flex-end">
          <Spinner size="xs" />
          <Text fontSize="sm">Updating...</Text>
        </HStack>
      )}

      {tip && (
        <>
          {/* Earnings Forecast & Best Work Windows */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
              <HStack mb={4}>
                <TrendingUp size={18} color="var(--chakra-colors-teal-500)" />
                <Heading fontSize="lg" color="text-primary">Earnings Forecast</Heading>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="text-primary">
                {tip.projected_earnings ? formatCurrency(tip.projected_earnings) : '—'}
              </Text>
              <Text fontSize="md" color="text-secondary" mt={1}>
                Projected Weekly Earnings
              </Text>
              <Text fontSize="md" color="text-muted" mt={3}>
                Based on historical income, city, platform, and weather conditions.
              </Text>
              {tip.confidence_score != null && (
                <HStack mt={2} gap={2}>
                  <Text fontSize="md" color="text-muted">Confidence:</Text>
                  <Box w="60px" h="4px" bg="border-light" borderRadius="2px" overflow="hidden">
                    <Box w={`${tip.confidence_score * 100}%`} h="full" bg={tip.confidence_score > 0.7 ? 'teal.500' : tip.confidence_score > 0.4 ? 'yellow.500' : 'orange.500'} borderRadius="2px" />
                  </Box>
                  <Text fontSize="md" color="text-muted">{Math.round(tip.confidence_score * 100)}%</Text>
                </HStack>
              )}
            </Box>

            <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
              <HStack mb={4}>
                <MapPin size={18} color="var(--chakra-colors-blue-500)" />
                <Heading fontSize="lg" color="text-primary">Best Work Windows</Heading>
              </HStack>
              {slots.length > 0 ? (
                <Stack gap={2}>
                  {slots.map((slot: any, i: number) => (
                    <Box key={i} bg="bg-surface-muted" borderRadius="12px" p={3}>
                      <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="bold">{slot.time}</Text>
                        <Badge colorScheme={slot.demand === 'Very High' ? 'red' : slot.demand === 'High' ? 'orange' : 'yellow'} variant="subtle" fontSize="sm">
                          {slot.demand} demand expected
                        </Badge>
                      </HStack>
                      <Text fontSize="md" color="text-secondary" mt={1}>{slot.reason}</Text>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Text fontSize="md" color="text-secondary">Time slot data unavailable.</Text>
              )}
            </Box>
          </SimpleGrid>

          {/* Risk Awareness & Premium Impact */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
              <HStack mb={4}>
                <AlertTriangle size={18} color="var(--chakra-colors-orange-500)" />
                <Heading fontSize="lg" color="text-primary">Risk Awareness</Heading>
              </HStack>
              {riskOutlook ? (
                <Box>
                  <Badge
                    bg={riskOutlook.category === 'LOW' ? 'teal.50' : riskOutlook.category === 'MEDIUM' ? 'yellow.50' : riskOutlook.category === 'HIGH' ? 'orange.50' : 'red.50'}
                    color={riskOutlook.category === 'LOW' ? 'teal.700' : riskOutlook.category === 'MEDIUM' ? 'yellow.800' : riskOutlook.category === 'HIGH' ? 'orange.700' : 'red.700'}
                    px={3} py={1} borderRadius="md" fontSize="md" fontWeight="bold" textTransform="uppercase"
                  >
                    {riskOutlook.category}
                  </Badge>
                  <Text fontSize="md" color="text-secondary" mt={3}>{riskOutlook.warning}</Text>
                  <Text fontSize="md" color="text-muted" mt={2}>{riskOutlook.advice}</Text>
                </Box>
              ) : (
                <Text fontSize="md" color="text-secondary">Risk assessment unavailable this week.</Text>
              )}
            </Box>

            <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
              <HStack mb={4}>
                <DollarSign size={18} color="var(--chakra-colors-green-500)" />
                <Heading fontSize="lg" color="text-primary">Premium Impact</Heading>
              </HStack>
              {premiumProj ? (
                <Box>
                  <Text fontSize="md" color="text-secondary">{premiumProj.impact}</Text>
                  <HStack mt={4} gap={8}>
                    <Box>
                      <Text fontSize="md" color="text-muted">Current Premium</Text>
                      <Text fontSize="2xl" fontWeight="bold">{formatCurrency(premiumProj.current_premium)}</Text>
                    </Box>
                    {premiumProj.savings !== 0 && (
                      <Box>
                        <Text fontSize="md" color="text-muted">Projected</Text>
                        <Text fontSize="2xl" fontWeight="bold" color={premiumProj.projected_premium < premiumProj.current_premium ? 'green.600' : 'orange.600'}>
                          {formatCurrency(premiumProj.projected_premium)}
                        </Text>
                      </Box>
                    )}
                  </HStack>
                  {premiumProj.savings < 0 && (
                    <Text fontSize="md" color="green.600" mt={2}>
                      Potential savings: {formatCurrency(Math.abs(premiumProj.savings))}/week
                    </Text>
                  )}
                </Box>
              ) : (
                <Text fontSize="md" color="text-secondary">Premium projection unavailable.</Text>
              )}
            </Box>
          </SimpleGrid>

          {/* City Insights */}
          {cityInfo && (
            <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
              <HStack mb={4}>
                <CloudRain size={18} color="var(--chakra-colors-purple-500)" />
                <Heading fontSize="lg" color="text-primary">{cityInfo.city} Market Insights</Heading>
              </HStack>
              <Text fontSize="md" color="text-secondary">{cityInfo.description}</Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={4}>
                <Box bg="bg-surface-muted" borderRadius="12px" p={3}>
                  <Text fontSize="md" color="text-muted">Demand Trend</Text>
                  <Text fontSize="md" fontWeight="bold" mt={1}>{cityInfo.demand_trend}</Text>
                </Box>
                <Box bg="bg-surface-muted" borderRadius="12px" p={3}>
                  <Text fontSize="md" color="text-muted">Weather Risk</Text>
                  <Text fontSize="md" fontWeight="bold" mt={1}>{cityInfo.weather_disruption_risk}</Text>
                </Box>
                <Box bg="bg-surface-muted" borderRadius="12px" p={3}>
                  <Text fontSize="md" color="text-muted">Peak Day</Text>
                  <Text fontSize="md" fontWeight="bold" mt={1}>{cityInfo.peak_day}</Text>
                </Box>
              </SimpleGrid>
            </Box>
          )}

          {/* Existing: Busy Areas Map + Earnings Chart */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
              <HStack justify="space-between" mb={4}>
                <Heading fontSize="lg" color="text-primary">Busy Areas Map</Heading>
                <Badge colorScheme="red" variant="subtle"><HStack gap={1}><AlertTriangle size={12}/> <Text>Active Alerts</Text></HStack></Badge>
              </HStack>

              <Box position="relative" w="full" h="220px" bg="gray.950" borderRadius="20px" overflow="hidden" border="1px solid" borderColor="whiteAlpha.100" boxShadow="dark-lg">
                {/* Abstract Map Background: Grid/Road lines */}
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.25 }}>
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Styled road/highway paths */}
                  <path d="M-20,50 Q100,20 200,80 T400,120 T600,60" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                  <path d="M150,-20 Q120,100 220,150 T350,260" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <path d="M400,-20 C350,80 450,150 480,240" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  
                  {/* Styled River/Coastal shape */}
                  <path d="M-10,180 C120,190 180,140 280,170 T600,210 L600,240 L-10,240 Z" fill="rgba(0,180,255,0.15)" stroke="rgba(0,180,255,0.3)" strokeWidth="2" />
                </svg>
                
                {/* Glowing Surge Zone A */}
                <Box position="absolute" top="25%" left="20%" transform="translate(-50%, -50%)">
                  <Flex direction="column" align="center">
                    <Box position="relative">
                      <Box className="pulse-ring-red" position="absolute" top="-10px" left="-10px" w="40px" h="40px" borderRadius="full" border="2px solid red" opacity={0.6} />
                      <MapPin color="red" size={20} fill="rgba(255,0,0,0.3)" />
                    </Box>
                    <Badge colorScheme="red" fontSize="11px" mt={1} borderRadius="md" bg="blackAlpha.800" backdropFilter="blur(4px)" border="1px solid rgba(255,0,0,0.5)">
                      Zone A (2.5x)
                    </Badge>
                  </Flex>
                </Box>

                {/* Glowing Surge Zone B */}
                <Box position="absolute" top="65%" left="55%" transform="translate(-50%, -50%)">
                  <Flex direction="column" align="center">
                    <Box position="relative">
                      <Box className="pulse-ring-amber" position="absolute" top="-10px" left="-10px" w="40px" h="40px" borderRadius="full" border="2px solid #D69E2E" opacity={0.6} />
                      <MapPin color="#D69E2E" size={20} fill="rgba(214,158,46,0.3)" />
                    </Box>
                    <Badge colorScheme="yellow" fontSize="11px" mt={1} borderRadius="md" bg="blackAlpha.800" backdropFilter="blur(4px)" border="1px solid rgba(214,158,46,0.5)">
                      Zone B (1.7x)
                    </Badge>
                  </Flex>
                </Box>

                {/* Glowing Surge Zone C */}
                <Box position="absolute" top="40%" left="80%" transform="translate(-50%, -50%)">
                  <Flex direction="column" align="center">
                    <Box position="relative">
                      <Box className="pulse-ring-green" position="absolute" top="-10px" left="-10px" w="40px" h="40px" borderRadius="full" border="2px solid #319795" opacity={0.6} />
                      <MapPin color="#319795" size={20} fill="rgba(49,151,149,0.3)" />
                    </Box>
                    <Badge colorScheme="teal" fontSize="11px" mt={1} borderRadius="md" bg="blackAlpha.800" backdropFilter="blur(4px)" border="1px solid rgba(49,151,149,0.5)">
                      Zone C (1.2x)
                    </Badge>
                  </Flex>
                </Box>

                {/* Title / Legend Overlay */}
                <Box position="absolute" top={3} right={3} bg="blackAlpha.800" backdropFilter="blur(8px)" border="1px solid" borderColor="whiteAlpha.200" borderRadius="lg" p={2} fontSize="12px">
                  <Text color="white" fontWeight="bold" mb={1}>Surge Intensity</Text>
                  <HStack gap={2}>
                    <HStack gap={1}><Box w="6px" h="6px" borderRadius="full" bg="red.500" /><Text color="gray.400">High</Text></HStack>
                    <HStack gap={1}><Box w="6px" h="6px" borderRadius="full" bg="yellow.500" /><Text color="gray.400">Mod</Text></HStack>
                    <HStack gap={1}><Box w="6px" h="6px" borderRadius="full" bg="green.500" /><Text color="gray.400">Low</Text></HStack>
                  </HStack>
                </Box>
              </Box>

              <Stack gap={4} mt={4}>
                <HStack align="start">
                  <Box mt={1} color="brand.500"><TrendingUp size={16} /></Box>
                  <Box w="full">
                    <Text fontSize="md" fontWeight="bold">Best Times:</Text>
                    {(() => {
                      if (!tip.best_time_slots) return <Text fontSize="md" color="text-secondary">Evenings 7-9 PM</Text>;
                      try {
                        const parsed = JSON.parse(tip.best_time_slots);
                        if (Array.isArray(parsed)) {
                          return (
                            <Flex flexWrap="wrap" gap={2} mt={1}>
                              {parsed.map((slot: string, i: number) => (
                                <Badge key={i} colorScheme="teal" variant="subtle" px={2} py={0.5} borderRadius="md" textTransform="none">
                                  {slot}
                                </Badge>
                              ))}
                            </Flex>
                          );
                        }
                      } catch (_e) {}
                      return <Text fontSize="md" color="text-secondary">{tip.best_time_slots}</Text>;
                    })()}
                  </Box>
                </HStack>
                <HStack align="start">
                  <Box mt={1} color="teal.500"><MapPin size={16} /></Box>
                  <Box w="full">
                    <Text fontSize="md" fontWeight="bold">Busy Areas:</Text>
                    <Stack gap={1.5} mt={1.5}>
                      {parsedZones.length > 0 ? (
                        parsedZones.map((zoneText: string, idx: number) => (
                          <Text key={idx} fontSize="md" color="text-secondary" display="flex" alignItems="baseline">
                            • {zoneText}
                          </Text>
                        ))
                      ) : (
                        <Text fontSize="md" color="text-secondary">Commercial Hubs</Text>
                      )}
                    </Stack>
                  </Box>
                </HStack>
                <HStack align="start">
                  <Box mt={1} color="blue.500"><CloudRain size={16} /></Box>
                  <Box><Text fontSize="md" fontWeight="bold">Weather:</Text><Text fontSize="md" color="text-secondary" mt={1}>{tip.weather_window || 'Clear skies expected after 4 PM'}</Text></Box>
                </HStack>
              </Stack>
            </Box>

            <Box bg="bg-surface" borderRadius="24px" p={6} borderWidth="1px" borderColor="border-light">
               <Heading fontSize="lg" color="text-primary" mb={4}>Your Earnings</Heading>
               <Box h="200px" w="full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <RechartsTooltip formatter={(value) => `₹${value}`} cursor={{fill: 'var(--chakra-colors-blackAlpha-50)'}} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                      <Bar dataKey="projected" name="Projected" fill="var(--chakra-colors-teal-200)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" name="Actual" fill="var(--chakra-colors-teal-500)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </Box>

               <Box bg="bg-surface-muted" borderRadius="16px" p={4} mt={4}>
                  <Heading fontSize="md" color="text-primary">Enter this week's earnings</Heading>
                  <Stack mt={3} gap={3}>
                    <Box>
                      <Text fontSize="md" fontWeight={600} color="text-secondary">Actual earnings (₹)</Text>
                      <Input size="md" mt={1} value={actualEarnings} bg="bg-surface" onChange={(e) => setActualEarnings(e.target.value)} type="number" />
                    </Box>
                    <HStack justify="space-between">
                      <Box>
                        <Text fontSize="md" fontWeight={600} color="text-secondary">Followed safety?</Text>
                        <Input as="select" size="md" mt={1} bg="bg-surface" value={followedSafety ? 'yes' : 'no'} onChange={(e) => setFollowedSafety(e.target.value === 'yes')}>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </Input>
                      </Box>
                      <Button mt={5} size="md" onClick={handleSave} isLoading={updateActuals.isPending}>
                        Save
                      </Button>
                    </HStack>
                    {updateActuals.isSuccess && (
                      <Text fontSize="md" color="teal.600">Saved</Text>
                    )}
                    {updateActuals.isError && (
                      <Text fontSize="md" color="red.500">{(updateActuals.error as any)?.message || 'Could not save'}</Text>
                    )}
                  </Stack>
               </Box>
            </Box>
          </SimpleGrid>

          {/* Safety Warning */}
          {tip.risk_advisory && (
             <Box bg="orange.50" borderRadius="24px" p={6} borderWidth="1px" borderColor="orange.200">
               <HStack gap={3}>
                 <AlertTriangle color="var(--chakra-colors-orange-500)" size={32} />
                 <Box>
                   <Heading fontSize="md" color="orange.900">Safety Warning</Heading>
                   <Text color="orange.800" fontSize="md">{tip.risk_advisory}</Text>
                 </Box>
               </HStack>
             </Box>
          )}

          {/* Safety Reward */}
          <Box bg="teal.50" borderRadius="24px" p={6} borderWidth="1px" borderColor="teal.200">
            <HStack gap={3}>
              <Box fontSize="3xl">🛡️</Box>
              <Box>
                <Heading fontSize="md" color="teal.900">Safety Reward</Heading>
                <Text color="teal.700" fontSize="md" mt={1}>
                  Follow safety tips and get 5% off on next week's fee.
                  {followedSafety ? (
                    <Badge ml={2} colorScheme="green" variant="subtle">Active ✓</Badge>
                  ) : (
                    <Badge ml={2} colorScheme="gray" variant="subtle">Not yet</Badge>
                  )}
                </Text>
                <Text color="teal.600" fontSize="md" mt={1}>
                  Use suggested times and areas
                </Text>
              </Box>
            </HStack>
          </Box>
        </>
      )}
    </Stack>
  )
}
