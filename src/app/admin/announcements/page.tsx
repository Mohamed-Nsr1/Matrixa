'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Megaphone, Plus, Edit, Trash2, Info, AlertTriangle, CheckCircle, Wrench, Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Announcement {
  id: string
  title: string
  titleEn: string | null
  content: string
  contentEn: string | null
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'MAINTENANCE' | 'FEATURE'
  priority: number
  targetAll: boolean
  showBanner: boolean
  isDismissible: boolean
  startsAt: Date | string
  endsAt: Date | string | null
  isActive: boolean
  createdAt: Date | string
}

const typeIcons = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  MAINTENANCE: Wrench,
  FEATURE: Sparkles
}

const typeColors = {
  INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  SUCCESS: 'bg-green-500/10 text-green-400 border-green-500/30',
  MAINTENANCE: 'bg-red-500/10 text-red-400 border-red-500/30',
  FEATURE: 'bg-violet-500/10 text-violet-400 border-violet-500/30'
}

export default function AdminAnnouncementsPage() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    title: '',
    titleEn: '',
    content: '',
    contentEn: '',
    type: 'INFO' as Announcement['type'],
    priority: 0,
    targetAll: true,
    showBanner: true,
    isDismissible: true,
    startsAt: '',
    endsAt: '',
    isActive: true
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      if (data.success) {
        setAnnouncements(data.announcements)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل الإعلانات' })
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingId(null)
    setForm({
      title: '',
      titleEn: '',
      content: '',
      contentEn: '',
      type: 'INFO',
      priority: 0,
      targetAll: true,
      showBanner: true,
      isDismissible: true,
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: '',
      isActive: true
    })
    setShowDialog(true)
  }

  const openEditDialog = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setForm({
      title: announcement.title,
      titleEn: announcement.titleEn || '',
      content: announcement.content,
      contentEn: announcement.contentEn || '',
      type: announcement.type,
      priority: announcement.priority,
      targetAll: announcement.targetAll,
      showBanner: announcement.showBanner,
      isDismissible: announcement.isDismissible,
      startsAt: new Date(announcement.startsAt).toISOString().slice(0, 16),
      endsAt: announcement.endsAt ? new Date(announcement.endsAt).toISOString().slice(0, 16) : '',
      isActive: announcement.isActive
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.content) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'العنوان والمحتوى مطلوبان' })
      return
    }

    setSaving(true)
    try {
      const url = editingId 
        ? `/api/admin/announcements/${editingId}`
        : '/api/admin/announcements'
      
      const body: Record<string, unknown> = {
        title: form.title,
        titleEn: form.titleEn || null,
        content: form.content,
        contentEn: form.contentEn || null,
        type: form.type,
        priority: form.priority,
        targetAll: form.targetAll,
        showBanner: form.showBanner,
        isDismissible: form.isDismissible,
        startsAt: form.startsAt || new Date().toISOString(),
        endsAt: form.endsAt || null,
        isActive: form.isActive
      }

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: editingId ? 'تم تحديث الإعلان' : 'تم إنشاء الإعلان' })
        setShowDialog(false)
        fetchAnnouncements()
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحفظ' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم حذف الإعلان' })
        fetchAnnouncements()
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' })
    }
  }

  const toggleActive = async (announcement: Announcement) => {
    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !announcement.isActive })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: announcement.isActive ? 'تم إلغاء تفعيل الإعلان' : 'تم تفعيل الإعلان' })
        fetchAnnouncements()
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في التحديث' })
    }
  }

  return (
    <AdminLayout activeTab="announcements">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              الإعلانات
            </h2>
            <p className="text-sm text-muted-foreground">إدارة الإعلانات والتنبيهات للطلاب</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 ml-2" />
            إعلان جديد
          </Button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد إعلانات. انقر على "إعلان جديد" لإنشاء أول إعلان.
            </div>
          ) : (
            announcements.map((announcement) => {
              const Icon = typeIcons[announcement.type]
              return (
                <div
                  key={announcement.id}
                  className={`rounded-xl border p-4 ${announcement.isActive ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${typeColors[announcement.type]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{announcement.title}</h3>
                          <Badge variant="outline" className="flex-shrink-0">
                            {announcement.type}
                          </Badge>
                          {!announcement.isActive && (
                            <Badge variant="secondary" className="flex-shrink-0">غير نشط</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>الأولوية: {announcement.priority}</span>
                          {announcement.showBanner && <span>شريط علوي</span>}
                          {announcement.isDismissible && <span>يمكن إغلاقه</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={announcement.isActive}
                        onCheckedChange={() => toggleActive(announcement)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(announcement)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل الإعلان' : 'إعلان جديد'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>العنوان (عربي) *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="عنوان الإعلان"
              />
            </div>

            <div className="space-y-2">
              <Label>Title (English)</Label>
              <Input
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Announcement title"
              />
            </div>

            <div className="space-y-2">
              <Label>المحتوى (عربي) *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="محتوى الإعلان"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Content (English)</Label>
              <Textarea
                value={form.contentEn}
                onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                placeholder="Announcement content"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Announcement['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">معلومات</SelectItem>
                    <SelectItem value="WARNING">تحذير</SelectItem>
                    <SelectItem value="SUCCESS">نجاح</SelectItem>
                    <SelectItem value="MAINTENANCE">صيانة</SelectItem>
                    <SelectItem value="FEATURE">ميزة جديدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء (اختياري)</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>عرض كشريط علوي</Label>
                <Switch
                  checked={form.showBanner}
                  onCheckedChange={(v) => setForm({ ...form, showBanner: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>يمكن للمستخدم إغلاقه</Label>
                <Switch
                  checked={form.isDismissible}
                  onCheckedChange={(v) => setForm({ ...form, isDismissible: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>نشط</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
