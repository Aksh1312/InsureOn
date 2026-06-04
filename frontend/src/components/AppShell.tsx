import {
  Box,
  Button,
  Flex,
  HStack,
  Link,
  Text,
  VStack,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Stack,
  Show,
  Hide,
  Spinner,
  useColorMode,
} from '@chakra-ui/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AlertCircle,
  LayoutDashboard,
  FileText,
  Wallet,
  Zap,
  User,
  Menu,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../api'
import type { IMDTrigger } from '../api/types'
import NotificationCenter from './ui/NotificationCenter'
import { queryClient } from '../lib/query'
import { QUERY_KEYS, invalidateMany } from '../lib/query'

const navItems = [
  { label: 'Home', to: '/app', end: true, icon: LayoutDashboard },
  { label: 'Plan', to: '/app/policies', icon: ShieldCheck },
  { label: 'Help', to: '/app/claims', icon: FileText },
  { label: 'Payments', to: '/app/payout-center', icon: Wallet },
  { label: 'SmartWork', to: '/app/smartwork', icon: Zap },
  { label: 'Settings', to: '/app/settings', icon: SettingsIcon },
  { label: 'Profile', to: '/app/profile', icon: User },
]

const bottomNavItems = [
  { label: 'Home', to: '/app', end: true, icon: LayoutDashboard },
  { label: 'Help', to: '/app/claims', icon: FileText },
  { label: 'Payments', to: '/app/payout-center', icon: Wallet },
  { label: 'SmartWork', to: '/app/smartwork', icon: Zap },
]

const REGION_TO_ZONE: Record<string, string> = {
  chennai: 'A', mumbai: 'A', kolkata: 'A', kochi: 'A', cochin: 'A',
  bhubaneswar: 'A', vizag: 'A', visakhapatnam: 'A',
  bengaluru: 'B', bangalore: 'B', hyderabad: 'B', ahmedabad: 'B',
  surat: 'B', nagpur: 'B',
  delhi: 'C', pune: 'C', jaipur: 'C', lucknow: 'C', chandigarh: 'C', indore: 'C',
}

function districtDisplayName(t: IMDTrigger) {
  return t.district ?? `Zone ${t.zone_triggered}`
}

function uniqueAlerts(triggers: IMDTrigger[]): IMDTrigger[] {
  const seen = new Set<string>()
  return triggers.filter(t => {
    const name = districtDisplayName(t)
    if (seen.has(name)) return false
    seen.add(name)
    return true
  })
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { colorMode, toggleColorMode } = useColorMode()
  const [imdAlerts, setImdAlerts] = useState<IMDTrigger[]>([])
  const [imdAlertActive, setImdAlertActive] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [showPullIndicator, setShowPullIndicator] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval>>()

  const userRegion = useMemo(() => {
    if (!user || user.is_admin) return null
    return (user.region || '').trim().toLowerCase() || null
  }, [user])

  const userZone = useMemo(() => {
    if (!userRegion) return null
    return REGION_TO_ZONE[userRegion] || null
  }, [userRegion])

  useEffect(() => {
    const applyFilter = (triggers: IMDTrigger[]) => {
      const filtered = userRegion
        ? triggers.filter(t => t.zone_triggered === userZone && t.district?.toLowerCase() === userRegion)
        : triggers
      setImdAlerts(filtered)
      setImdAlertActive(filtered.some(t => t.alert_color === 'RED' || t.alert_color === 'ORANGE'))
    }

    const interval = setInterval(() => {
      api.getIMDTriggers()
        .then(applyFilter)
        .catch(() => {})
    }, 60_000)
    api.getIMDTriggers()
      .then(applyFilter)
      .catch(() => setImdAlertActive(false))
    return () => clearInterval(interval)
  }, [userZone])

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      invalidateMany([
        QUERY_KEYS.dashboard,
        QUERY_KEYS.payoutHistory,
        QUERY_KEYS.smartworkTip,
        QUERY_KEYS.activeClaim,
      ])
    }, 60_000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payoutHistory }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartworkTip }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeClaim }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.claimHistory }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activePolicy }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.policyHistory }),
    ])
    setTimeout(() => setIsRefreshing(false), 500)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0) {
      const clamped = Math.min(diff * 0.4, 80)
      setPullDistance(clamped)
      setShowPullIndicator(clamped > 20)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 40) {
      handleRefreshAll()
    }
    setPullDistance(0)
    setShowPullIndicator(false)
    isPulling.current = false
  }, [pullDistance, handleRefreshAll])

  return (
      <Box
        minH="100vh"
        bg="bg-body"
      pb={{ base: '72px', md: 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      transition="padding 0.2s"
    >
      {showPullIndicator && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          zIndex={30}
          display="flex"
          alignItems="center"
          justifyContent="center"
          h={`${Math.max(pullDistance, 30)}px`}
          bg="white"
          borderBottomWidth="1px"
          borderColor="blackAlpha.100"
          transition="height 0.1s"
        >
                  <HStack gap={2} color="text-secondary">
            <RefreshCw
              size={16}
              style={{
                transform: `rotate(${pullDistance * 3}deg)`,
                transition: 'transform 0.1s',
              }}
            />
            <Text fontSize="sm">
              {pullDistance > 40 ? 'Release to update' : 'Pull to update'}
            </Text>
          </HStack>
        </Box>
      )}

      {imdAlertActive && (
        <Box
          bg={imdAlerts.some(t => t.alert_color === 'RED') ? '#E53E3E' : '#DD6B20'}
          color="white"
          py={2}
          px={4}
        >
          <VStack gap={0.5} align="center">
            <HStack gap={1.5}>
              <AlertCircle size={14} />
              <Text fontSize="xs" fontWeight={700} letterSpacing="wide">
                🚨 OFFICIAL ZONE ALERT
              </Text>
            </HStack>
            <HStack gap={2} flexWrap="wrap" justify="center" fontSize="sm">
              {uniqueAlerts(imdAlerts
                .filter(t => (t.alert_color === 'RED' || t.alert_color === 'ORANGE') && t.district && !t.district.startsWith('sim-zone-') && t.district !== 'Test District' && t.district !== 'Manual Filing')
              ).slice(0, 3).map((t) => (
                <HStack key={t.id} gap={1} fontSize="xs">
                  <Text fontWeight={800}>{t.alert_color} ALERT</Text>
                  <Text>·</Text>
                  <Text>Zone {t.zone_triggered}</Text>
                  <Text>·</Text>
                  <Text>{districtDisplayName(t)}</Text>
                </HStack>
              ))}
            </HStack>
          </VStack>
        </Box>
      )}

      <Box
        bg="bg-surface"
        backdropFilter="blur(12px)"
        position="sticky"
        top={imdAlertActive ? '56px' : 0}
        zIndex={10}
        borderBottomWidth="1px"
        borderColor="border-light"
      >
        <Flex
          maxW="1200px"
          mx="auto"
          px={{ base: 4, md: 8 }}
          py={3}
          align="center"
          justify="space-between"
          gap={4}
        >
          <HStack gap={3}>
            <Show below="md">
              <IconButton
                aria-label="Menu"
                variant="ghost"
                size="sm"
                onClick={onOpen}
              >
                <Menu size={20} />
              </IconButton>
            </Show>
            <VStack align="start" gap={0}>
              <Text fontWeight={700} fontSize="lg" color="text-primary">
                InsureOn
              </Text>
            </VStack>
          </HStack>

          <Hide below="md">
            <HStack gap={1}>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  as={NavLink}
                  to={item.to}
                  end={item.end}
                  px={3}
                  py={2}
                  borderRadius="999px"
                  fontSize="sm"
                  fontWeight={600}
                  color="text-secondary"
                  _activeLink={{ bg: 'brand.100', color: 'text-primary', _dark: { bg: 'whiteAlpha.200', color: 'white' } }}
                  _hover={{ textDecoration: 'none', bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' } }}
                >
                  {item.label}
                </Link>
              ))}
            </HStack>
          </Hide>

          <HStack gap={1}>
            {isRefreshing && (
              <Spinner size="sm" color="brand.500" />
            )}
            <IconButton
              aria-label={colorMode === 'dark' ? 'Light mode' : 'Dark mode'}
              variant="ghost"
              size="sm"
              onClick={toggleColorMode}
              icon={colorMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              color="text-primary"
              _dark={{ color: 'whiteAlpha.900' }}
            />
            <NotificationCenter />
            <Hide below="md">
              <Text fontSize="sm" color="text-secondary">
                {user?.full_name || user?.email}
              </Text>
            </Hide>
            {(user?.is_admin || user?.email?.toLowerCase().includes('admin')) && (
              <Button
                as={NavLink}
                to="/admin"
                colorScheme="brand"
                size="sm"
                bgGradient="linear(to-r, brand.400, brand.600)"
                _hover={{ bgGradient: "linear(to-r, brand.500, brand.700)", textDecoration: 'none' }}
              >
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Show below="md">
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent bg="bg-surface">
            <DrawerCloseButton color="text-secondary" />
            <DrawerHeader fontWeight={700} color="text-primary">InsureOn</DrawerHeader>
            <DrawerBody>
              <Stack gap={1}>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = item.end
                    ? location.pathname === '/app'
                    : location.pathname.startsWith(item.to)
                  return (
                    <Link
                      key={item.to}
                      as={NavLink}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      p={3}
                      borderRadius="12px"
                      fontSize="sm"
                      fontWeight={600}
                      display="flex"
                      alignItems="center"
                      gap={3}
                      bg={isActive ? 'brand.100' : 'transparent'}
                      color={isActive ? 'ink.900' : 'ink.600'}
                      _dark={{
                        bg: isActive ? 'whiteAlpha.200' : 'transparent',
                        color: isActive ? 'white' : 'whiteAlpha.700',
                      }}
                      _hover={{ textDecoration: 'none', bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' } }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Show>

      <Box maxW="1200px" mx="auto" px={{ base: 3, md: 8 }} py={{ base: 4, md: 8 }}>
        <Outlet />
      </Box>

      <Show below="md">
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            zIndex={20}
            bg="bg-surface"
            backdropFilter="blur(12px)"
            borderTopWidth="1px"
            borderColor="border-light"
            pb="env(safe-area-inset-bottom, 8px)"
          >
          <HStack justify="space-around" py={2}>
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const isActive = item.end
                ? location.pathname === '/app'
                : location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  as={NavLink}
                  to={item.to}
                  end={item.end}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={0.5}
                  px={3}
                  py={1}
                  borderRadius="12px"
                  color={isActive ? 'brand.500' : 'ink.400'}
                  _dark={{ color: isActive ? 'brand.300' : 'whiteAlpha.500' }}
                  _hover={{ textDecoration: 'none', color: 'brand.500' }}
                  position="relative"
                >
                  <Icon size={20} />
                  <Text fontSize="2xs" fontWeight={isActive ? 700 : 500}>
                    {item.label}
                  </Text>
                  {isActive && (
                    <Box
                      position="absolute"
                      top={-2}
                      boxSize="6px"
                      bg="brand.500"
                      borderRadius="full"
                    />
                  )}
                </Link>
              )
            })}
          </HStack>
        </Box>
      </Show>
    </Box>
  )
}
