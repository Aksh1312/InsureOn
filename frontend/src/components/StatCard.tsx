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
      bg="white"
      borderWidth="1px"
      borderColor="blackAlpha.200"
      borderRadius="24px"
      p={6}
      boxShadow="sm"
    >
      <HStack justify="space-between" align="start">
        <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.12em" color="ink.500">
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
      <Heading mt={3} fontSize={{ base: '2xl', md: '3xl' }} fontWeight={700} color="ink.900">
        {value}
      </Heading>
      {helper ? (
        <Text mt={2} fontSize="sm" color="ink.500">
          {helper}
        </Text>
      ) : null}
    </Box>
  )
}
