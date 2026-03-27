'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

export interface StatItem {
  label: string
  value: number | string
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'cyan' | 'purple' | 'orange' | 'gray' | 'emerald' | 'indigo'
}

const colorClasses: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  red: 'text-red-600 bg-red-50',
  yellow: 'text-yellow-600 bg-yellow-50',
  cyan: 'text-cyan-600 bg-cyan-50',
  purple: 'text-purple-600 bg-purple-50',
  orange: 'text-orange-600 bg-orange-50',
  gray: 'text-gray-600 bg-gray-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  indigo: 'text-indigo-600 bg-indigo-50',
}

export function StatsGrid({ items, columns }: { items: StatItem[]; columns?: number }) {
  const cols = columns || Math.min(items.length, 6)
  const gridClass = cols <= 2 ? 'grid-cols-2' :
    cols <= 3 ? 'grid-cols-2 md:grid-cols-3' :
    cols <= 4 ? 'grid-cols-2 md:grid-cols-4' :
    'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {items.map((item) => {
        const color = item.color || 'blue'
        const [textColor] = (colorClasses[color] || colorClasses.blue).split(' ')
        const Icon = item.icon

        return (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className={`p-2 rounded-lg ${colorClasses[color]?.split(' ')[1] || 'bg-blue-50'}`}>
                    <Icon className={`h-5 w-5 ${textColor}`} />
                  </div>
                )}
                <div>
                  <p className={`text-2xl font-bold ${textColor}`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
