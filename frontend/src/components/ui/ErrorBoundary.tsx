import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Box, Button, Heading, Text } from '@chakra-ui/react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <Box textAlign="center" py={16} px={4}>
          <Heading fontSize="xl" color="text-primary" mb={2}>Something went wrong</Heading>
          <Text color="text-secondary" mb={4} fontSize="sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button onClick={this.handleRetry}>Try again</Button>
        </Box>
      )
    }
    return this.props.children
  }
}
