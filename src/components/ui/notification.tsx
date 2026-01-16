import * as React from "react"
import { useCallback } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose?: (id: string) => void
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ id, type, title, message, duration = 5000, onClose, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onClose?.(id)
    }, 300)
  }, [id, onClose])

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, handleClose])

    const getIcon = () => {
      switch (type) {
        case 'success':
          return <CheckCircle className="h-5 w-5 text-green-600" />
        case 'error':
          return <AlertCircle className="h-5 w-5 text-red-600" />
        case 'warning':
          return <AlertTriangle className="h-5 w-5 text-yellow-600" />
        case 'info':
          return <Info className="h-5 w-5 text-blue-600" />
        default:
          return <Info className="h-5 w-5 text-gray-600" />
      }
    }

    const getStyles = () => {
      switch (type) {
        case 'success':
          return 'bg-green-50 border-green-200 text-green-800'
        case 'error':
          return 'bg-red-50 border-red-200 text-red-800'
        case 'warning':
          return 'bg-yellow-50 border-yellow-200 text-yellow-800'
        case 'info':
          return 'bg-blue-50 border-blue-200 text-blue-800'
        default:
          return 'bg-gray-50 border-gray-200 text-gray-800'
      }
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          'border rounded-lg p-4 shadow-lg transition-all duration-300 transform',
          getStyles(),
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        )}
        {...props}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold">
              {title}
            </h3>
            {message && (
              <p className="mt-1 text-sm opacity-90">
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
            >
              <span className="sr-only">Fechar</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }
)

Notification.displayName = "Notification"

export { Notification }
