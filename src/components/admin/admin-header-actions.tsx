'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function AdminHeaderActions() {
  return (
    <>
      {/* Toggle de Tema */}
      <ThemeToggle variant="simple" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />

      {/* Notificacoes */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-9 w-9"
        title="Notificacoes"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        <span className="sr-only">Notificacoes</span>
      </Button>
    </>
  )
}
