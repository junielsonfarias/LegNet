import { useState, useCallback } from 'react'
import { NotificationProps } from '@/components/ui/notification'

export interface Notification extends Omit<NotificationProps, 'onClose'> {
  id: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id
    }
    
    setNotifications(prev => [...prev, newNotification])
    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods
  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration })
  }, [addNotification])

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration })
  }, [addNotification])

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration })
  }, [addNotification])

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration })
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
}
