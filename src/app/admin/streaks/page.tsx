'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Flame,
  Search,
  RefreshCw,
  Edit,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StreakUser {
  userId: string
  userName: string
  userEmail: string
  branchName: string | null
  streakId: string | null
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  streakStatus: 'active' | 'broken' | 'new'
  updatedAt: string | null
}

interface StreakStats {
  total: number
  active: number
  broken: number
  new: number
  averageStreak: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminStreaksPage() {
  const { toast } = useToast()
  const [streaks, setStreaks] = useState<StreakUser[]>([])
  const [stats, setStats] = useState<StreakStats>({ total: 0, active: 0, broken: 0, new: 0, averageStreak: 0 })
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('currentStreak')
  const [selectedStreak, setSelectedStreak] = useState<StreakUser | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editCurrentStreak, setEditCurrentStreak] = useState(0)
  const [editReason, setEditReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStreaks()
  }, [pagination.page, statusFilter, sortBy])

  const fetchStreaks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        sortBy
      })
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/streaks?${params}`)
      const data = await res.json()

      if (res.ok) {
        setStreaks(data.streaks)
        setStats(data.stats)
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }))
      }
    } catch (error) {
      console.error('Error fetching streaks:', error)
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchStreaks()
  }

  const handleEditStreak = async () => {
    if (!selectedStreak?.streakId) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لا يوجد مسار لتعديله' })
      return
    }
    if (!editReason.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب إدخال سبب التعديل' })
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/streaks/${selectedStreak.streakId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStreak: editCurrentStreak,
          reason: editReason
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'تم', description: 'تم تحديث المسار بنجاح' })
        setShowEditDialog(false)
        setSelectedStreak(null)
        setEditReason('')
        fetchStreaks()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetStreak = async (streak: StreakUser) => {
    if (!streak.streakId) return
    if (!confirm(`هل أنت متأكد من إعادة تعيين مسار ${streak.userName}؟`)) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/streaks/${streak.streakId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'إعادة تعيين يدوية من المشرف' })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'تم', description: 'تم إعادة تعيين المسار' })
        fetchStreaks()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const openEditDialog = (streak: StreakUser) => {
    setSelectedStreak(streak)
    setEditCurrentStreak(streak.currentStreak)
    setEditReason('')
    setShowEditDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500">نشط</Badge>
      case 'broken':
        return <Badge className="bg-red-500/10 text-red-500">مقطوع</Badge>
      case 'new':
        return <Badge className="bg-blue-500/10 text-blue-500">جديد</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <AdminLayout activeTab="streaks">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5" />
              إدارة المسارات
            </h2>
            <p className="text-sm text-muted-foreground">
              عرض وتعديل مسارات المستخدمين
            </p>
          </div>
          <Button variant="outline" onClick={fetchStreaks}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.broken}</p>
                  <p className="text-xs text-muted-foreground">مقطوع</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">جديد</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageStreak}</p>
                  <p className="text-xs text-muted-foreground">متوسط المسار</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Label>الحالة:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="broken">مقطوع</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label>ترتيب:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="currentStreak">المسار الحالي</SelectItem>
                <SelectItem value="longestStreak">أطول مسار</SelectItem>
                <SelectItem value="userName">الاسم</SelectItem>
                <SelectItem value="lastActivityDate">آخر نشاط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Streaks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : streaks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Flame className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مسارات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {streaks.map((streak) => (
              <Card key={streak.userId} className="hover:bg-slate-800/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Flame className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">{streak.userName}</p>
                        <p className="text-sm text-muted-foreground">{streak.userEmail}</p>
                        {streak.branchName && (
                          <p className="text-xs text-muted-foreground">{streak.branchName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">{streak.currentStreak}</p>
                        <p className="text-xs text-muted-foreground">الحالي</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-semibold">{streak.longestStreak}</p>
                        <p className="text-xs text-muted-foreground">الأطول</p>
                      </div>
                      
                      {getStatusBadge(streak.streakStatus)}
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(streak)}
                          disabled={!streak.streakId}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetStreak(streak)}
                          disabled={!streak.streakId}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {streak.lastActivityDate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      آخر نشاط: {new Date(streak.lastActivityDate).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              السابق
            </Button>
            <span className="text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              التالي
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المسار</DialogTitle>
            <DialogDescription>
              تعديل مسار {selectedStreak?.userName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المسار الحالي</Label>
              <Input
                type="number"
                min={0}
                value={editCurrentStreak}
                onChange={(e) => setEditCurrentStreak(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>سبب التعديل</Label>
              <Textarea
                placeholder="أدخل سبب التعديل..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleEditStreak} disabled={actionLoading}>
                {actionLoading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
