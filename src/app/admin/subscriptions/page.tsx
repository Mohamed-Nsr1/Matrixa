'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  CreditCard, 
  Calendar, 
  Plus, 
  Pencil, 
  Trash2,
  Package,
  Users,
  DollarSign,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string | null
  trialStart: string | null
  trialEnd: string | null
  user: {
    id: string
    email: string
    fullName: string | null
  }
  plan: {
    name: string
    nameAr: string
  } | null
}

interface Plan {
  id: string
  name: string
  nameAr: string
  description: string | null
  descriptionAr: string | null
  price: number
  durationDays: number
  features: string | null
  isActive: boolean
  subscriberCount?: number
}

const statusLabels: Record<string, { label: string; color: string }> = {
  TRIAL: { label: 'تجريبي', color: 'bg-blue-500/20 text-blue-400' },
  ACTIVE: { label: 'نشط', color: 'bg-emerald-500/20 text-emerald-400' },
  EXPIRED: { label: 'منتهي', color: 'bg-red-500/20 text-red-400' },
  CANCELLED: { label: 'ملغي', color: 'bg-gray-500/20 text-gray-400' },
  PAUSED: { label: 'متوقف', color: 'bg-yellow-500/20 text-yellow-400' }
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('subscriptions')

  // Plan management state
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    durationDays: 30,
    features: {
      fullAccess: true,
      progressTracking: true,
      focusSessions: true,
      weeklyPlanner: true,
      notes: true,
      leaderboard: true,
      announcements: true
    } as Record<string, boolean>,
    isActive: true
  })

  // Available features for toggles
  const availableFeatures = [
    { key: 'fullAccess', labelAr: 'الوصول الكامل لجميع المواد', labelEn: 'Full access to all subjects' },
    { key: 'progressTracking', labelAr: 'تتبع التقدم والإحصائيات', labelEn: 'Progress tracking & insights' },
    { key: 'focusSessions', labelAr: 'جلسات التركيز', labelEn: 'Focus sessions' },
    { key: 'weeklyPlanner', labelAr: 'المخطط الأسبوعي', labelEn: 'Weekly planner' },
    { key: 'notes', labelAr: 'الملاحظات', labelEn: 'Notes' },
    { key: 'leaderboard', labelAr: 'لوحة المتصدرين', labelEn: 'Leaderboard' },
    { key: 'announcements', labelAr: 'الإعلانات', labelEn: 'Announcements' }
  ]

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions()
    } else {
      fetchPlans()
    }
  }, [statusFilter, activeTab])

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/subscriptions?${params}`)
      const data = await res.json()
      if (data.success) {
        setSubscriptions(data.subscriptions)
        setStats(data.stats)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      if (data.success) {
        setPlans(data.plans)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل الخطط' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedSub) return

    try {
      const res = await fetch(`/api/admin/subscriptions/${selectedSub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم التحديث' })
        fetchSubscriptions()
        setShowDialog(false)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في التحديث' })
    }
  }

  const handleSavePlan = async () => {
    try {
      // Convert features object to array of enabled feature labels (Arabic)
      const enabledFeatures = availableFeatures
        .filter(f => planForm.features[f.key])
        .map(f => f.labelAr)

      const payload = {
        name: planForm.name,
        nameAr: planForm.nameAr,
        description: planForm.description || null,
        descriptionAr: planForm.descriptionAr || null,
        price: planForm.price,
        durationDays: planForm.durationDays,
        features: enabledFeatures.length > 0 ? enabledFeatures : null,
        isActive: planForm.isActive
      }

      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans'
      const method = editingPlan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: editingPlan ? 'تم تحديث الخطة' : 'تم إنشاء الخطة' })
        fetchPlans()
        setShowPlanDialog(false)
        resetPlanForm()
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحفظ' })
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return

    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم حذف الخطة' })
        fetchPlans()
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' })
    }
  }

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: 0,
      durationDays: 30,
      features: {
        fullAccess: true,
        progressTracking: true,
        focusSessions: true,
        weeklyPlanner: true,
        notes: true,
        leaderboard: true,
        announcements: true
      },
      isActive: true
    })
    setEditingPlan(null)
  }

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    
    // Parse existing features and convert to toggle state
    const existingFeatures = plan.features ? JSON.parse(plan.features) : []
    const featureState: Record<string, boolean> = {}
    availableFeatures.forEach(f => {
      featureState[f.key] = existingFeatures.includes(f.labelAr)
    })
    
    setPlanForm({
      name: plan.name,
      nameAr: plan.nameAr,
      description: plan.description || '',
      descriptionAr: plan.descriptionAr || '',
      price: plan.price,
      durationDays: plan.durationDays,
      features: featureState,
      isActive: plan.isActive
    })
    setShowPlanDialog(true)
  }

  return (
    <AdminLayout activeTab="subscriptions">
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              الاشتراكات
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              الخطط
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(statusLabels).map(([key, { label, color }]) => (
                <div key={key} className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold">{stats[key] || 0}</p>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex justify-between items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  {Object.entries(statusLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الخطة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ البدء</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell>
                    </TableRow>
                  ) : subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد اشتراكات
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.user.fullName || 'بدون اسم'}</p>
                            <p className="text-sm text-muted-foreground">{sub.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sub.plan?.nameAr || 'تجريبي'}</TableCell>
                        <TableCell>
                          <Badge className={statusLabels[sub.status]?.color}>
                            {statusLabels[sub.status]?.label || sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(sub.startDate).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString('ar-EG') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSub(sub)
                              setShowDialog(true)
                            }}
                          >
                            تعديل
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">خطط الاشتراك</h3>
                <p className="text-sm text-muted-foreground">إدارة خطط الاشتراك المتاحة</p>
              </div>
              <Button onClick={() => {
                resetPlanForm()
                setShowPlanDialog(true)
              }}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة خطة
              </Button>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  جاري التحميل...
                </div>
              ) : plans.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  لا توجد خطط
                </div>
              ) : (
                plans.map((plan) => (
                  <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{plan.nameAr}</CardTitle>
                          <CardDescription>{plan.name}</CardDescription>
                        </div>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'نشطة' : 'معطلة'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">جنيه</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {plan.durationDays} يوم
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {plan.subscriberCount || 0} مشترك
                        </span>
                      </div>

                      {plan.descriptionAr && (
                        <p className="text-sm text-muted-foreground">{plan.descriptionAr}</p>
                      )}

                      {plan.features && (
                        <ul className="text-xs space-y-1">
                          {JSON.parse(plan.features).slice(0, 3).map((feature: string, i: number) => (
                            <li key={i} className="text-muted-foreground">• {feature}</li>
                          ))}
                        </ul>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditPlan(plan)}
                        >
                          <Pencil className="w-3.5 h-3.5 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:text-red-500"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Subscription Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الاشتراك</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              المستخدم: {selectedSub?.user.fullName || selectedSub?.user.email}
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              الحالة الحالية: {statusLabels[selectedSub?.status || '']?.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusLabels).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant={selectedSub?.status === key ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل خطة الاشتراك
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم بالعربية *</Label>
                <Input
                  value={planForm.nameAr}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="الخطة الشهرية"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية *</Label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Monthly Plan"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف بالعربية</Label>
                <Input
                  value={planForm.descriptionAr}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, descriptionAr: e.target.value }))}
                  placeholder="وصف الخطة"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف بالإنجليزية</Label>
                <Input
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Plan description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (جنيه) *</Label>
                <Input
                  type="number"
                  value={planForm.price}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="99"
                />
              </div>
              <div className="space-y-2">
                <Label>المدة (أيام) *</Label>
                <Input
                  type="number"
                  value={planForm.durationDays}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 30 }))}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>المميزات المتاحة</Label>
              <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                {availableFeatures.map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm font-medium">{feature.labelAr}</span>
                      <span className="text-xs text-muted-foreground block">{feature.labelEn}</span>
                    </div>
                    <Switch
                      checked={planForm.features[feature.key] || false}
                      onCheckedChange={(checked) => 
                        setPlanForm(prev => ({
                          ...prev,
                          features: { ...prev.features, [feature.key]: checked }
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>تفعيل الخطة</Label>
                <p className="text-sm text-muted-foreground">
                  الخطة النشطة تظهر للمستخدمين
                </p>
              </div>
              <Switch
                checked={planForm.isActive}
                onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSavePlan}>
              {editingPlan ? 'حفظ التغييرات' : 'إنشاء الخطة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
