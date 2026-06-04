import { Box, Heading, HStack, Text } from '@chakra-ui/react'

type StatCardProps = {
  label: string
  value: string
  helper?: string
  accent?: string
}

export default function StatCard({ label, value, helper, accent }: StatCardProps) {
  return (
    <Box
      bg="bg-surface"
      borderWidth="1px"
      borderColor="border-light"
      borderRadius="24px"
      p={6}
      boxShadow="sm"
    >
      <HStack justify="space-between" align="start">
        <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.12em" color="text-secondary">
          {label}
        </Text>
        {accent ? (
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg={accent}
            boxShadow={`0 0 0 4px ${accent}22`}
          />
        ) : null}
      </HStack>
      <Heading mt={3} fontSize={{ base: '2xl', md: '3xl' }} fontWeight={700} color="text-primary">
        {value}
      </Heading>
      {helper ? (
        <Text mt={2} fontSize="sm" color="text-secondary">
          {helper}
        </Text>
      ) : null}
    </Box>
  )
}
