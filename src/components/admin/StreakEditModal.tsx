'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Flame, Calendar, Trophy, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StreakEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  streak: {
    streakId: string | null
    userId: string
    userName: string
    userEmail: string
    currentStreak: number
    longestStreak: number
    lastActivityDate: string | null
    streakStatus: 'active' | 'broken' | 'new'
  } | null
  onSuccess: () => void
}

export function StreakEditModal({ open, onOpenChange, streak, onSuccess }: StreakEditModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    reason: ''
  })

  useEffect(() => {
    if (streak) {
      setFormData({
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate 
          ? new Date(streak.lastActivityDate).toISOString().split('T')[0]
          : '',
        reason: ''
      })
    }
  }, [streak])

  const handleSubmit = async () => {
    if (!streak?.streakId) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لا يوجد مسار لتعديله'
      })
      return
    }

    if (!formData.reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب إدخال سبب التعديل'
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/streaks/${streak.streakId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStreak: formData.currentStreak,
          longestStreak: formData.longestStreak,
          lastActivityDate: formData.lastActivityDate || null,
          reason: formData.reason
        })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم التحديث بنجاح' })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: data.error
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في التحديث'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!streak?.streakId) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لا يوجد مسار لإعادة تعيينه'
      })
      return
    }

    if (!formData.reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب إدخال سبب إعادة التعيين'
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/streaks/${streak.streakId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: formData.reason })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم إعادة تعيين المسار' })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: data.error
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في إعادة التعيين'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!streak) return null

  const getStatusBadge = () => {
    switch (streak.streakStatus) {
      case 'active':
        return <Badge className="bg-amber-500 text-black">نشط</Badge>
      case 'broken':
        return <Badge variant="destructive">منقطع</Badge>
      case 'new':
        return <Badge variant="outline">جديد</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            تعديل المسار
          </DialogTitle>
          <DialogDescription>
            تعديل مسار المستخدم: {streak.userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{streak.userName}</p>
              <p className="text-sm text-muted-foreground">{streak.userEmail}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Current Streak */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              المسار الحالي
            </Label>
            <Input
              type="number"
              min="0"
              value={formData.currentStreak}
              onChange={(e) => setFormData({ ...formData, currentStreak: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Longest Streak */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              أطول مسار
            </Label>
            <Input
              type="number"
              min="0"
              value={formData.longestStreak}
              onChange={(e) => setFormData({ ...formData, longestStreak: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Last Activity Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              آخر نشاط
            </Label>
            <Input
              type="date"
              value={formData.lastActivityDate}
              onChange={(e) => setFormData({ ...formData, lastActivityDate: e.target.value })}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              سبب التعديل *
            </Label>
            <Textarea
              placeholder="أدخل سبب التعديل..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={loading || !streak.streakId}
          >
            إعادة تعيين
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !streak.streakId}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
