'use client'

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskFrontend as Task } from '@/types'

interface DroppableDayProps {
  dayIndex: number
  dayName: string
  date: Date
  isToday: boolean
  tasks: Task[]
  formattedDate: string
  onAddTask: (dayIndex: number) => void
  children: React.ReactNode
  isOver?: boolean
}

export default function DroppableDay({
  dayIndex,
  dayName,
  isToday,
  tasks,
  formattedDate,
  onAddTask,
  children,
}: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`,
    data: {
      dayIndex,
      type: 'day',
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-4 rounded-xl bg-card border transition-all duration-200',
        isToday ? 'border-primary' : 'border-border',
        isOver && 'border-primary bg-primary/5 ring-2 ring-primary/30 scale-[1.02]'
      )}
    >
      {/* Day Header */}
      <div className="text-center mb-3 pb-3 border-b border-border">
        <p className={cn('font-semibold', isToday && 'text-primary')}>
          {dayName}
        </p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
        {tasks.length > 0 && (
          <Badge variant="outline" className="mt-1 text-[10px]">
            {tasks.length} {tasks.length === 1 ? 'مهمة' : 'مهام'}
          </Badge>
        )}
      </div>

      {/* Tasks Container - Drop Zone */}
      <div
        className={cn(
          'space-y-2 min-h-[100px] max-h-[300px] overflow-y-auto transition-all duration-200',
          isOver && 'bg-primary/5 rounded-lg p-1'
        )}
      >
        {tasks.length > 0 ? (
          children
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isOver ? 'أفلت هنا' : 'لا مهام'}
          </p>
        )}
      </div>

      {/* Add Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2 text-xs"
        onClick={() => onAddTask(dayIndex)}
      >
        <Plus className="w-3 h-3 ml-1" />
        إضافة
      </Button>
    </div>
  )
}
