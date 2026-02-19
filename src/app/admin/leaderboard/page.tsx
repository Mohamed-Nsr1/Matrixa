'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, Trophy, Eye, EyeOff, RotateCcw, Clock, Target, TrendingUp, 
  Users, CheckCircle, XCircle, Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LeaderboardStudent {
  id: string
  email: string
  fullName: string | null
  hideFromLeaderboard: boolean
  createdAt: string
  leaderboard: {
    id: string
    score: number
    rank: number | null
    studyMinutes: number
    tasksCompleted: number
    focusSessions: number
    isOptedIn: boolean
    isHidden: boolean
    updatedAt: string
  } | null
  completedTasks: number
  completedFocusSessions: number
}

interface Stats {
  total: number
  visible: number
  hidden: number
  leaderboardEnabled: boolean
}

export default function AdminLeaderboardPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<LeaderboardStudent[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    visible: 0,
    hidden: 0,
    leaderboardEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardStudent | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [search, visibilityFilter, sortBy, sortOrder, page])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (visibilityFilter !== 'all') params.set('visibility', visibilityFilter)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/admin/leaderboard?${params}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (student: LeaderboardStudent) => {
    setActionLoading(true)
    try {
      const newHideStatus = !student.hideFromLeaderboard
      
      const res = await fetch(`/api/admin/leaderboard/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hideFromLeaderboard: newHideStatus,
          isHidden: newHideStatus
        })
      })

      const data = await res.json()
      if (data.success) {
        toast({ 
          title: newHideStatus ? 'تم إخفاء الطالب' : 'تم إظهار الطالب',
          description: newHideStatus 
            ? 'لن يظهر الطالب في لوحة المتصدرين'
            : 'سيظهر الطالب في لوحة المتصدرين'
        })
        fetchStudents()
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحديث الحالة' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetScores = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/leaderboard/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      })

      const data = await res.json()
      if (data.success) {
        toast({ 
          title: 'تم إعادة تعيين النقاط',
          description: `تم إعادة تعيين ${data.stats.entriesReset} سجل`
        })
        setShowResetDialog(false)
        fetchStudents()
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إعادة التعيين' })
    } finally {
      setActionLoading(false)
    }
  }

  const getVisibilityBadge = (student: LeaderboardStudent) => {
    const isHidden = student.hideFromLeaderboard || student.leaderboard?.isHidden
    if (isHidden) {
      return (
        <Badge variant="outline" className="text-red-400 border-red-400">
          <EyeOff className="w-3 h-3 ml-1" />
          مخفي
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-green-400 border-green-400">
        <Eye className="w-3 h-3 ml-1" />
        ظاهر
      </Badge>
    )
  }

  const getOptInBadge = (student: LeaderboardStudent) => {
    if (!student.leaderboard) {
      return <Badge variant="secondary">غير مشترك</Badge>
    }
    if (student.leaderboard.isOptedIn) {
      return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">مشترك</Badge>
    }
    return <Badge variant="outline" className="text-muted-foreground">انسحب</Badge>
  }

  return (
    <AdminLayout activeTab="leaderboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              إدارة لوحة المتصدرين
            </h2>
            <p className="text-muted-foreground mt-1">
              تحكم في ظهور الطلاب وأعد تعيين النقاط
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setShowResetDialog(true)}
            className="shrink-0"
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            إعادة تعيين النقاط
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="w-4 h-4" />
                إجمالي الطلاب
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Eye className="w-4 h-4 text-green-400" />
                ظاهرين
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.visible}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <EyeOff className="w-4 h-4 text-red-400" />
                مخفيين
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.hidden}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                الحالة
              </div>
              <p className="text-lg font-bold">
                {stats.leaderboardEnabled ? (
                  <span className="text-green-400">مفعلة</span>
                ) : (
                  <span className="text-red-400">معطلة</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 w-64"
              />
            </div>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="visible">ظاهرين</SelectItem>
                <SelectItem value="hidden">مخفيين</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">النقاط</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
                <SelectItem value="date">التاريخ</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </div>

        {/* Students Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الاشتراك</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    النقاط
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    دقائق
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 text-emerald-400" />
                    مهام
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    جلسات
                  </div>
                </TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا يوجد طلاب
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow 
                    key={student.id} 
                    className={student.hideFromLeaderboard ? 'bg-red-950/10' : ''}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.fullName || 'بدون اسم'}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getVisibilityBadge(student)}</TableCell>
                    <TableCell>{getOptInBadge(student)}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-primary">
                        {student.leaderboard?.score || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.leaderboard?.studyMinutes || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.leaderboard?.tasksCompleted || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.leaderboard?.focusSessions || 0}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(student)}
                        disabled={actionLoading}
                        className="shrink-0"
                      >
                        {student.hideFromLeaderboard ? (
                          <>
                            <Eye className="w-4 h-4 ml-1" />
                            إظهار
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 ml-1" />
                            إخفاء
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <span className="flex items-center px-4">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              التالي
            </Button>
          </div>
        )}
      </div>

      {/* Reset Scores Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <RotateCcw className="w-5 h-5" />
              إعادة تعيين النقاط
            </DialogTitle>
            <DialogDescription>
              سيتم إعادة تعيين جميع النقاط والبيانات في لوحة المتصدرين إلى صفر.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400 font-medium mb-2">تحذير!</p>
              <ul className="text-sm text-red-300 space-y-1">
                <li>• سيتم إعادة تعيين نقاط جميع الطلاب</li>
                <li>• سيتم تصفير دقائق المذاكرة</li>
                <li>• سيتم تصفير عدد المهام المكتملة</li>
                <li>• سيتم تصفير عدد جلسات التركيز</li>
                <li>• لا يمكن التراجع عن هذا الإجراء</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetScores}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري...
                </>
              ) : (
                'إعادة تعيين'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
