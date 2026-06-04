import {
  Badge, Box, Button, Heading, HStack, SimpleGrid, Stack, Text,
  Flex, Spinner, Icon, Tooltip, useToast, Tabs, TabList, TabPanels,
  Tab, TabPanel, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, Input, useDisclosure,
  Checkbox, Select,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import {
  Network, Activity, FileWarning, ShieldCheck, RefreshCw, TrendingUp,
  UserCheck, Coins, AlertTriangle, Terminal, CloudLightning, Lock,
  CheckCircle, HelpCircle, Users, Plus, Download, Send,
} from 'lucide-react'
import {
  useAdminDashboard, useAdminWorkers, useAdminClaims, useAdminClaimsTrend,
  useAdminRiskDistribution, useBroadcastHistory, useReviewClaim,
  useSendAdminNotification, useBroadcastAdminNotification,
} from '../hooks/useAdmin'
import { useWeatherAdvisory } from '../hooks/useWeather'
import * as api from '../api'
import type { AdminCreateUserPayload } from '../api'
import { formatCurrency, formatDate } from '../utils/format'
import { queryClient, QUERY_KEYS, invalidateMany } from '../lib/query'
import type { UserOut } from '../api/types'

const fraudLayers = [
  { num: 1, name: "Event Verification", desc: "Correlates official IMD Red/Orange alerts whitelists" },
  { num: 2, name: "Historical Weather Comparison", desc: "Compares current metrics against 90th percentile records" },
  { num: 3, name: "Worker Behavior Risk Score", desc: "Calculates weekly personal premium adjustments" },
  { num: 4, name: "Platform Activity Check", desc: "Verifies Swiggy/Zomato pre-event active logins" },
  { num: 5, name: "Income Pattern Analysis", desc: "Detects gradual disaster drops vs sudden forced stoppages" },
  { num: 6, name: "Zone-Based Correlation", desc: "Validates district-wide gig disruption densities" },
  { num: 7, name: "Nearby Zone Cross-Validation", desc: "Checks adjacent geographic alert overlaps" },
  { num: 8, name: "Behavior Deviation Baseline", desc: "Outlier detection comparing to 4-week worker baseline" },
]



function StatCard({ label, value, accent, icon: IconComp, helper }: { label: string; value: string; accent: string; icon: any; helper: string }) {
  return (
    <Box p={6} bg="bg-surface" border="1px solid" borderColor="border-light" borderRadius="24px"
      transition="all 0.3s" _hover={{ transform: "translateY(-4px)", borderColor: accent, boxShadow: `0 12px 30px ${accent}22` }}>
      <Flex justify="space-between" align="start">
        <Stack gap={1}>
          <Text fontSize="xs" color="text-muted" fontWeight="bold" letterSpacing="0.1em">{label}</Text>
          <Heading size="xl" color="text-primary">{value}</Heading>
        </Stack>
        <Box bg={`${accent}18`} p={3} borderRadius="16px">
          <Icon as={IconComp} color={accent} boxSize={6} />
        </Box>
      </Flex>
      <Text fontSize="xs" color={accent} mt={4} fontWeight="600">{helper}</Text>
    </Box>
  )
}

function CityWeatherCard({ city }: { city: string }) {
  const { data: weather, isLoading } = useWeatherAdvisory(city)
  
  if (isLoading) {
    return (
      <Box p={4} bg="bg-surface-muted" borderRadius="16px" border="1px solid" borderColor="border-light">
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="sm" color="text-primary">{city}</Text>
          <Spinner size="xs" color="brand.500" />
        </HStack>
      </Box>
    )
  }
  
  if (!weather || weather.risk_level === 'UNKNOWN') {
    return (
      <Box p={4} bg="bg-surface-muted" borderRadius="16px" border="1px solid" borderColor="border-light">
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="sm" color="text-primary">{city}</Text>
          <Badge colorScheme="gray" fontSize="xs">Offline</Badge>
        </HStack>
        <Text fontSize="xs" color="text-muted" mt={1}>No data available</Text>
      </Box>
    )
  }

  const riskColors: Record<string, string> = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    SEVERE: 'red',
  }
  
  return (
    <Box p={4} bg="bg-surface-muted" borderRadius="16px" border="1px solid" borderColor="border-light" transition="all 0.2s" _hover={{ shadow: 'sm', transform: 'translateY(-1px)' }}>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="bold" fontSize="sm" color="text-primary">{weather.city || city}</Text>
        <Badge colorScheme={riskColors[weather.risk_level] || 'gray'} fontSize="xs" borderRadius="999px" px={2} py={0.5}>
          {weather.risk_level} RISK
        </Badge>
      </Flex>
      <HStack gap={3} fontSize="xs" color="text-secondary">
        {weather.temperature !== null && <Text>🌡️ {weather.temperature}°C</Text>}
        {weather.rainfall_mm !== null && <Text>🌧️ {weather.rainfall_mm} mm</Text>}
      </HStack>
      <Text fontSize="xs" color="text-muted" mt={1} noOfLines={1} title={weather.summary}>
        {weather.summary || 'Clear conditions.'}
      </Text>
    </Box>
  )
}

function BroadcastAdvisoryForm({ onSubmit, isPending }: { onSubmit: (region: string, title: string, message: string, type: string) => void; isPending: boolean }) {
  const [region, setRegion] = useState('mumbai')
  const [title, setTitle] = useState('Weather Advisory')
  const [message, setMessage] = useState('Heavy rain forecast today. Please ride safely and follow suggested safety guidelines.')
  const [type, setType] = useState('WEATHER_ALERT')

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) return
    onSubmit(region, title, message, type)
  }

  return (
    <Box as="form" onSubmit={handleBroadcast} bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
      <Heading size="sm" color="text-primary" mb={3}>Broadcast Safety Advisory</Heading>
      <Text fontSize="xs" color="text-secondary" mb={4}>
        Send real-time alerts or weather advisories to all registered delivery workers in a selected city or across all locations.
      </Text>
      <Stack gap={4}>
        <SimpleGrid columns={2} gap={4}>
          <Box>
            <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Target City / Region</Text>
            <Select size="sm" value={region} onChange={(e) => setRegion(e.target.value)} borderRadius="md">
              <option value="all">All Cities</option>
              <option value="mumbai">Mumbai</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="delhi">Delhi</option>
              <option value="chennai">Chennai</option>
              <option value="kolkata">Kolkata</option>
              <option value="pune">Pune</option>
            </Select>
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Notification Type</Text>
            <Select size="sm" value={type} onChange={(e) => setType(e.target.value)} borderRadius="md">
              <option value="WEATHER_ALERT">Weather Alert</option>
              <option value="SYSTEM">System Announcement</option>
              <option value="SMARTWORK_ALERT">SmartWork Advisory</option>
            </Select>
          </Box>
        </SimpleGrid>
        <Box>
          <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Alert Title</Text>
          <Input size="sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter alert title" borderRadius="md" required />
        </Box>
        <Box>
          <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Advisory Message</Text>
          <Input as="textarea" rows={3} size="sm" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type the warning message here..." borderRadius="md" required pt={2} pb={2} px={3} style={{ height: 'auto', minHeight: '80px' }} />
        </Box>
        <Button size="sm" mt={2} type="submit" colorScheme="orange" isLoading={isPending} borderRadius="999px" leftIcon={<Send size={14} />}>
          Send Broadcast
        </Button>
      </Stack>
    </Box>
  )
}

export default function AdminDashboard() {
  const { data: dashboard } = useAdminDashboard()
  const { data: workers = [] } = useAdminWorkers()
  const { data: claims = [], isLoading: claimsLoading } = useAdminClaims()
  const { data: claimsTrend = [] } = useAdminClaimsTrend()
  const { data: riskDist = [] } = useAdminRiskDistribution()
  const { data: broadcastHistory = [] } = useBroadcastHistory()
  const reviewClaim = useReviewClaim()
  const toast = useToast()

  const broadcastMutation = useBroadcastAdminNotification()

  const [tabIndex, setTabIndex] = useState(0)

  const { isOpen, onOpen, onClose } = useDisclosure()

  const [newUser, setNewUser] = useState<AdminCreateUserPayload>({
    email: '', password: '', full_name: '', platform: 'swiggy',
    region: 'Mumbai', income: 4000, pincode: '400001', upi_id: '',
    avg_weekly_hours: 22, primary_shift: 'afternoon', is_multi_platform: false,
  })

  // Custom states for system stats, search query, and worker detailed view
  const [systemStats, setSystemStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<any>(null)
  const [selectedWorkerProfile, setSelectedWorkerProfile] = useState<any>(null)
  const [selectedWorkerPolicies, setSelectedWorkerPolicies] = useState<any[]>([])
  const [selectedWorkerClaims, setSelectedWorkerClaims] = useState<any[]>([])
  const { isOpen: isWorkerDetailOpen, onOpen: onWorkerDetailOpen, onClose: onWorkerDetailClose } = useDisclosure()

  // Form edit states
  const [editHours, setEditHours] = useState<number>(30)
  const [editIncome, setEditIncome] = useState<number>(5000)
  const [editPincode, setEditPincode] = useState<string>('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Custom states for notifications and filters
  const sendNotification = useSendAdminNotification()
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState('SYSTEM')
  const [claimStatusFilter, setClaimStatusFilter] = useState('all')
  const [claimFraudFilter, setClaimFraudFilter] = useState('all')

  const fetchStats = async () => {
    try {
      const stats = await api.getSystemStats()
      setSystemStats(stats)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleUpdateWorkerProfile = async () => {
    if (!selectedWorker) return
    setIsSavingProfile(true)
    try {
      await api.adminUpdateWorkerProfile(selectedWorker.id, {
        avg_weekly_hours: editHours,
        avg_weekly_income: editIncome,
        pincode: editPincode,
      })
      toast({ title: 'Profile updated successfully', status: 'success', duration: 3000 })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminWorkers })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard })
      onWorkerDetailClose()
      refreshAll()
    } catch (err: any) {
      toast({ title: 'Failed to update profile', description: err.message || 'Error occurred', status: 'error', duration: 4000 })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleOpenWorkerDetail = async (worker: any) => {
    setSelectedWorker(worker)
    onWorkerDetailOpen()
    try {
      const profile = await api.getWorkerProfileById(worker.id)
      setSelectedWorkerProfile(profile)
      setEditHours(profile.avg_weekly_hours)
      setEditIncome(profile.avg_weekly_income)
      setEditPincode(profile.pincode)
    } catch {
      setSelectedWorkerProfile(null)
    }
    try {
      const policies = await api.listAllPolicies(worker.id)
      setSelectedWorkerPolicies(policies)
    } catch {
      setSelectedWorkerPolicies([])
    }
    try {
      const workerClaims = await api.getAdminClaims(worker.id)
      setSelectedWorkerClaims(workerClaims)
    } catch {
      setSelectedWorkerClaims([])
    }
  }

  const repriceMutation = useMutation({
    mutationFn: api.triggerRepricing,
    onSuccess: (data) => {
      toast({ title: 'Success', description: data.message, status: 'success', duration: 4000 })
      refreshAll()
    },
    onError: (err: any) => {
      toast({ title: 'Repricing failed', description: err.message || 'Error occurred', status: 'error', duration: 4000 })
    }
  })

  const createUser = useMutation({
    mutationFn: (payload: AdminCreateUserPayload) => api.adminCreateUser(payload),
    onSuccess: () => {
      toast({ title: 'User created', status: 'success', duration: 3000 })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminWorkers })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard })
      onClose()
      setNewUser({ email: '', password: '', full_name: '', platform: 'swiggy', region: 'Mumbai', income: 4000, pincode: '400001', upi_id: '', avg_weekly_hours: 22, primary_shift: 'afternoon', is_multi_platform: false })
      refreshAll()
    },
    onError: (err) => {
      toast({ title: 'Failed', description: err instanceof Error ? err.message : 'Could not create user', status: 'error', duration: 4000 })
    },
  })

  const handleReviewClaim = (claimId: number, status: string) => {
    reviewClaim.mutate({ claimId, status }, {
      onSuccess: () => {
        toast({
          title: status === 'payout_ready' ? 'Payout approved' : 'Claim closed',
          description: status === 'payout_ready' ? 'Funds sent to worker.' : 'Claim resolved.',
          status: 'success', duration: 6000, isClosable: true,
        })
        refreshAll()
      },
      onError: (err) => {
        toast({ title: 'Failed', description: err.message || 'Action blocked.', status: 'error', duration: 6000, isClosable: true })
      },
    })
  }

  const handleCreateUser = () => {
    createUser.mutate(newUser)
  }

  const refreshAll = () => {
    invalidateMany([
      QUERY_KEYS.adminDashboard,
      QUERY_KEYS.adminClaims,
      QUERY_KEYS.adminWorkers,
      QUERY_KEYS.adminClaimsTrend,
      QUERY_KEYS.adminRiskDistribution,
      QUERY_KEYS.imdTriggers,
      QUERY_KEYS.broadcastHistory
    ])
    fetchStats()
  }

  // Filter out any admin accounts from workers
  const nonAdminWorkers = workers.filter((w: any) => !w.is_admin && !w.email.toLowerCase().includes("admin"))
  const statWorkers = dashboard?.total_workers ?? nonAdminWorkers.length
  const activeClaims = claims.filter(c => c.status === 'monitoring').length
  const fraudFlagged = claims.filter(c => c.is_fraud_flagged).length
  const totalPayout = dashboard?.total_payout_amount ?? 0
  const pendingReview = dashboard?.pending_review_claims || claims.filter(c => c.status === 'manual_review')

  const isLoading = claimsLoading && !dashboard

  if (isLoading) {
    return (
      <Flex align="center" justify="center" minH="100vh" bg="bg-body" direction="column" gap={4}>
        <Spinner size="xl" thickness="4px" speed="0.8s" color="brand.400" />
        <Text color="text-secondary" fontWeight="600">Loading admin console...</Text>
      </Flex>
    )
  }

  return (
    <Box minH="100vh" bg="bg-body" pb={12}>
      <Box position="sticky" top={0} zIndex={100} bg="bg-surface" borderBottom="1px solid" borderColor="border-light" py={3} px={{ base: 4, md: 8 }}>
        <Flex maxW="1400px" mx="auto" justify="space-between" align="center" gap={4}>
          <HStack gap={3}>
            <Box bgGradient="linear(to-r, brand.400, brand.600)" p={2} borderRadius="10px">
              <Terminal size={18} color="white" />
            </Box>
            <Stack gap={0}>
              <Heading size="xs" color="text-primary" letterSpacing="0.05em">Admin Console</Heading>
              <Text fontSize="10px" color="brand.500" fontWeight="bold">Control Panel</Text>
            </Stack>
          </HStack>
          <HStack gap={3}>
            <HStack bg="bg-surface-muted" px={3} py={1.5} borderRadius="999px" border="1px solid" borderColor="border-light">
              <Box w={2} h={2} borderRadius="full" bg="emerald.400" boxShadow="0 0 8px #10B981" />
              <Text fontSize="xs" color="text-secondary" fontWeight="600">Online</Text>
            </HStack>
          </HStack>
        </Flex>
      </Box>

      <Stack maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py={6} gap={6}>
        <Tabs variant="soft-rounded" colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
          <TabList gap={2} mb={4} flexWrap="wrap">
            <Tab><HStack gap={2}><Activity size={16} /><Text>Dashboard</Text></HStack></Tab>
            <Tab><HStack gap={2}><Users size={16} /><Text>Users ({statWorkers})</Text></HStack></Tab>
            <Tab><HStack gap={2}><FileWarning size={16} /><Text>Claims ({claims.length})</Text></HStack></Tab>
            <Tab><HStack gap={2}><CloudLightning size={16} /><Text>Weather</Text></HStack></Tab>
          </TabList>

          <TabPanels>
            {/* ────── DASHBOARD TAB ────── */}
            <TabPanel px={0}>
              <Stack gap={6}>
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={6}>
                  <StatCard label="Total Workers" value={String(statWorkers)} accent="var(--chakra-colors-tealish-400)" icon={UserCheck} helper="Active profiles" />
                  <StatCard label="Active Monitoring" value={String(activeClaims)} accent="var(--chakra-colors-brand-400)" icon={Activity} helper="Income drops tracking" />
                  <StatCard label="Flagged High-Risk" value={String(fraudFlagged)} accent="var(--chakra-colors-red-400)" icon={AlertTriangle} helper="Suspicious indicators" />
                  <StatCard label="Total Payouts" value={formatCurrency(totalPayout)} accent="var(--chakra-colors-emerald-400)" icon={Coins} helper="UPI transfers completed" />
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
                  <Box gridColumn={{ base: "span 1", lg: "span 2" }} bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
                    <Flex justify="space-between" align="center" mb={4}>
                      <HStack gap={2}>
                        <TrendingUp size={20} color="var(--chakra-colors-brand-500)" />
                        <Heading size="sm" color="text-primary">Claims Trend</Heading>
                      </HStack>
                      <Badge colorScheme="teal" px={3} py={1} fontSize="xs" borderRadius="999px">Last 30 Days</Badge>
                    </Flex>
                    <Box h="260px">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={claimsTrend.length > 0 ? claimsTrend : [{ name: 'No data', claims: 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f48f1a" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f48f1a" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chakra-colors-border-light)" vertical={false} />
                          <XAxis dataKey="name" fontSize={11} stroke="var(--chakra-colors-text-muted)" tickLine={false} axisLine={false} />
                          <YAxis fontSize={11} stroke="var(--chakra-colors-text-muted)" tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--chakra-colors-border-light)', background: 'var(--chakra-colors-bg-surface)' }} />
                          <Area type="monotone" dataKey="claims" stroke="#f48f1a" strokeWidth={3} fillOpacity={1} fill="url(#colorClaims)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>

                  <Box bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light" display="flex" flexDirection="column">
                    <HStack gap={2} mb={2}>
                      <FileWarning size={20} color="var(--chakra-colors-orange-400)" />
                      <Heading size="sm" color="text-primary">Manual Review</Heading>
                    </HStack>
                    <Text fontSize="xs" color="text-muted" mb={4}>Claims needing review</Text>
                    <Stack gap={3} flex={1} overflowY="auto" maxH="260px" pr={1}>
                      {pendingReview.length > 0 ? pendingReview.map((claim) => (
                        <Box key={claim.id} p={4} border="1px solid" borderColor="border-light" bg="bg-surface-muted" borderRadius="16px">
                          <Flex justify="space-between" align="start" gap={2} mb={3}>
                            <Box>
                              <Text fontWeight="700" fontSize="sm" color="text-primary">Request #{claim.id}</Text>
                              <Text fontSize="xs" color="text-secondary">Worker #{claim.user_id}</Text>
                            </Box>
                            <Badge colorScheme="red" fontSize="10px">P: {(claim.fraud_probability || 0).toFixed(2)}</Badge>
                          </Flex>
                          <HStack justify="end" gap={2}>
                            <Button size="xs" colorScheme="teal" leftIcon={<ShieldCheck size={12} />}
                              onClick={() => handleReviewClaim(claim.id, 'payout_ready')} isLoading={reviewClaim.isPending} borderRadius="999px">
                              Approve
                            </Button>
                            <Button size="xs" colorScheme="red" variant="outline"
                              onClick={() => handleReviewClaim(claim.id, 'rejected')} isLoading={reviewClaim.isPending} borderRadius="999px">
                              Reject
                            </Button>
                          </HStack>
                        </Box>
                      )) : (
                        <Flex align="center" justify="center" h="full" direction="column" py={8}>
                          <CheckCircle size={32} color="var(--chakra-colors-emerald-400)" />
                          <Text color="text-muted" fontSize="sm" fontWeight="600" mt={2}>All clear!</Text>
                        </Flex>
                      )}
                    </Stack>
                  </Box>
                </SimpleGrid>

                <Box bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
                  <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
                    <Stack gap={0}>
                      <HStack gap={2}>
                        <Network size={20} color="var(--chakra-colors-brand-500)" />
                        <Heading size="sm" color="text-primary">Fraud Scanner</Heading>
                      </HStack>
                      <Text fontSize="xs" color="text-muted">8-layer safety checks</Text>
                    </Stack>
                    <Tooltip label="8 automated checks calculate fraud probability." placement="top">
                      <HStack color="brand.500" cursor="help" fontSize="xs" fontWeight="bold">
                        <HelpCircle size={14} />
                        <Text>Details</Text>
                      </HStack>
                    </Tooltip>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, xl: 3 }} gap={6}>
                    <Stack gridColumn={{ base: "span 1", xl: "span 2" }} gap={3} maxH="380px" overflowY="auto" pr={2}>
                      {claims.filter(c => c.status === 'monitoring' || c.is_fraud_flagged).slice(0, 8).map((claim) => (
                        <Box key={claim.id} p={4} bg="bg-surface-muted" border="1px solid"
                          borderColor={claim.is_fraud_flagged ? "red.300" : "border-light"} borderRadius="20px">
                          <Flex justify="space-between" align="center" wrap="wrap" gap={2} mb={3}>
                            <HStack gap={3}>
                              <Icon as={claim.is_fraud_flagged ? AlertTriangle : ShieldCheck}
                                color={claim.is_fraud_flagged ? "red.400" : "tealish.400"} />
                              <Stack gap={0}>
                                <Text fontWeight="700" fontSize="sm" color="text-primary">Request #{claim.id}</Text>
                                <Text fontSize="xs" color="text-muted">{claim.loss_counter}/5 days lost</Text>
                              </Stack>
                            </HStack>
                            <Badge colorScheme={claim.is_fraud_flagged ? 'red' : 'teal'} px={2.5} py={0.5}>
                              {claim.is_fraud_flagged ? 'Flagged' : 'Clean'}
                            </Badge>
                          </Flex>
                          <Flex wrap="wrap" gap={2}>
                            {fraudLayers.slice(0, 4).map(l => (
                              <Badge key={l.num} fontSize="10px" colorScheme="teal" variant="subtle">{l.name}</Badge>
                            ))}
                          </Flex>
                        </Box>
                      ))}
                      {claims.filter(c => c.status === 'monitoring' || c.is_fraud_flagged).length === 0 && (
                        <Flex direction="column" align="center" justify="center" py={12} bg="bg-surface-muted" borderRadius="20px" border="1px dashed" borderColor="border-muted">
                          <Lock size={32} color="var(--chakra-colors-text-muted)" />
                          <Text color="text-muted" fontSize="sm" mt={2}>No active monitoring</Text>
                        </Flex>
                      )}
                    </Stack>
                    <Stack gap={2} bg="bg-surface-muted" p={4} borderRadius="20px" maxH="380px" overflowY="auto">
                      <Text fontSize="xs" fontWeight="bold" color="brand.500" letterSpacing="0.05em">8 Layers</Text>
                      {fraudLayers.map(l => (
                        <Box key={l.num} p={2} borderBottom="1px solid" borderColor="border-muted" _last={{ border: 0 }}>
                          <Text fontSize="xs" fontWeight="bold" color="text-primary">{l.num}. {l.name}</Text>
                          <Text fontSize="10px" color="text-muted">{l.desc}</Text>
                        </Box>
                      ))}
                    </Stack>
                  </SimpleGrid>
                </Box>

                <Box bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
                  <Heading size="sm" color="text-primary" mb={2}>Risk Distribution</Heading>
                  <Text fontSize="xs" color="text-muted" mb={4}>Worker safety levels</Text>
                  <SimpleGrid columns={4} gap={4}>
                    {(riskDist.length > 0 ? riskDist : [
                      { label: 'Low Risk', count: 0, color: 'emerald' },
                      { label: 'Medium Risk', count: 0, color: 'tealish' },
                      { label: 'High Risk', count: 0, color: 'brand' },
                      { label: 'Very High Risk', count: 0, color: 'red' },
                    ]).map(({ label, count }: any) => {
                      let glow = "tealish.400"
                      if (label.includes("Very High")) glow = "red.400"
                      else if (label.includes("High")) glow = "brand.400"
                      else if (label.includes("Low")) glow = "emerald.400"
                      return (
                        <Box key={label} p={4} bg="bg-surface-muted" borderRadius="20px" border="1px solid" borderColor="border-light" textAlign="center">
                          <Text fontWeight="800" fontSize="3xl" color={glow}>{count}</Text>
                          <Text fontSize="xs" color="text-secondary" fontWeight="600">{label}</Text>
                        </Box>
                      )
                    })}
                  </SimpleGrid>
                </Box>

                {/* System Control Panel & Health Metrics */}
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <Box bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
                    <HStack gap={2} mb={2}>
                      <RefreshCw size={20} color="var(--chakra-colors-brand-500)" />
                      <Heading size="sm" color="text-primary">System Control Panel</Heading>
                    </HStack>
                    <Text fontSize="xs" color="text-muted" mb={4}>Trigger administrative routines</Text>
                    <Stack gap={4}>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" color="text-primary" mb={2}>Weekly Repricing Routine</Text>
                        <Text fontSize="xs" color="text-secondary" mb={3}>
                          Recalculates risk categories, updates premium rates for the next week, and issues weekly policies for all active workers.
                        </Text>
                        <Button
                          colorScheme="brand"
                          onClick={() => repriceMutation.mutate()}
                          isLoading={repriceMutation.isPending}
                          leftIcon={<RefreshCw size={14} />}
                          borderRadius="999px"
                          size="sm"
                        >
                          Run Repricing Now
                        </Button>
                      </Box>
                    </Stack>
                  </Box>

                  <Box bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
                    <HStack gap={2} mb={2}>
                      <Activity size={20} color="var(--chakra-colors-emerald-500)" />
                      <Heading size="sm" color="text-primary">System Health Metrics</Heading>
                    </HStack>
                    <Text fontSize="xs" color="text-muted" mb={4}>Database and service status</Text>
                    {systemStats ? (
                      <SimpleGrid columns={2} gap={4}>
                        <Box>
                          <Text fontSize="xs" color="text-secondary">DB Status</Text>
                          <Badge colorScheme="emerald">Healthy</Badge>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="text-secondary">Database Size</Text>
                          <Text fontSize="sm" fontWeight="700" color="text-primary">
                            {(systemStats.db_size_bytes / 1024).toFixed(1)} KB
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="text-secondary">Total Workers</Text>
                          <Text fontSize="sm" fontWeight="700" color="text-primary">
                            {systemStats.total_users}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="text-secondary">Total Claims</Text>
                          <Text fontSize="sm" fontWeight="700" color="text-primary">
                            {systemStats.total_claims}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="text-secondary">Active Policies</Text>
                          <Text fontSize="sm" fontWeight="700" color="text-primary">
                            {systemStats.total_policies}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="text-secondary">Payouts Completed</Text>
                          <Text fontSize="sm" fontWeight="700" color="text-primary">
                            {systemStats.total_payouts}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    ) : (
                      <Spinner size="sm" color="brand.500" />
                    )}
                  </Box>
                </SimpleGrid>
              </Stack>
            </TabPanel>

            {/* ────── USERS TAB ────── */}
            <TabPanel px={0}>
              <Stack gap={6}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                  <HStack gap={4} flex={1} minW="300px">
                    <Heading size="lg" color="text-primary" minW="fit-content">All Workers</Heading>
                    <Input
                      placeholder="Search workers by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      maxW="350px"
                      bg="bg-surface"
                      borderRadius="999px"
                      border="1px solid"
                      borderColor="border-light"
                      size="sm"
                    />
                  </HStack>
                  <Button leftIcon={<Plus size={16} />} colorScheme="brand" onClick={onOpen} borderRadius="999px">
                    Create User
                  </Button>
                </Flex>

                <Box bg="bg-surface" borderRadius="28px" border="1px solid" borderColor="border-light" overflow="hidden">
                  <Box overflowX="auto">
                    <Box as="table" w="full" sx={{ borderCollapse: 'collapse' }}>
                      <Box as="thead" bg="bg-surface-muted">
                        <Box as="tr">
                          {['ID', 'Name', 'Email', 'App', 'City', 'Income', 'Status', 'Created'].map(h => (
                            <Box as="th" key={h} px={4} py={3} textAlign="left" fontSize="xs" color="text-muted" fontWeight="700" letterSpacing="0.05em" borderBottom="1px solid" borderColor="border-light">{h}</Box>
                          ))}
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {(() => {
                          const query = searchQuery.toLowerCase()
                          const filtered = nonAdminWorkers.filter((u: any) =>
                            (u.full_name || '').toLowerCase().includes(query) ||
                            u.email.toLowerCase().includes(query)
                          )
                          if (filtered.length === 0) {
                            return (
                              <Box as="tr">
                                <Box as="td" colSpan={8} py={8} textAlign="center" color="text-secondary" fontSize="sm">
                                  No workers found matching your search query.
                                </Box>
                              </Box>
                            )
                          }
                          return filtered.map((u: UserOut) => (
                            <Box as="tr" key={u.id} _hover={{ bg: 'bg-surface-muted', cursor: 'pointer' }} transition="background 0.15s" onClick={() => handleOpenWorkerDetail(u)}>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">#{u.id}</Box>
                              <Box as="td" px={4} py={3} fontSize="sm" fontWeight={600} color="text-primary" borderBottom="1px solid" borderColor="border-muted">{u.full_name || '—'}</Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">{u.email}</Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted"><Badge variant="subtle">{u.platform}</Badge></Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">{u.region}</Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-primary" fontWeight={600} borderBottom="1px solid" borderColor="border-muted">{formatCurrency(u.income)}</Box>
                              <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                <Badge variant="outline" colorScheme="tealish">Worker</Badge>
                              </Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-muted" borderBottom="1px solid" borderColor="border-muted">{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Box>
                            </Box>
                          ))
                        })()}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </TabPanel>

            {/* ────── CLAIMS TAB ────── */}
            <TabPanel px={0}>
              <Stack gap={4}>
                <Heading size="lg" color="text-primary">All Claims</Heading>
                
                <Flex gap={4} wrap="wrap" mb={2}>
                  <Box minW="180px">
                    <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>Status Filter</Text>
                    <Select size="sm" value={claimStatusFilter} onChange={(e) => setClaimStatusFilter(e.target.value)} borderRadius="999px" bg="bg-surface" border="1px solid" borderColor="border-light">
                      <option value="all">All Statuses</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="manual_review">Manual Review</option>
                      <option value="payout_ready">Payout Ready</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </Box>
                  <Box minW="180px">
                    <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>Fraud Check Filter</Text>
                    <Select size="sm" value={claimFraudFilter} onChange={(e) => setClaimFraudFilter(e.target.value)} borderRadius="999px" bg="bg-surface" border="1px solid" borderColor="border-light">
                      <option value="all">All Claims</option>
                      <option value="clean">Clean (Passed Checks)</option>
                      <option value="flagged">Flagged (Suspicious)</option>
                    </Select>
                  </Box>
                </Flex>

                <Box bg="bg-surface" borderRadius="28px" border="1px solid" borderColor="border-light" overflow="hidden">
                  <Box overflowX="auto">
                    <Box as="table" w="full" sx={{ borderCollapse: 'collapse' }}>
                      <Box as="thead" bg="bg-surface-muted">
                        <Box as="tr">
                          {['ID', 'Worker', 'Status', 'Days Lost', 'Amount', 'Fraud Check', 'Created', 'Actions'].map(h => (
                            <Box as="th" key={h} px={4} py={3} textAlign="left" fontSize="xs" color="text-muted" fontWeight="700" letterSpacing="0.05em" borderBottom="1px solid" borderColor="border-light">{h}</Box>
                          ))}
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {(() => {
                          const filtered = claims.filter((c) => {
                            const statusMatch = claimStatusFilter === 'all' || c.status === claimStatusFilter
                            const fraudMatch = claimFraudFilter === 'all' || 
                                               (claimFraudFilter === 'clean' && !c.is_fraud_flagged) ||
                                               (claimFraudFilter === 'flagged' && c.is_fraud_flagged)
                            return statusMatch && fraudMatch
                          })
                          if (filtered.length === 0) {
                            return (
                              <Box as="tr">
                                <Box as="td" colSpan={8} py={8} textAlign="center" color="text-secondary" fontSize="sm">
                                  No claims match the selected filters.
                                </Box>
                              </Box>
                            )
                          }
                          return filtered.slice(0, 50).map((c) => (
                            <Box as="tr" key={c.id} _hover={{ bg: 'bg-surface-muted' }} transition="background 0.15s">
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">#{c.id}</Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-primary" fontWeight={600} borderBottom="1px solid" borderColor="border-muted">#{c.user_id}</Box>
                              <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                <Badge colorScheme={c.status === 'closed' ? 'teal' : c.status === 'rejected' ? 'red' : c.status === 'manual_review' ? 'orange' : 'blue'}>
                                  {c.status}
                                </Badge>
                              </Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">{c.loss_counter}/5</Box>
                              <Box as="td" px={4} py={3} fontSize="sm" fontWeight={600} color="text-primary" borderBottom="1px solid" borderColor="border-muted">{c.payout_amount ? formatCurrency(c.payout_amount) : '—'}</Box>
                              <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                {c.is_fraud_flagged ? <Badge colorScheme="red">Flagged</Badge> : <Badge colorScheme="green" variant="solid">Clean (Pass)</Badge>}
                              </Box>
                              <Box as="td" px={4} py={3} fontSize="sm" color="text-muted" borderBottom="1px solid" borderColor="border-muted">{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Box>
                              <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                {(c.status === 'monitoring' || c.status === 'manual_review' || c.status === 'opened') ? (
                                  <HStack gap={2}>
                                    <Button size="xs" colorScheme="teal" onClick={() => handleReviewClaim(c.id, 'payout_ready')} isLoading={reviewClaim.isPending} borderRadius="999px">
                                      Approve
                                    </Button>
                                    <Button size="xs" colorScheme="red" variant="outline" onClick={() => handleReviewClaim(c.id, 'rejected')} isLoading={reviewClaim.isPending} borderRadius="999px">
                                      Reject
                                    </Button>
                                  </HStack>
                                ) : (
                                  <Text fontSize="xs" color="text-muted">—</Text>
                                )}
                              </Box>
                            </Box>
                          ))
                        })()}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </TabPanel>

            {/* ────── WEATHER TAB ────── */}
            <TabPanel px={0}>
              <Stack gap={6}>
                <Heading size="lg" color="text-primary">Weather Alerts Control Center</Heading>
                
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} alignItems="start">
                  {/* Left Column: Broadcast History Log */}
                  <Box bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="sm" color="text-primary">Safety Broadcast History</Heading>
                    </Flex>
                    <Stack gap={3} maxH="560px" overflowY="auto">
                      {broadcastHistory.length > 0 ? broadcastHistory.map((b) => {
                        const typeColors: Record<string, string> = {
                          WEATHER_ALERT: 'orange',
                          SYSTEM: 'blue',
                          SMARTWORK_ALERT: 'teal',
                        }
                        return (
                          <Box key={b.id} p={4} bg="bg-surface-muted" border="1px solid" borderColor="border-light" borderRadius="20px">
                            <Stack gap={2}>
                              <Flex justify="space-between" align="start">
                                <Stack gap={0.5}>
                                  <Text fontWeight="700" fontSize="sm" color="text-primary">{b.title}</Text>
                                  <Text fontSize="10px" color="text-muted">{formatDate(b.created_at)}</Text>
                                </Stack>
                                <Badge variant="subtle" colorScheme={typeColors[b.type] || 'gray'} fontSize="2xs" px={2} py={0.5} borderRadius="md">
                                  {b.type.replace('_', ' ')}
                                </Badge>
                              </Flex>
                              
                              <Text fontSize="xs" color="text-secondary" lineHeight="tall">{b.message}</Text>
                              
                              <Flex justify="space-between" align="center" mt={1}>
                                <Badge colorScheme="purple" variant="solid" fontSize="10px" px={2} py={0.5} borderRadius="full">
                                  Target: {b.region.charAt(0).toUpperCase() + b.region.slice(1).toLowerCase()}
                                </Badge>
                                <Text fontSize="11px" fontWeight="600" color="brand.500">
                                  📢 {b.recipient_count} worker{b.recipient_count === 1 ? '' : 's'} notified
                                </Text>
                              </Flex>
                            </Stack>
                          </Box>
                        )
                      }) : (
                        <Text color="text-muted" fontSize="sm" py={8} textAlign="center">No safety broadcasts sent yet.</Text>
                      )}
                    </Stack>
                  </Box>

                  {/* Right Column: Broadcast Form & Live Status */}
                  <Stack gap={6}>
                    <BroadcastAdvisoryForm
                      onSubmit={(region, title, message, type) => {
                        broadcastMutation.mutate({ region, title, message, type }, {
                          onSuccess: (data) => {
                            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.broadcastHistory })
                            toast({
                              title: 'Advisory Broadcasted',
                              description: data.message,
                              status: 'success',
                              duration: 5000,
                              isClosable: true,
                            })
                          },
                          onError: (err: any) => {
                            toast({
                              title: 'Broadcast Failed',
                              description: err.message || 'Error occurred',
                              status: 'error',
                              duration: 5000,
                              isClosable: true,
                            })
                          }
                        })
                      }}
                      isPending={broadcastMutation.isPending}
                    />

                    <Box bg="bg-surface" borderRadius="28px" p={6} border="1px solid" borderColor="border-light">
                      <Heading size="sm" color="text-primary" mb={3}>Live City Weather Advisories</Heading>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                        {['Mumbai', 'Bengaluru', 'Delhi', 'Chennai', 'Kolkata', 'Pune'].map((cityName) => (
                          <CityWeatherCard key={cityName} city={cityName} />
                        ))}
                      </SimpleGrid>
                    </Box>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      {/* ────── CREATE USER MODAL ────── */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="bg-surface" borderRadius="28px">
          <ModalHeader>
            <Heading size="md" color="text-primary">Create New User</Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack gap={4}>
              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Full Name</Text>
                  <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="Worker name" />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Email *</Text>
                  <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Password *</Text>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Set password" />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Delivery App</Text>
                  <Select value={newUser.platform} onChange={(e) => setNewUser({ ...newUser, platform: e.target.value })}>
                    {['swiggy', 'zomato', 'dunzo', 'blinkit', 'other'].map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>City</Text>
                  <Input value={newUser.region} onChange={(e) => setNewUser({ ...newUser, region: e.target.value })} placeholder="e.g. Mumbai" />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Pincode</Text>
                  <Input value={newUser.pincode} onChange={(e) => setNewUser({ ...newUser, pincode: e.target.value })} placeholder="6-digit pincode" />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Weekly Income (₹)</Text>
                  <Input type="number" value={newUser.income} onChange={(e) => setNewUser({ ...newUser, income: Number(e.target.value) })} min={1500} />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>Work Hours / Week</Text>
                  <Input type="number" value={newUser.avg_weekly_hours} onChange={(e) => setNewUser({ ...newUser, avg_weekly_hours: Number(e.target.value) })} min={1} />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight={600} color="text-secondary" mb={1}>UPI ID</Text>
                  <Input value={newUser.upi_id} onChange={(e) => setNewUser({ ...newUser, upi_id: e.target.value })} placeholder="name@upi" />
                </Box>
              </SimpleGrid>
              <Checkbox isChecked={newUser.is_multi_platform} onChange={(e) => setNewUser({ ...newUser, is_multi_platform: e.target.checked })}>
                <Text fontSize="sm" color="text-secondary">Works on multiple apps</Text>
              </Checkbox>
              <Checkbox isChecked={newUser.is_admin} onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}>
                <Text fontSize="sm" color="text-secondary">Admin account</Text>
              </Checkbox>
              <Button colorScheme="brand" onClick={handleCreateUser} isLoading={createUser.isPending} loadingText="Creating..." borderRadius="999px" mt={2}>
                Create User
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ────── WORKER DETAIL MODAL ────── */}
      <Modal isOpen={isWorkerDetailOpen} onClose={onWorkerDetailClose} size="4xl">
        <ModalOverlay />
        <ModalContent bg="bg-surface" borderRadius="28px" maxW="900px">
          <ModalHeader borderBottom="1px solid" borderColor="border-light" py={4}>
            <Flex justify="space-between" align="center" pr={6}>
              <HStack gap={3}>
                <Box bgGradient="linear(to-r, tealish.400, brand.500)" p={2.5} borderRadius="16px">
                  <Icon as={Users} color="white" boxSize={5} />
                </Box>
                <Stack gap={0}>
                  <Heading size="sm" color="text-primary">
                    {selectedWorker ? selectedWorker.full_name : 'Worker Profile'}
                  </Heading>
                  <Text fontSize="xs" color="text-muted">
                    Worker ID: #{selectedWorker?.id} • Platform: {selectedWorker?.platform}
                  </Text>
                </Stack>
              </HStack>
              <Badge variant="solid" colorScheme="tealish" px={3} py={1} borderRadius="999px">
                {selectedWorkerProfile?.zone ? `Zone ${selectedWorkerProfile.zone}` : 'Loading...'}
              </Badge>
            </Flex>
          </ModalHeader>
          <ModalCloseButton top={4} />
          <ModalBody py={6}>
            {!selectedWorkerProfile ? (
              <Flex align="center" justify="center" py={12} direction="column" gap={3}>
                <Spinner size="lg" color="brand.500" />
                <Text color="text-secondary" fontSize="sm">Fetching profile details...</Text>
              </Flex>
            ) : (
              <Tabs variant="line" colorScheme="brand">
                <TabList mb={4}>
                  <Tab fontSize="sm" fontWeight="bold">Operational Profile</Tab>
                  <Tab fontSize="sm" fontWeight="bold">Active & Past Policies</Tab>
                  <Tab fontSize="sm" fontWeight="bold">Claims History</Tab>
                  <Tab fontSize="sm" fontWeight="bold">Send Alert/Notification</Tab>
                </TabList>
                <TabPanels>
                  {/* Tab 1: Operational Profile */}
                  <TabPanel px={0}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
                      {/* Left: Computed Metrics */}
                      <Stack gap={5}>
                        <Heading size="xs" color="text-muted" letterSpacing="0.05em" textTransform="uppercase">
                          Derived Metrics (Read-only)
                        </Heading>
                        <Box bg="bg-surface-muted" p={4} borderRadius="20px" border="1px solid" borderColor="border-light">
                          <SimpleGrid columns={2} gap={4}>
                            <Box>
                              <Text fontSize="xs" color="text-muted">Assigned Zone</Text>
                              <Text fontSize="md" fontWeight="bold" color="text-primary">Zone {selectedWorkerProfile.zone}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="text-muted">Weekly Coverage</Text>
                              <Text fontSize="md" fontWeight="bold" color="text-primary">{formatCurrency(selectedWorkerProfile.weekly_coverage)}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="text-muted">Income Tier</Text>
                              <Text fontSize="md" fontWeight="bold" color="text-primary">{selectedWorkerProfile.tier}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="text-muted">Weekly Premium</Text>
                              <Text fontSize="md" fontWeight="bold" color="text-primary">{formatCurrency(selectedWorkerProfile.weekly_premium)}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="text-muted">Primary Shift</Text>
                              <Text fontSize="md" fontWeight="bold" color="text-primary" textTransform="capitalize">
                                {selectedWorkerProfile.primary_shift || 'Afternoon'}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="text-muted">Multi-platform</Text>
                              <Badge colorScheme={selectedWorkerProfile.is_multi_platform ? 'teal' : 'gray'}>
                                {selectedWorkerProfile.is_multi_platform ? 'Yes' : 'No'}
                              </Badge>
                            </Box>
                          </SimpleGrid>
                        </Box>

                        <Box bg="bg-surface-muted" p={4} borderRadius="20px" border="1px solid" borderColor="border-light">
                          <Text fontSize="xs" color="text-secondary" fontWeight="700" mb={1}>Worker Email</Text>
                          <Text fontSize="sm" color="text-primary" mb={3} fontWeight="500">{selectedWorker?.email}</Text>
                          <Text fontSize="xs" color="text-secondary" fontWeight="700" mb={1}>City / Region</Text>
                          <Text fontSize="sm" color="text-primary" fontWeight="500">{selectedWorker?.region}</Text>
                        </Box>
                      </Stack>

                      {/* Right: Editable Fields */}
                      <Stack gap={5}>
                        <Heading size="xs" color="text-muted" letterSpacing="0.05em" textTransform="uppercase">
                          Edit Work Profile Parameters
                        </Heading>
                        <Stack gap={4}>
                          <Box>
                            <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>
                              Average Weekly Hours
                            </Text>
                            <Input
                              type="number"
                              value={editHours}
                              onChange={(e) => setEditHours(Number(e.target.value))}
                              bg="bg-surface"
                            />
                            <Text fontSize="10px" color="text-muted" mt={1}>
                              Looked up against weekly hour bands to determine Coverage.
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>
                              Average Weekly Income (₹)
                            </Text>
                            <Input
                              type="number"
                              value={editIncome}
                              onChange={(e) => setEditIncome(Number(e.target.value))}
                              bg="bg-surface"
                            />
                            <Text fontSize="10px" color="text-muted" mt={1}>
                              Determines base daily rate. Must be positive.
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>
                              Pincode
                            </Text>
                            <Input
                              value={editPincode}
                              onChange={(e) => setEditPincode(e.target.value)}
                              bg="bg-surface"
                              maxLength={6}
                            />
                            <Text fontSize="10px" color="text-muted" mt={1}>
                              6-digit local pincode for weather risk profiling.
                            </Text>
                          </Box>
                          <Button
                            colorScheme="brand"
                            onClick={handleUpdateWorkerProfile}
                            isLoading={isSavingProfile}
                            loadingText="Saving Updates..."
                            borderRadius="999px"
                            mt={2}
                          >
                            Save operational Profile
                          </Button>
                        </Stack>
                      </Stack>
                    </SimpleGrid>
                  </TabPanel>

                  {/* Tab 2: Policies */}
                  <TabPanel px={0}>
                    <Box bg="bg-surface" borderRadius="20px" border="1px solid" borderColor="border-light" overflow="hidden">
                      <Box overflowX="auto">
                        <Box as="table" w="full" sx={{ borderCollapse: 'collapse' }}>
                          <Box as="thead" bg="bg-surface-muted">
                            <Box as="tr">
                              {['ID', 'Start Date', 'End Date', 'Premium', 'Coverage', 'Status', 'Certificate'].map(h => (
                                <Box as="th" key={h} px={4} py={3} textAlign="left" fontSize="xs" color="text-muted" fontWeight="700" letterSpacing="0.05em" borderBottom="1px solid" borderColor="border-light">{h}</Box>
                              ))}
                            </Box>
                          </Box>
                          <Box as="tbody">
                            {selectedWorkerPolicies.length === 0 ? (
                              <Box as="tr">
                                <Box as="td" colSpan={7} py={8} textAlign="center" color="text-secondary" fontSize="sm">
                                  No policies found for this worker.
                                </Box>
                              </Box>
                            ) : (
                              selectedWorkerPolicies.map((pol) => (
                                <Box as="tr" key={pol.id}>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">#{pol.id}</Box>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">{pol.week_start_date}</Box>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">{pol.week_end_date}</Box>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-primary" fontWeight={600} borderBottom="1px solid" borderColor="border-muted">{formatCurrency(pol.weekly_premium)}</Box>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-primary" fontWeight={600} borderBottom="1px solid" borderColor="border-muted">{formatCurrency(pol.weekly_coverage)}</Box>
                                  <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                    <Badge colorScheme={pol.is_paid ? 'green' : 'orange'}>
                                      {pol.is_paid ? 'Paid' : 'Unpaid'}
                                    </Badge>
                                  </Box>
                                  <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="brand"
                                      leftIcon={<Icon as={Download} size={12} />}
                                      onClick={() => api.downloadPolicyCertificate(pol.id)}
                                    >
                                      PDF
                                    </Button>
                                  </Box>
                                </Box>
                              ))
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </TabPanel>

                  {/* Tab 3: Claims */}
                  <TabPanel px={0}>
                    <Box bg="bg-surface" borderRadius="20px" border="1px solid" borderColor="border-light" overflow="hidden">
                      <Box overflowX="auto">
                        <Box as="table" w="full" sx={{ borderCollapse: 'collapse' }}>
                          <Box as="thead" bg="bg-surface-muted">
                            <Box as="tr">
                              {['ID', 'Status', 'Days Lost', 'Payout Amount', 'Fraud Indicator', 'Created', 'Actions'].map(h => (
                                <Box as="th" key={h} px={4} py={3} textAlign="left" fontSize="xs" color="text-muted" fontWeight="700" letterSpacing="0.05em" borderBottom="1px solid" borderColor="border-light">{h}</Box>
                              ))}
                            </Box>
                          </Box>
                          <Box as="tbody">
                            {selectedWorkerClaims.length === 0 ? (
                              <Box as="tr">
                                <Box as="td" colSpan={7} py={8} textAlign="center" color="text-secondary" fontSize="sm">
                                  No claims filed by this worker.
                                </Box>
                              </Box>
                            ) : (
                              selectedWorkerClaims.map((cl) => (
                                <Box as="tr" key={cl.id}>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">#{cl.id}</Box>
                                  <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                    <Badge colorScheme={cl.status === 'closed' ? 'teal' : cl.status === 'rejected' ? 'red' : cl.status === 'manual_review' ? 'orange' : 'blue'}>
                                      {cl.status}
                                    </Badge>
                                  </Box>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-secondary" borderBottom="1px solid" borderColor="border-muted">{cl.loss_counter}/5</Box>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-primary" fontWeight={600} borderBottom="1px solid" borderColor="border-muted">{cl.payout_amount ? formatCurrency(cl.payout_amount) : '—'}</Box>
                                  <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                    {cl.is_fraud_flagged ? <Badge colorScheme="red">Flagged</Badge> : <Badge colorScheme="green" variant="solid">Clean (Pass)</Badge>}
                                  </Box>
                                  <Box as="td" px={4} py={3} fontSize="sm" color="text-muted" borderBottom="1px solid" borderColor="border-muted">{new Date(cl.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Box>
                                  <Box as="td" px={4} py={3} borderBottom="1px solid" borderColor="border-muted">
                                    {(cl.status === 'monitoring' || cl.status === 'manual_review' || cl.status === 'opened') ? (
                                      <HStack gap={1.5}>
                                        <Button
                                          size="xs"
                                          colorScheme="teal"
                                          onClick={async () => {
                                            await handleReviewClaim(cl.id, 'payout_ready');
                                            const updatedClaims = await api.getAdminClaims(selectedWorker.id);
                                            setSelectedWorkerClaims(updatedClaims);
                                          }}
                                          isLoading={reviewClaim.isPending}
                                          borderRadius="999px"
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="xs"
                                          colorScheme="red"
                                          variant="outline"
                                          onClick={async () => {
                                            await handleReviewClaim(cl.id, 'rejected');
                                            const updatedClaims = await api.getAdminClaims(selectedWorker.id);
                                            setSelectedWorkerClaims(updatedClaims);
                                          }}
                                          isLoading={reviewClaim.isPending}
                                          borderRadius="999px"
                                        >
                                          Reject
                                        </Button>
                                      </HStack>
                                    ) : (
                                      <Text fontSize="xs" color="text-muted">—</Text>
                                    )}
                                  </Box>
                                </Box>
                              ))
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </TabPanel>

                  {/* Tab 4: Send Custom Notification */}
                  <TabPanel px={0}>
                    <Stack gap={4} maxW="500px">
                      <Box>
                        <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>
                          Notification Title
                        </Text>
                        <Input
                          placeholder="e.g. Profile Recalibrated"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>
                          Message Content
                        </Text>
                        <Input
                          as="textarea"
                          h="100px"
                          placeholder="Type notification message here..."
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          py={2}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="xs" fontWeight="700" color="text-secondary" mb={1.5}>
                          Notification Category
                        </Text>
                        <Select value={notifType} onChange={(e) => setNotifType(e.target.value)} borderRadius="999px">
                          <option value="SYSTEM">System Notification</option>
                          <option value="WEATHER_ALERT">Weather Emergency Alert</option>
                          <option value="SMARTWORK_ALERT">SmartWork Recommendation</option>
                        </Select>
                      </Box>
                      <Button
                        colorScheme="brand"
                        leftIcon={<Icon as={Send} size={14} />}
                        onClick={async () => {
                          if (!notifTitle || !notifMessage) {
                            toast({ title: 'Please fill in title and message', status: 'warning', duration: 3000 })
                            return
                          }
                          try {
                            await sendNotification.mutateAsync({
                              userId: selectedWorker.id,
                              payload: { title: notifTitle, message: notifMessage, type: notifType }
                            })
                            toast({ title: 'Notification dispatched successfully', status: 'success', duration: 4000 })
                            setNotifTitle('')
                            setNotifMessage('')
                          } catch (err: any) {
                            toast({ title: 'Failed to send notification', description: err.message, status: 'error', duration: 4000 })
                          }
                        }}
                        isLoading={sendNotification.isPending}
                        borderRadius="999px"
                      >
                        Dispatch Notification
                      </Button>
                    </Stack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
