import { Badge, Text, Tooltip } from '@chakra-ui/react'
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react'

type TrustBadgeProps = {
  type: 'fraud_cleared' | 'fraud_review' | 'payout_confirmed' | 'policy_active' | 'verified' | 'safe_worker'
}

const META = {
  fraud_cleared: {
    icon: ShieldCheck,
    color: 'teal',
    label: 'Safety Check Passed',
    tooltip: 'All safety checks passed.',
  },
  fraud_review: {
    icon: ShieldAlert,
    color: 'orange',
    label: 'Under Review',
    tooltip: 'Flagged for manual check.',
  },
  payout_confirmed: {
    icon: ShieldCheck,
    color: 'green',
    label: 'Payment Sent',
    tooltip: 'Payment has been sent and confirmed.',
  },
  policy_active: {
    icon: Shield,
    color: 'blue',
    label: 'Plan Active',
    tooltip: 'You are covered this week.',
  },
  verified: {
    icon: ShieldCheck,
    color: 'teal',
    label: 'Verified',
    tooltip: 'Identity and platform verified.',
  },
  safe_worker: {
    icon: ShieldCheck,
    color: 'teal',
    label: 'Safe Worker',
    tooltip: 'You follow safety recommendations.',
  },
}

export default function TrustBadge({ type }: TrustBadgeProps) {
  const meta = META[type]
  const Icon = meta.icon
  return (
    <Tooltip label={meta.tooltip} hasArrow>
      <Badge
        colorScheme={meta.color}
        variant="subtle"
        px={3}
        py={1.5}
        display="inline-flex"
        alignItems="center"
        gap={1.5}
        cursor="help"
      >
        <Icon size={14} />
        <Text fontSize="xs" fontWeight={600}>{meta.label}</Text>
      </Badge>
    </Tooltip>
  )
}
