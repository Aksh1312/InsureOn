import { Text, HStack, type TextProps } from '@chakra-ui/react'

type AmountSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

type AmountDisplayProps = TextProps & {
  amount: number | null | undefined
  currency?: string
  size?: AmountSize
  showCurrency?: boolean
  colorScheme?: 'default' | 'positive' | 'negative' | 'muted'
}

const COLOR_MAP: Record<string, string> = {
  default: 'text-primary',
  positive: 'teal.600',
  negative: 'red.600',
  muted: 'text-secondary',
}

export default function AmountDisplay({
  amount,
  currency = '₹',
  size = 'lg',
  showCurrency = true,
  colorScheme = 'default',
  ...rest
}: AmountDisplayProps) {
  if (amount == null) {
    return (
      <Text fontSize={size} color="text-muted" {...rest}>
        —
      </Text>
    )
  }

  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return (
    <Text
      fontSize={size}
      fontWeight={700}
      color={COLOR_MAP[colorScheme]}
      letterSpacing="-0.02em"
      fontFamily="'Fraunces', serif"
      {...rest}
    >
      {showCurrency ? `${currency}${formatted}` : formatted}
    </Text>
  )
}

export function AmountRow({ label, amount, ...props }: { label: string; amount: number | null | undefined } & Partial<AmountDisplayProps>) {
  return (
    <HStack justify="space-between" w="full">
      <Text fontSize="sm" color="text-secondary">{label}</Text>
      <AmountDisplay amount={amount} size="md" {...props} />
    </HStack>
  )
}
