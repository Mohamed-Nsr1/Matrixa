'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  BookOpen, 
  Play, 
  Clock,
  Target,
  Zap,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

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

interface WeakAreasSectionProps {
  className?: string
}

export function WeakAreasSection({ className = '' }: WeakAreasSectionProps) {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [loading, setLoading] = useState(true)
  const [cached, setCached] = useState(false)

  const fetchWeakAreas = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const url = forceRefresh 
        ? '/api/insights/weak-areas?refresh=true' 
        : '/api/insights/weak-areas'
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success) {
        setWeakAreas(data.weakAreas)
        setCached(data.cached || false)
      }
    } catch (error) {
      console.error('Error fetching weak areas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeakAreas()
  }, [])

  // Group weak areas by type
  const groupedAreas = {
    subjects: weakAreas.filter(a => a.type === 'subject'),
    lessons: weakAreas.filter(a => a.type === 'lesson'),
    tasks: weakAreas.filter(a => a.type === 'task')
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

  const getPriorityInfo = (score: number) => {
    if (score < 15) {
      return {
        label: 'عاجل',
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        borderClass: 'border-red-500/50 bg-red-500/5',
        progressClass: 'bg-red-500'
      }
    }
    if (score < 25) {
      return {
        label: 'مهم',
        className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        borderClass: 'border-orange-500/50 bg-orange-500/5',
        progressClass: 'bg-orange-500'
      }
    }
    return {
      label: 'يحتاج انتباه',
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      borderClass: 'border-amber-500/50 bg-amber-500/5',
      progressClass: 'bg-amber-500'
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-white/10 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (weakAreas.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-emerald-500/20 via-card to-card rounded-2xl border border-emerald-500/20 p-8 ${className}`}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald" />
          </div>
          <h3 className="text-xl font-semibold mb-2">أداء ممتاز!</h3>
          <p className="text-muted-foreground max-w-md">
            لا توجد نقاط ضعف ملحوظة. استمر في المذاكرة المنتظمة والحفاظ على تقدمك الحالي
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-emerald">
            <TrendingUp className="w-4 h-4" />
            <span>حافظ على هذا الأداء الممتاز!</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">نقاط تحتاج تحسين</h2>
            <p className="text-sm text-muted-foreground">
              {weakAreas.length} نقطة تحتاج انتباهك
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {cached && (
            <Badge variant="outline" className="text-xs">
              من الذاكرة المؤقتة
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchWeakAreas(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-red-400" />
            <span className="text-sm text-muted-foreground">مواد</span>
          </div>
          <p className="text-2xl font-bold">{groupedAreas.subjects.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-muted-foreground">دروس</span>
          </div>
          <p className="text-2xl font-bold">{groupedAreas.lessons.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-muted-foreground">مهام</span>
          </div>
          <p className="text-2xl font-bold">{groupedAreas.tasks.length}</p>
        </div>
      </div>

      {/* Weak Areas List */}
      <ScrollArea className="max-h-[500px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weakAreas.map((area) => {
            const TypeIcon = getTypeIcon(area.type)
            const priority = getPriorityInfo(area.score)
            
            return (
              <div
                key={area.id}
                className={`p-5 rounded-xl border transition-all hover:shadow-lg ${priority.borderClass}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">{area.name}</span>
                  </div>
                  <Badge className={priority.className}>
                    {priority.label}
                  </Badge>
                </div>
                
                {/* Subject name if different */}
                {area.subjectName && area.type !== 'subject' && (
                  <div className="flex items-center gap-2 mb-2">
                    {area.color && (
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                    )}
                    <span className="text-sm text-muted-foreground">{area.subjectName}</span>
                  </div>
                )}
                
                {/* Score Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">مستوى الإنجاز</span>
                    <span className="font-medium">{area.score}%</span>
                  </div>
                  <Progress value={area.score} className="h-2" />
                </div>
                
                {/* Reason */}
                <p className="text-sm text-muted-foreground mb-2">
                  {area.reason}
                </p>
                
                {/* Recommendation */}
                <div className="p-3 rounded-lg bg-white/5 mb-3">
                  <p className="text-sm flex items-start gap-2">
                    <span className="text-amber">💡</span>
                    <span>{area.recommendation}</span>
                  </p>
                </div>
                
                {/* Action Button */}
                <div className="flex items-center justify-end">
                  {area.type === 'subject' && area.subjectId && (
                    <Link href={`/subjects?subject=${area.subjectId}`}>
                      <Button size="sm" className="gap-1">
                        <Play className="w-3 h-3" />
                        ابدأ المذاكرة
                      </Button>
                    </Link>
                  )}
                  {area.type === 'lesson' && area.subjectId && (
                    <Link href={`/subjects?subject=${area.subjectId}&lesson=${area.lessonId}`}>
                      <Button size="sm" className="gap-1">
                        <Play className="w-3 h-3" />
                        متابعة الدرس
                      </Button>
                    </Link>
                  )}
                  {area.type === 'task' && (
                    <Link href="/planner">
                      <Button size="sm" className="gap-1">
                        <Clock className="w-3 h-3" />
                        عرض في المخطط
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Motivational Footer */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">تذكر: كل خطوة صغيرة تحسب!</p>
            <p className="text-sm text-muted-foreground">
              التركيز على نقاط ضعفك هو أسرع طريقة للتحسن
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
