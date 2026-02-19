'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  BookOpen, 
  Play, 
  ChevronLeft,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface WeakArea {
  id: string
  type: 'subject' | 'lesson' | 'task'
  name: string
  score: number
  reason: string
  recommendation: string
  subjectId?: string
  lessonId?: string
  subjectName?: string
  color?: string
}

interface FocusSuggestionsProps {
  className?: string
  maxItems?: number
}

export function FocusSuggestions({ className = '', maxItems = 3 }: FocusSuggestionsProps) {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWeakAreas = async () => {
      try {
        const res = await fetch('/api/insights/weak-areas')
        const data = await res.json()
        
        if (data.success) {
          setWeakAreas(data.weakAreas.slice(0, maxItems))
        }
      } catch (error) {
        console.error('Error fetching weak areas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeakAreas()
  }, [maxItems])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-white/10 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (weakAreas.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-emerald-500/20 via-card to-card rounded-2xl border border-emerald-500/20 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald" />
          </div>
          <div>
            <h3 className="font-semibold">أداء ممتاز!</h3>
            <p className="text-sm text-muted-foreground">لا توجد نقاط ضعف ملحوظة</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          استمر في المذاكرة المنتظمة والحفاظ على تقدمك الحالي
        </p>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subject':
        return BookOpen
      case 'lesson':
        return BookOpen
      case 'task':
        return Clock
      default:
        return AlertTriangle
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'subject':
        return 'مادة'
      case 'lesson':
        return 'درس'
      case 'task':
        return 'مهمة'
      default:
        return 'عنصر'
    }
  }

  const getPriorityColor = (score: number) => {
    if (score < 15) return 'border-red-500/50 bg-red-500/5'
    if (score < 25) return 'border-orange-500/50 bg-orange-500/5'
    return 'border-amber-500/50 bg-amber-500/5'
  }

  const getPriorityBadge = (score: number) => {
    if (score < 15) return { label: 'عاجل', className: 'bg-red-500/20 text-red-400' }
    if (score < 25) return { label: 'مهم', className: 'bg-orange-500/20 text-orange-400' }
    return { label: 'يحتاج انتباه', className: 'bg-amber-500/20 text-amber-400' }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber" />
          <h2 className="text-lg font-semibold">نقاط تحتاج تركيز</h2>
        </div>
        <Link href="/insights" className="text-sm text-primary hover:underline flex items-center gap-1">
          عرض الكل
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {weakAreas.map((area) => {
          const TypeIcon = getTypeIcon(area.type)
          const priority = getPriorityBadge(area.score)
          
          return (
            <div
              key={area.id}
              className={`p-4 rounded-xl border transition-all hover:shadow-md ${getPriorityColor(area.score)}`}
            >
              <div className="flex items-start gap-3">
                {/* Color indicator */}
                {area.color && (
                  <div 
                    className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: area.color }}
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{area.name}</span>
                    <Badge className={priority.className}>
                      {priority.label}
                    </Badge>
                  </div>
                  
                  {area.subjectName && area.type !== 'subject' && (
                    <p className="text-sm text-muted-foreground mb-2">{area.subjectName}</p>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {area.reason}
                  </p>
                  
                  {/* Progress bar for score visualization */}
                  <div className="flex items-center gap-3 mb-3">
                    <Progress value={area.score} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{area.score}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-amber-400/90">
                      💡 {area.recommendation}
                    </p>
                    
                    {/* Quick action button */}
                    {area.type === 'subject' && area.subjectId && (
                      <Link href={`/subjects?subject=${area.subjectId}`}>
                        <Button size="sm" variant="outline" className="flex-shrink-0">
                          <Play className="w-3 h-3 ml-1" />
                          ابدأ
                        </Button>
                      </Link>
                    )}
                    {area.type === 'lesson' && area.subjectId && (
                      <Link href={`/subjects?subject=${area.subjectId}&lesson=${area.lessonId}`}>
                        <Button size="sm" variant="outline" className="flex-shrink-0">
                          <Play className="w-3 h-3 ml-1" />
                          ابدأ
                        </Button>
                      </Link>
                    )}
                    {area.type === 'task' && (
                      <Link href="/planner">
                        <Button size="sm" variant="outline" className="flex-shrink-0">
                          <Play className="w-3 h-3 ml-1" />
                          عرض
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
