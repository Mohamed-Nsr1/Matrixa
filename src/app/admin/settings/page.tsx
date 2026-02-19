'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, Save, Shield, CreditCard, BarChart3, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Settings {
  inviteOnlyMode: string
  subscriptionEnabled: string
  trialEnabled: string
  trialDays: string
  leaderboardEnabled: string
  testMode: string
  examDate: string
  maintenanceMode: string
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Settings>({
    inviteOnlyMode: 'false',
    subscriptionEnabled: 'true',
    trialEnabled: 'true',
    trialDays: '14',
    leaderboardEnabled: 'true',
    testMode: 'true',
    examDate: '',
    maintenanceMode: 'false'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings as Settings)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل الإعدادات' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم حفظ الإعدادات' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حفظ الإعدادات' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <AdminLayout activeTab="settings">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeTab="settings">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">إعدادات النظام</h2>
            <p className="text-sm text-muted-foreground">تكوين إعدادات التطبيق</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 ml-1" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">إعدادات التسجيل</CardTitle>
            </div>
            <CardDescription>تحكم في عملية تسجيل المستخدمين الجدد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>وضع الدعوة فقط</Label>
                <p className="text-sm text-muted-foreground">
                  يتطلب كود دعوة للتسجيل
                </p>
              </div>
              <Switch
                checked={settings.inviteOnlyMode === 'true'}
                onCheckedChange={(checked) => updateSetting('inviteOnlyMode', checked ? 'true' : 'false')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan" />
              <CardTitle className="text-base">إعدادات الاشتراك</CardTitle>
            </div>
            <CardDescription>تحكم في نظام الاشتراكات والدفع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>تفعيل الاشتراكات</Label>
                <p className="text-sm text-muted-foreground">
                  يتطلب اشتراك نشط للوصول للمحتوى
                </p>
              </div>
              <Switch
                checked={settings.subscriptionEnabled === 'true'}
                onCheckedChange={(checked) => updateSetting('subscriptionEnabled', checked ? 'true' : 'false')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>تفعيل الفترة التجريبية</Label>
                <p className="text-sm text-muted-foreground">
                  منح فترة تجريبية للمستخدمين الجدد
                </p>
              </div>
              <Switch
                checked={settings.trialEnabled === 'true'}
                onCheckedChange={(checked) => updateSetting('trialEnabled', checked ? 'true' : 'false')}
              />
            </div>

            <div className="space-y-2">
              <Label>مدة الفترة التجريبية (أيام)</Label>
              <Input
                type="number"
                value={settings.trialDays}
                onChange={(e) => updateSetting('trialDays', e.target.value)}
                min={1}
                max={90}
                className="w-32"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>وضع الاختبار</Label>
                <p className="text-sm text-muted-foreground">
                  استخدام بيئة الاختبار للدفع (Paymob)
                </p>
              </div>
              <Switch
                checked={settings.testMode === 'true'}
                onCheckedChange={(checked) => updateSetting('testMode', checked ? 'true' : 'false')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Engagement Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet" />
              <CardTitle className="text-base">إعدادات المشاركة</CardTitle>
            </div>
            <CardDescription>تحكم في عناصر المشاركة والتنافس</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>لوحة المتصدرين</Label>
                <p className="text-sm text-muted-foreground">
                  عرض لوحة المتصدرين للمستخدمين
                </p>
              </div>
              <Switch
                checked={settings.leaderboardEnabled === 'true'}
                onCheckedChange={(checked) => updateSetting('leaderboardEnabled', checked ? 'true' : 'false')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Exam Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber" />
              <CardTitle className="text-base">إعدادات الامتحانات</CardTitle>
            </div>
            <CardDescription>تحكم في تاريخ امتحانات الثانوية العامة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>تاريخ بدء الامتحانات</Label>
              <p className="text-sm text-muted-foreground mb-2">
                سيتم عرض عد تنازلي لهذا التاريخ في لوحة الطالب
              </p>
              <Input
                type="date"
                value={settings.examDate || ''}
                onChange={(e) => updateSetting('examDate', e.target.value)}
                className="w-full md:w-64"
              />
              {!settings.examDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  سيتم استخدام 15 يونيو من العام القادم كتاريخ افتراضي
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card className="border-amber-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">وضع الصيانة</CardTitle>
            </div>
            <CardDescription>تفعيل وضع الصيانة لإيقاف وصول المستخدمين مؤقتاً</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-500/5 rounded-lg">
              <div>
                <Label className="text-amber-400">تفعيل وضع الصيانة</Label>
                <p className="text-sm text-muted-foreground">
                  سيتم حجب جميع الصفحات عن المستخدمين العاديين وإظهار صفحة الصيانة
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode === 'true'}
                onCheckedChange={(checked) => updateSetting('maintenanceMode', checked ? 'true' : 'false')}
              />
            </div>
            {settings.maintenanceMode === 'true' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-400">
                  ⚠️ وضع الصيانة مفعل. المستخدمون العاديون لن يتمكنوا من الوصول للتطبيق.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-base text-red-400">منطقة الخطر</CardTitle>
            <CardDescription>إجراءات خطرة - استخدم بحذر</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg">
              <div>
                <Label className="text-red-400">إعادة تعيين البيانات</Label>
                <p className="text-sm text-muted-foreground">
                  حذف جميع بيانات المستخدمين والتقدم
                </p>
              </div>
              <Button variant="destructive" disabled>
                غير متاح
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
