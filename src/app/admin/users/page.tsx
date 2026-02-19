'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Edit, Trash2, MoreHorizontal, Ban, ShieldCheck, LogOut, Key, 
  ShieldAlert, CheckCircle, Flame, Trophy, Calendar, RotateCcw, UserCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StreakEditModal } from '@/components/admin/StreakEditModal'

interface User {
  id: string
  email: string
  fullName: string | null
  role: string
  branch: { nameAr: string } | null
  lastActiveAt: string
  createdAt: string
  isBanned: boolean
  bannedAt: string | null
  bannedReason: string | null
  _count: {
    tasks: number
    notes: number
    focusSessions: number
  }
}

interface Branch {
  id: string
  nameAr: string
  nameEn: string
}

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

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('users')
  
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showForceLogoutDialog, setShowForceLogoutDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'STUDENT',
    branchId: ''
  })
  const [banReason, setBanReason] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  
  // Streaks state
  const [streaks, setStreaks] = useState<StreakUser[]>([])
  const [streakStats, setStreakStats] = useState({
    total: 0,
    active: 0,
    broken: 0,
    new: 0,
    averageStreak: 0
  })
  const [streakLoading, setStreakLoading] = useState(true)
  const [streakSearch, setStreakSearch] = useState('')
  const [streakFilter, setStreakFilter] = useState('all')
  const [selectedStreak, setSelectedStreak] = useState<StreakUser | null>(null)
  const [showStreakEditModal, setShowStreakEditModal] = useState(false)
  const [showStreakResetDialog, setShowStreakResetDialog] = useState(false)
  const [streakResetReason, setStreakResetReason] = useState('')
  const [impersonating, setImpersonating] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchBranches()
  }, [search, roleFilter])

  useEffect(() => {
    if (activeTab === 'streaks') {
      fetchStreaks()
    }
  }, [activeTab, streakSearch, streakFilter])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter !== 'ALL') params.set('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل المستخدمين' })
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      const data = await res.json()
      if (data.success) {
        setBranches(data.branches)
      }
    } catch {
      // Ignore
    }
  }

  const fetchStreaks = async () => {
    try {
      const params = new URLSearchParams()
      if (streakSearch) params.set('search', streakSearch)
      if (streakFilter !== 'all') params.set('status', streakFilter)

      const res = await fetch(`/api/admin/streaks?${params}`)
      const data = await res.json()
      if (data.success) {
        setStreaks(data.streaks)
        setStreakStats(data.stats)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل المسارات' })
    } finally {
      setStreakLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم التحديث بنجاح' })
        fetchUsers()
        setShowEditDialog(false)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في التحديث' })
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم حذف المستخدم' })
        fetchUsers()
        setShowDeleteDialog(false)
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' })
    }
  }

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason })
      })

      const data = await res.json()
      if (data.success) {
        toast({ 
          title: 'تم حظر المستخدم', 
          description: `تم حذف ${data.sessionsDeleted} جلسة` 
        })
        fetchUsers()
        setShowBanDialog(false)
        setBanReason('')
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حظر المستخدم' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnban = async (user: User) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم إلغاء حظر المستخدم' })
        fetchUsers()
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إلغاء الحظر' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleForceLogout = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/logout`, {
        method: 'POST'
      })

      const data = await res.json()
      if (data.success) {
        toast({ 
          title: 'تم تسجيل خروج المستخدم', 
          description: `تم حذف ${data.sessionsDeleted} جلسة` 
        })
        setShowForceLogoutDialog(false)
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تسجيل الخروج' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword.trim()) return

    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, forceLogout: true })
      })

      const data = await res.json()
      if (data.success) {
        toast({ 
          title: 'تم إعادة تعيين كلمة المرور',
          description: data.sessionsDeleted > 0 ? `تم تسجيل خروج المستخدم من ${data.sessionsDeleted} جلسة` : undefined
        })
        setShowResetPasswordDialog(false)
        setNewPassword('')
        setGeneratedPassword('')
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إعادة تعيين كلمة المرور' })
    } finally {
      setActionLoading(false)
    }
  }

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    // Ensure at least one of each type
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
    // Fill the rest
    for (let i = password.length; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    // Shuffle
    password = password.split('').sort(() => Math.random() - 0.5).join('')
    setGeneratedPassword(password)
    setNewPassword(password)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      fullName: user.fullName || '',
      role: user.role,
      branchId: ''
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const openBanDialog = (user: User) => {
    setSelectedUser(user)
    setBanReason('')
    setShowBanDialog(true)
  }

  const openForceLogoutDialog = (user: User) => {
    setSelectedUser(user)
    setShowForceLogoutDialog(true)
  }

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user)
    setNewPassword('')
    setGeneratedPassword('')
    setShowResetPasswordDialog(true)
  }

  const handleImpersonate = async (user: User) => {
    if (user.role === 'ADMIN') {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن انتحال شخصية مدير آخر' })
      return
    }

    setImpersonating(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم الانتحال', description: `تم تسجيل الدخول كـ ${user.fullName || user.email}` })
        window.location.href = '/dashboard'
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الانتحال' })
    } finally {
      setImpersonating(false)
    }
  }

  const handleStreakReset = async () => {
    if (!selectedStreak?.streakId || !streakResetReason.trim()) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/streaks/${selectedStreak.streakId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: streakResetReason })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم إعادة تعيين المسار' })
        fetchStreaks()
        setShowStreakResetDialog(false)
        setStreakResetReason('')
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إعادة التعيين' })
    } finally {
      setActionLoading(false)
    }
  }

  const getStreakStatusBadge = (status: 'active' | 'broken' | 'new') => {
    switch (status) {
      case 'active':
        return <Badge className="bg-amber-500 text-black hover:bg-amber-600">نشط 🔥</Badge>
      case 'broken':
        return <Badge variant="destructive">منقطع</Badge>
      case 'new':
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">جديد</Badge>
    }
  }

  return (
    <AdminLayout activeTab="users">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="streaks" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              المسارات
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-9 w-64"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">الكل</SelectItem>
                    <SelectItem value="STUDENT">طلاب</SelectItem>
                    <SelectItem value="ADMIN">مدراء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                إجمالي المستخدمين: {users.length}
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الشعبة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المهام</TableHead>
                    <TableHead>آخر نشاط</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        جاري التحميل...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا يوجد مستخدمين
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className={user.isBanned ? 'bg-red-950/20' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.fullName || 'بدون اسم'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role === 'ADMIN' ? 'مدير' : 'طالب'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.branch?.nameAr || '-'}</TableCell>
                        <TableCell>
                          {user.isBanned ? (
                            <div className="flex items-center gap-1">
                              <ShieldAlert className="w-4 h-4 text-red-400" />
                              <Badge variant="destructive">محظور</Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <Badge variant="outline" className="text-green-400 border-green-400">نشط</Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{user._count.tasks}</TableCell>
                        <TableCell>
                          {new Date(user.lastActiveAt).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {user.isBanned ? (
                                  <DropdownMenuItem onClick={() => handleUnban(user)}>
                                    <ShieldCheck className="w-4 h-4 ml-2" />
                                    إلغاء الحظر
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => openBanDialog(user)}
                                    className="text-red-400 focus:text-red-400"
                                  >
                                    <Ban className="w-4 h-4 ml-2" />
                                    حظر المستخدم
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openForceLogoutDialog(user)}>
                                  <LogOut className="w-4 h-4 ml-2" />
                                  تسجيل خروج إجباري
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                                  <Key className="w-4 h-4 ml-2" />
                                  إعادة تعيين كلمة المرور
                                </DropdownMenuItem>
                                {user.role !== 'ADMIN' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleImpersonate(user)}
                                    disabled={impersonating}
                                  >
                                    <UserCircle className="w-4 h-4 ml-2" />
                                    انتحال الشخصية
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(user)}
                                  className="text-red-400 focus:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 ml-2" />
                                  حذف المستخدم
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Flame className="w-4 h-4 text-amber-500" />
                  إجمالي الطلاب
                </div>
                <p className="text-2xl font-bold">{streakStats.total}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  مسارات نشطة
                </div>
                <p className="text-2xl font-bold text-green-400">{streakStats.active}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Ban className="w-4 h-4 text-red-400" />
                  مسارات منقطعة
                </div>
                <p className="text-2xl font-bold text-red-400">{streakStats.broken}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  متوسط المسار
                </div>
                <p className="text-2xl font-bold text-yellow-500">{streakStats.averageStreak}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  جديدة
                </div>
                <p className="text-2xl font-bold text-blue-400">{streakStats.new}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={streakSearch}
                    onChange={(e) => setStreakSearch(e.target.value)}
                    className="pr-9 w-64"
                  />
                </div>
                <Select value={streakFilter} onValueChange={setStreakFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="broken">منقطع</SelectItem>
                    <SelectItem value="new">جديد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Streaks Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الشعبة</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="w-4 h-4 text-amber-500" />
                        المسار
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        الأطول
                      </div>
                    </TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        آخر نشاط
                      </div>
                    </TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streakLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        جاري التحميل...
                      </TableCell>
                    </TableRow>
                  ) : streaks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا توجد مسارات
                      </TableCell>
                    </TableRow>
                  ) : (
                    streaks.map((streak) => (
                      <TableRow key={streak.userId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{streak.userName}</p>
                            <p className="text-sm text-muted-foreground">{streak.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{streak.branchName || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-lg font-bold ${streak.currentStreak > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {streak.currentStreak}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-bold text-yellow-500">
                            {streak.longestStreak}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStreakStatusBadge(streak.streakStatus)}
                        </TableCell>
                        <TableCell>
                          {streak.lastActivityDate 
                            ? new Date(streak.lastActivityDate).toLocaleDateString('ar-EG')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedStreak(streak)
                                setShowStreakEditModal(true)
                              }}
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedStreak(streak)
                                setShowStreakResetDialog(true)
                              }}
                              title="إعادة تعيين"
                              disabled={!streak.streakId}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">طالب</SelectItem>
                  <SelectItem value="ADMIN">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEdit}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف المستخدم</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            هل أنت متأكد من حذف المستخدم &quot;{selectedUser?.fullName || selectedUser?.email}&quot;؟
            <br />
            <span className="text-red-400 text-sm">هذا الإجراء لا يمكن التراجع عنه.</span>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حظر المستخدم</DialogTitle>
            <DialogDescription>
              سيتم حظر المستخدم وتسجيل خروجه من جميع الأجهزة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>سبب الحظر</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="أدخل سبب الحظر..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBan}
              disabled={!banReason.trim() || actionLoading}
            >
              {actionLoading ? 'جاري الحظر...' : 'حظر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Logout Dialog */}
      <Dialog open={showForceLogoutDialog} onOpenChange={setShowForceLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل خروج إجباري</DialogTitle>
            <DialogDescription>
              سيتم تسجيل خروج المستخدم &quot;{selectedUser?.fullName || selectedUser?.email}&quot; من جميع الأجهزة.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForceLogoutDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleForceLogout}
              disabled={actionLoading}
            >
              {actionLoading ? 'جاري التنفيذ...' : 'تسجيل خروج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
            <DialogDescription>
              أدخل كلمة مرور جديدة للمستخدم &quot;{selectedUser?.fullName || selectedUser?.email}&quot;.
              سيتم تسجيل خروج المستخدم من جميع الأجهزة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="text"
                  placeholder="كلمة المرور (8 أحرف على الأقل)"
                />
                <Button variant="outline" onClick={generatePassword}>
                  توليد
                </Button>
              </div>
              {generatedPassword && (
                <p className="text-sm text-muted-foreground">
                  كلمة المرور المولدة: <code className="bg-muted px-1 rounded">{generatedPassword}</code>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={newPassword.length < 8 || actionLoading}
            >
              {actionLoading ? 'جاري التنفيذ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Streak Edit Modal */}
      <StreakEditModal
        open={showStreakEditModal}
        onOpenChange={setShowStreakEditModal}
        streak={selectedStreak}
        onSuccess={fetchStreaks}
      />

      {/* Streak Reset Dialog */}
      <Dialog open={showStreakResetDialog} onOpenChange={setShowStreakResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              إعادة تعيين المسار
            </DialogTitle>
            <DialogDescription>
              سيتم إعادة تعيين مسار المستخدم &quot;{selectedStreak?.userName}&quot; إلى صفر.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-amber-400">
                المسار الحالي: <strong>{selectedStreak?.currentStreak}</strong> يوم
              </p>
              <p className="text-sm text-amber-400">
                أطول مسار: <strong>{selectedStreak?.longestStreak}</strong> يوم
              </p>
            </div>
            <div className="space-y-2">
              <Label>سبب إعادة التعيين</Label>
              <Textarea
                value={streakResetReason}
                onChange={(e) => setStreakResetReason(e.target.value)}
                placeholder="أدخل سبب إعادة التعيين..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStreakResetDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleStreakReset}
              disabled={!streakResetReason.trim() || actionLoading}
            >
              {actionLoading ? 'جاري التنفيذ...' : 'إعادة تعيين'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
