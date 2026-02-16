import { AlertCircle, RefreshCw, WifiOff, FileQuestion } from 'lucide-react'
import { Button } from './button'

interface ErrorStateProps {
  type?: 'network' | 'not-found' | 'permission' | 'generic'
  title?: string
  message?: string
  onRetry?: () => void
}

const ERROR_CONFIGS = {
  network: {
    icon: WifiOff,
    title: 'Connection Error',
    message: 'Unable to connect. Please check your internet connection and try again.',
  },
  'not-found': {
    icon: FileQuestion,
    title: 'Not Found',
    message: "The resource you're looking for could not be found.",
  },
  permission: {
    icon: AlertCircle,
    title: 'Permission Denied',
    message: "You don't have permission to access this resource.",
  },
  generic: {
    icon: AlertCircle,
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
}

export function ErrorState({ type = 'generic', title, message, onRetry }: ErrorStateProps) {
  const config = ERROR_CONFIGS[type]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || config.title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm">
        {message || config.message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}
