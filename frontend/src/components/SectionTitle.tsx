import { Box, Heading, Text } from '@chakra-ui/react'

type SectionTitleProps = {
  kicker?: string
  title: string
  subtitle?: string
}

export default function SectionTitle({ kicker, title, subtitle }: SectionTitleProps) {
  return (
    <Box>
      {kicker ? (
        <Text textTransform="uppercase" letterSpacing="0.2em" fontSize="xs" color="text-secondary">
          {kicker}
        </Text>
      ) : null}
      <Heading
        mt={kicker ? 2 : 0}
        fontSize={{ base: '2xl', md: '4xl' }}
        fontWeight={700}
        color="text-primary"
      >
        {title}
      </Heading>
      {subtitle ? (
        <Text mt={3} fontSize={{ base: 'md', md: 'lg' }} color="text-secondary">
          {subtitle}
        </Text>
      ) : null}
    </Box>
  )
}
