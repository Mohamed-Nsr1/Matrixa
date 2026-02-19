'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trophy, Lock, ChevronRight, Star, Flame, Target, Zap, Crown, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BadgeData {
  id: string
  nameAr: string
  nameEn: string
  descriptionAr: string | null
  descriptionEn: string | null
  icon: string
  color: string
  type: string
  requirement: number
  rarity: string
  xpReward: number
  earned: boolean
  earnedAt: string | null
  progress: number
}

interface BadgesResponse {
  success: boolean
  badges: BadgeData[]
  summary: {
    earned: number
    total: number
    percentage: number
  }
  userStats?: {
    currentStreak: number
    longestStreak: number
    focusSessions: number
    tasksCompleted: number
    score: number
  }
}

const rarityColors: Record<string, string> = {
  COMMON: 'bg-gray-500/20 border-gray-400',
  UNCOMMON: 'bg-green-500/20 border-green-400',
  RARE: 'bg-blue-500/20 border-blue-400',
  EPIC: 'bg-purple-500/20 border-purple-400',
  LEGENDARY: 'bg-yellow-500/20 border-yellow-400'
}

const rarityTextColors: Record<string, string> = {
  COMMON: 'text-gray-400',
  UNCOMMON: 'text-green-400',
  RARE: 'text-blue-400',
  EPIC: 'text-purple-400',
  LEGENDARY: 'text-yellow-400'
}

const typeIcons: Record<string, React.ReactNode> = {
  STREAK: <Flame className="w-4 h-4" />,
  TASKS: <Target className="w-4 h-4" />,
  FOCUS: <Zap className="w-4 h-4" />,
  SUBJECTS: <Star className="w-4 h-4" />,
  SPECIAL: <Crown className="w-4 h-4" />
}

const rarityLabels: Record<string, string> = {
  COMMON: 'عادي',
  UNCOMMON: 'غير عادي',
  RARE: 'نادر',
  EPIC: 'ملحمي',
  LEGENDARY: 'أسطوري'
}

export function BadgesSection() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BadgesResponse | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/badges')
      const badgesData = await res.json()
      if (badgesData.success) {
        setData(badgesData)
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في تحميل الشارات'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">الشارات والإنجازات</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const earnedBadges = data.badges.filter(b => b.earned)
  const unearnedBadges = data.badges.filter(b => !b.earned)

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">الشارات والإنجازات</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-yellow-500 font-bold">{data.summary.earned}</span>
          <span className="text-muted-foreground">/ {data.summary.total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">التقدم الكلي</span>
          <span className="font-medium">{data.summary.percentage}%</span>
        </div>
        <Progress value={data.summary.percentage} className="h-2" />
      </div>

      {/* User Stats */}
      {data.userStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
            <p className="text-lg font-bold">{data.userStats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">سلسلة حالية</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold">{data.userStats.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">مهام مكتملة</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <p className="text-lg font-bold">{data.userStats.focusSessions}</p>
            <p className="text-xs text-muted-foreground">جلسات تركيز</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <Star className="w-5 h-5 mx-auto mb-1 text-purple-400" />
            <p className="text-lg font-bold">{data.userStats.score}</p>
            <p className="text-xs text-muted-foreground">نقطة</p>
          </div>
        </div>
      )}

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            الشارات المكتسبة ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {earnedBadges.slice(0, 12).map((badge) => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-3 rounded-xl border-2 ${rarityColors[badge.rarity]} hover:scale-105 transition-transform relative group`}
                style={{ backgroundColor: `${badge.color}15` }}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <p className="text-xs font-medium truncate">{badge.nameAr}</p>
                <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-emerald-500 bg-background rounded-full" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* In Progress / Locked Badges */}
      {unearnedBadges.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            شارات قيد التقدم ({unearnedBadges.length})
          </h3>
          <div className="space-y-2">
            {unearnedBadges.slice(0, 5).map((badge) => {
              const progressPercent = Math.min((badge.progress / badge.requirement) * 100, 100)
              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="w-full p-3 rounded-xl border border-border bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3 group"
                >
                  <div className="relative">
                    <div className="text-2xl opacity-50 grayscale">{badge.icon}</div>
                    <Lock className="absolute -bottom-1 -right-1 w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium opacity-70">{badge.nameAr}</span>
                      <span className="text-xs text-muted-foreground">
                        {badge.progress}/{badge.requirement}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* View All Button */}
      <Button variant="outline" className="w-full mt-4">
        عرض جميع الشارات
      </Button>

      {/* Badge Detail Dialog */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-sm">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selectedBadge.icon}</span>
                  {selectedBadge.nameAr}
                </DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                <div
                  className={`w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center ${rarityColors[selectedBadge.rarity]}`}
                  style={{ backgroundColor: `${selectedBadge.color}20` }}
                >
                  <span className="text-5xl">{selectedBadge.icon}</span>
                </div>

                <Badge className={`mb-2 ${rarityTextColors[selectedBadge.rarity]}`}>
                  {rarityLabels[selectedBadge.rarity]}
                </Badge>

                <p className="text-muted-foreground mb-4">
                  {selectedBadge.descriptionAr}
                </p>

                {selectedBadge.earned ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-sm text-emerald-500">تم الحصول عليها</p>
                    {selectedBadge.earnedAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(selectedBadge.earnedAt).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">التقدم</span>
                      <span>{selectedBadge.progress}/{selectedBadge.requirement}</span>
                    </div>
                    <Progress value={(selectedBadge.progress / selectedBadge.requirement) * 100} />
                  </div>
                )}

                {selectedBadge.xpReward > 0 && (
                  <div className="mt-4 p-2 bg-yellow-500/10 rounded-lg">
                    <p className="text-sm text-yellow-500">
                      مكافأة: +{selectedBadge.xpReward} XP
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
