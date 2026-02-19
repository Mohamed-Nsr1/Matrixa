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
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Ticket, Copy, Check, X, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InviteCode {
  id: string
  code: string
  maxUses: number
  currentUses: number
  expiresAt: string | null
  isActive: boolean
  createdBy: { email: string; fullName: string | null } | null
  usedBy: { email: string; fullName: string | null } | null
  createdAt: string
}

export default function AdminInvitesPage() {
  const { toast } = useToast()
  const [invites, setInvites] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCode, setNewCode] = useState({
    code: '',
    maxUses: 1,
    expiresAt: ''
  })

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/admin/invites')
      const data = await res.json()
      if (data.success) {
        setInvites(data.invites)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newCode.code) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'أدخل كود الدعوة' })
      return
    }

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCode)
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم إنشاء الكود' })
        fetchInvites()
        setShowCreateDialog(false)
        setNewCode({ code: '', maxUses: 1, expiresAt: '' })
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الإنشاء' })
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/invites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: isActive ? 'تم تفعيل الكود' : 'تم تعطيل الكود' })
        fetchInvites()
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في التحديث' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return

    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم الحذف' })
        fetchInvites()
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' })
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'تم نسخ الكود' })
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode({ ...newCode, code })
  }

  const isExpired = (expiresAt: string | null) => {
    return expiresAt && new Date(expiresAt) < new Date()
  }

  return (
    <AdminLayout activeTab="invites">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">أكواد الدعوة</h2>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 ml-1" />
            إنشاء كود
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاستخدام</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>أنشئ بواسطة</TableHead>
                <TableHead>استخدم بواسطة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell>
                </TableRow>
              ) : invites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد أكواد دعوة
                  </TableCell>
                </TableRow>
              ) : (
                invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-primary/10 rounded font-mono">
                          {invite.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(invite.code)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invite.currentUses} / {invite.maxUses}
                    </TableCell>
                    <TableCell>
                      {invite.expiresAt ? (
                        <div className="flex items-center gap-1">
                          {isExpired(invite.expiresAt) && (
                            <span className="text-red-400 text-xs">منتهي</span>
                          )}
                          {new Date(invite.expiresAt).toLocaleDateString('ar-EG')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">لا نهائي</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invite.isActive ? 'default' : 'secondary'}>
                        {invite.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invite.createdBy?.fullName || invite.createdBy?.email || 'النظام'}
                    </TableCell>
                    <TableCell>
                      {invite.usedBy?.fullName || invite.usedBy?.email || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(invite.id, !invite.isActive)}
                        >
                          {invite.isActive ? (
                            <X className="w-4 h-4 text-red-400" />
                          ) : (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400"
                          onClick={() => handleDelete(invite.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء كود دعوة جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الكود</Label>
              <div className="flex gap-2">
                <Input
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                  placeholder="ABC12345"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generateRandomCode}>
                  توليد
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للاستخدام</Label>
              <Input
                type="number"
                value={newCode.maxUses}
                onChange={(e) => setNewCode({ ...newCode, maxUses: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input
                type="date"
                value={newCode.expiresAt}
                onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreate}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
