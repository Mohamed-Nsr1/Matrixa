'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, Save, Shield, CreditCard, BarChart3, Calendar, Lock, AlertTriangle, Eye, Clock, DollarSign, Smartphone, Building } from 'lucide-react'
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
  // Subscription Expiration Settings
  gracePeriodDays: string
  enableSignInRestriction: string
  signInRestrictionDays: string
  // Feature Limits for Expired Users
  expiredTimetableDays: string
  expiredNotesLimit: string
  expiredFocusSessionsLimit: string
  expiredPrivateLessonsLimit: string
  // Manual Payment Settings
  manualPaymentEnabled: string
  paymobEnabled: string
  vodafoneCashNumber: string
  etisalatCashNumber: string
  orangeCashNumber: string
  instaPayUsername: string
  vodafoneCashEnabled: string
  etisalatCashEnabled: string
  orangeCashEnabled: string
  instaPayEnabled: string
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
    maintenanceMode: 'false',
    // Subscription Expiration Settings
    gracePeriodDays: '7',
    enableSignInRestriction: 'false',
    signInRestrictionDays: '30',
    // Feature Limits for Expired Users
    expiredTimetableDays: '5',
    expiredNotesLimit: '20',
    expiredFocusSessionsLimit: '10',
    expiredPrivateLessonsLimit: '5',
    // Manual Payment Settings
    manualPaymentEnabled: 'false',
    paymobEnabled: 'false',
    vodafoneCashNumber: '',
    etisalatCashNumber: '',
    orangeCashNumber: '',
    instaPayUsername: '',
    vodafoneCashEnabled: 'false',
    etisalatCashEnabled: 'false',
    orangeCashEnabled: 'false',
    instaPayEnabled: 'false'
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

        {/* Subscription Expiration Settings */}
        <Card className="border-orange-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-base">إعدادات انتهاء الاشتراك</CardTitle>
            </div>
            <CardDescription>تحكم في ما يحدث بعد انتهاء اشتراك الطالب</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grace Period */}
            <div className="space-y-2">
              <Label>مدة فترة السماح (أيام)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                عدد الأيام التي يمكن للطالب فيها الوصول الكامل بعد انتهاء الاشتراك
              </p>
              <Input
                type="number"
                value={settings.gracePeriodDays}
                onChange={(e) => updateSetting('gracePeriodDays', e.target.value)}
                min={0}
                max={30}
                className="w-32"
              />
            </div>

            {/* Sign-in Restriction */}
            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg">
              <div>
                <Label className="text-red-400">تقييد تسجيل الدخول بعد انتهاء الاشتراك</Label>
                <p className="text-sm text-muted-foreground">
                  منع الطلاب من تسجيل الدخول بعد انتهاء فترة السماح
                </p>
              </div>
              <Switch
                checked={settings.enableSignInRestriction === 'true'}
                onCheckedChange={(checked) => updateSetting('enableSignInRestriction', checked ? 'true' : 'false')}
              />
            </div>

            {settings.enableSignInRestriction === 'true' && (
              <div className="space-y-2 pl-4 border-r-2 border-red-500/20">
                <Label>أيام بعد انتهاء الاشتراك لحجب الدخول</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  عدد الأيام بعد انتهاء الاشتراك قبل حجب تسجيل الدخول تماماً
                </p>
                <Input
                  type="number"
                  value={settings.signInRestrictionDays}
                  onChange={(e) => updateSetting('signInRestrictionDays', e.target.value)}
                  min={0}
                  max={365}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  يشمل ذلك فترة السماح + هذه الأيام الإضافية
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Limits for Expired Users */}
        <Card className="border-blue-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-base">حدود المشاهدة للمستخدمين المنتهية اشتراكاتهم</CardTitle>
            </div>
            <CardDescription>حدد ما يمكن للطلاب رؤيته بعد انتهاء اشتراكهم (وضع القراءة فقط)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Timetable Days */}
              <div className="space-y-2 p-3 bg-blue-500/5 rounded-lg">
                <Label>أيام الجدول الزمني</Label>
                <p className="text-sm text-muted-foreground">
                  عدد الأيام القادمة التي يمكن رؤيتها في الجدول
                </p>
                <Input
                  type="number"
                  value={settings.expiredTimetableDays}
                  onChange={(e) => updateSetting('expiredTimetableDays', e.target.value)}
                  min={1}
                  max={30}
                  className="w-24"
                />
              </div>

              {/* Notes Limit */}
              <div className="space-y-2 p-3 bg-blue-500/5 rounded-lg">
                <Label>عدد الملاحظات</Label>
                <p className="text-sm text-muted-foreground">
                  الحد الأقصى من الملاحظات التي يمكن رؤيتها
                </p>
                <Input
                  type="number"
                  value={settings.expiredNotesLimit}
                  onChange={(e) => updateSetting('expiredNotesLimit', e.target.value)}
                  min={1}
                  max={100}
                  className="w-24"
                />
              </div>

              {/* Focus Sessions Limit */}
              <div className="space-y-2 p-3 bg-blue-500/5 rounded-lg">
                <Label>جلسات التركيز</Label>
                <p className="text-sm text-muted-foreground">
                  الحد الأقصى من جلسات التركيز السابقة
                </p>
                <Input
                  type="number"
                  value={settings.expiredFocusSessionsLimit}
                  onChange={(e) => updateSetting('expiredFocusSessionsLimit', e.target.value)}
                  min={1}
                  max={50}
                  className="w-24"
                />
              </div>

              {/* Private Lessons Limit */}
              <div className="space-y-2 p-3 bg-blue-500/5 rounded-lg">
                <Label>الدروس الخصوصية</Label>
                <p className="text-sm text-muted-foreground">
                  الحد الأقصى من الدروس الخصوصية المعروضة
                </p>
                <Input
                  type="number"
                  value={settings.expiredPrivateLessonsLimit}
                  onChange={(e) => updateSetting('expiredPrivateLessonsLimit', e.target.value)}
                  min={1}
                  max={50}
                  className="w-24"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">
                ℹ️ هذه الحدود تطبق فقط على المستخدمين المنتهية اشتراكاتهم بعد فترة السماح. 
                يمكنهم مشاهدة بياناتهم ولكن لا يمكنهم التعديل أو الإضافة.
              </p>
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

        {/* Manual Payment Settings */}
        <Card className="border-green-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <CardTitle className="text-base">إعدادات الدفع اليدوي</CardTitle>
            </div>
            <CardDescription>إعدادات الدفع عبر المحافظ الإلكترونية وانستاباي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable Manual Payment */}
            <div className="flex items-center justify-between p-4 bg-green-500/5 rounded-lg">
              <div>
                <Label className="text-green-400">تفعيل الدفع اليدوي</Label>
                <p className="text-sm text-muted-foreground">
                  السماح للطلاب بالدفع عبر المحافظ الإلكترونية وانستاباي
                </p>
              </div>
              <Switch
                checked={settings.manualPaymentEnabled === 'true'}
                onCheckedChange={(checked) => updateSetting('manualPaymentEnabled', checked ? 'true' : 'false')}
              />
            </div>

            {/* Enable Paymob */}
            <div className="flex items-center justify-between">
              <div>
                <Label>تفعيل Paymob (الدفع التلقائي)</Label>
                <p className="text-sm text-muted-foreground">
                  الدفع عبر Paymob (يتطلب إعداد API)
                </p>
              </div>
              <Switch
                checked={settings.paymobEnabled === 'true'}
                onCheckedChange={(checked) => updateSetting('paymobEnabled', checked ? 'true' : 'false')}
              />
            </div>

            {settings.manualPaymentEnabled === 'true' && (
              <>
                <div className="border-t border-white/5 pt-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    المحافظ الإلكترونية
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Vodafone Cash */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Switch
                          checked={settings.vodafoneCashEnabled === 'true'}
                          onCheckedChange={(checked) => updateSetting('vodafoneCashEnabled', checked ? 'true' : 'false')}
                        />
                        <Label>فودافون كاش</Label>
                      </div>
                      {settings.vodafoneCashEnabled === 'true' && (
                        <Input
                          placeholder="رقم الاستلام"
                          value={settings.vodafoneCashNumber}
                          onChange={(e) => updateSetting('vodafoneCashNumber', e.target.value)}
                          className="w-40"
                          dir="ltr"
                        />
                      )}
                    </div>

                    {/* Etisalat Cash */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Switch
                          checked={settings.etisalatCashEnabled === 'true'}
                          onCheckedChange={(checked) => updateSetting('etisalatCashEnabled', checked ? 'true' : 'false')}
                        />
                        <Label>اتصالات كاش</Label>
                      </div>
                      {settings.etisalatCashEnabled === 'true' && (
                        <Input
                          placeholder="رقم الاستلام"
                          value={settings.etisalatCashNumber}
                          onChange={(e) => updateSetting('etisalatCashNumber', e.target.value)}
                          className="w-40"
                          dir="ltr"
                        />
                      )}
                    </div>

                    {/* Orange Cash */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Switch
                          checked={settings.orangeCashEnabled === 'true'}
                          onCheckedChange={(checked) => updateSetting('orangeCashEnabled', checked ? 'true' : 'false')}
                        />
                        <Label>أورنج كاش</Label>
                      </div>
                      {settings.orangeCashEnabled === 'true' && (
                        <Input
                          placeholder="رقم الاستلام"
                          value={settings.orangeCashNumber}
                          onChange={(e) => updateSetting('orangeCashNumber', e.target.value)}
                          className="w-40"
                          dir="ltr"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    انستاباي (تحويل بنكي)
                  </h4>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Switch
                        checked={settings.instaPayEnabled === 'true'}
                        onCheckedChange={(checked) => updateSetting('instaPayEnabled', checked ? 'true' : 'false')}
                      />
                      <Label>تفعيل انستاباي</Label>
                    </div>
                    {settings.instaPayEnabled === 'true' && (
                      <Input
                        placeholder="@username"
                        value={settings.instaPayUsername}
                        onChange={(e) => updateSetting('instaPayUsername', e.target.value)}
                        className="w-40"
                        dir="ltr"
                      />
                    )}
                  </div>
                </div>

                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">
                    ℹ️ عند تفعيل الدفع اليدوي، سيتمكن الطلاب من إرسال طلبات الدفع مع صورة الإيصال.
                    ستظهر الطلبات في صفحة "الدفع اليدوي" للمراجعة والموافقة.
                  </p>
                </div>
              </>
            )}
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
