'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Trophy,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Crown,
  Gem,
  Medal,
  Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Badge {
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
  order: number
  isActive: boolean
  _count?: { userBadges: number }
}

const BADGE_TYPES = [
  { value: 'STREAK', label: 'المسارات' },
  { value: 'TASKS', label: 'المهام' },
  { value: 'FOCUS', label: 'التركيز' },
  { value: 'SUBJECTS', label: 'المواد' },
  { value: 'SPECIAL', label: 'خاص' }
]

const BADGE_RARITIES = [
  { value: 'COMMON', label: 'عادي', color: 'text-gray-400' },
  { value: 'UNCOMMON', label: 'غير شائع', color: 'text-green-400' },
  { value: 'RARE', label: 'نادر', color: 'text-blue-400' },
  { value: 'EPIC', label: 'ملحمي', color: 'text-purple-400' },
  { value: 'LEGENDARY', label: 'أسطوري', color: 'text-yellow-400' }
]

export default function AdminBadgesPage() {
  const { toast } = useToast()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    icon: '🏆',
    color: '#8b5cf6',
    type: 'SPECIAL',
    requirement: 1,
    rarity: 'COMMON',
    xpReward: 0,
    order: 0
  })

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/badges')
      const data = await res.json()

      if (res.ok) {
        setBadges(data.badges || [])
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBadge = async () => {
    if (!formData.nameAr || !formData.nameEn) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب إدخال الاسم بالعربية والإنجليزية' })
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'تم', description: 'تم إنشاء الشارة بنجاح' })
        setShowCreateDialog(false)
        resetForm()
        fetchBadges()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSeedBadges = async () => {
    if (!confirm('هل تريد إضافة الشارات الافتراضية؟')) return
    
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'PUT'
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'تم', description: data.message })
        fetchBadges()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message })
    } finally {
      setSeeding(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      icon: '🏆',
      color: '#8b5cf6',
      type: 'SPECIAL',
      requirement: 1,
      rarity: 'COMMON',
      xpReward: 0,
      order: 0
    })
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return <Medal className="w-4 h-4 text-gray-400" />
      case 'UNCOMMON': return <Star className="w-4 h-4 text-green-400" />
      case 'RARE': return <Sparkles className="w-4 h-4 text-blue-400" />
      case 'EPIC': return <Gem className="w-4 h-4 text-purple-400" />
      case 'LEGENDARY': return <Crown className="w-4 h-4 text-yellow-400" />
      default: return <Medal className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    return BADGE_TYPES.find(t => t.value === type)?.label || type
  }

  const getRarityLabel = (rarity: string) => {
    return BADGE_RARITIES.find(r => r.value === rarity)?.label || rarity
  }

  const groupedBadges = badges.reduce((acc, badge) => {
    const type = badge.type
    if (!acc[type]) acc[type] = []
    acc[type].push(badge)
    return acc
  }, {} as Record<string, Badge[]>)

  return (
    <AdminLayout activeTab="badges">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              إدارة الشارات
            </h2>
            <p className="text-sm text-muted-foreground">
              إنشاء وتعديل شارات الإنجاز
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchBadges}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
            <Button variant="outline" onClick={handleSeedBadges} disabled={seeding}>
              <Zap className="w-4 h-4 ml-2" />
              {seeding ? 'جاري...' : 'إضافة افتراضية'}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              شارة جديدة
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{badges.length}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الشارات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {Object.entries(groupedBadges).map(([type, typeBadges]) => (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Medal className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{typeBadges.length}</p>
                    <p className="text-xs text-muted-foreground">{getTypeLabel(type)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Badges List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : badges.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">لا توجد شارات</p>
              <Button onClick={handleSeedBadges} disabled={seeding}>
                <Zap className="w-4 h-4 ml-2" />
                إضافة الشارات الافتراضية
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBadges).map(([type, typeBadges]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {getTypeLabel(type)}
                  </CardTitle>
                  <CardDescription>{typeBadges.length} شارة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: badge.color + '20' }}
                          >
                            {badge.icon}
                          </div>
                          <div className="flex items-center gap-1">
                            {getRarityIcon(badge.rarity)}
                            <span className="text-xs text-muted-foreground">
                              {getRarityLabel(badge.rarity)}
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="font-medium text-sm">{badge.nameAr}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{badge.nameEn}</p>
                        
                        {badge.descriptionAr && (
                          <p className="text-xs text-muted-foreground mb-2">{badge.descriptionAr}</p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            المتطلب: {badge.requirement}
                          </span>
                          <span className="text-yellow-500">
                            +{badge.xpReward} XP
                          </span>
                        </div>
                        
                        {badge._count && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            حصل عليها: {badge._count.userBadges} مستخدم
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء شارة جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات الشارة الجديدة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="اسم الشارة"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  placeholder="Badge Name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Input
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                  placeholder="وصف الشارة"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Input
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  placeholder="Badge Description"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الأيقونة (إيموجي)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🏆"
                />
              </div>
              <div className="space-y-2">
                <Label>اللون</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الندرة</Label>
                <Select
                  value={formData.rarity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, rarity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_RARITIES.map(rarity => (
                      <SelectItem key={rarity.value} value={rarity.value}>{rarity.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>المتطلب</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.requirement}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirement: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>مكافأة XP</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.xpReward}
                  onChange={(e) => setFormData(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateBadge} disabled={actionLoading}>
                {actionLoading ? 'جاري الإنشاء...' : 'إنشاء'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
