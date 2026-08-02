import { Component } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import Button from './Button'
import Card from './Card'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
        })
      }

      return (
        <div className="flex items-center justify-center min-h-[300px] p-4">
          <Card className="w-full max-w-md text-center p-8">
            <div className="w-16 h-16 rounded-full bg-[rgba(163,81,57,0.12)] flex items-center justify-center mx-auto mb-4 text-[var(--color-danger)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              Something went wrong
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              We encountered an unexpected error. Please try again or refresh the page.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left p-4 bg-[var(--color-bg)] rounded-md">
                <summary className="text-sm font-medium text-[var(--color-text-secondary)] cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-[var(--color-text-muted)] overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary