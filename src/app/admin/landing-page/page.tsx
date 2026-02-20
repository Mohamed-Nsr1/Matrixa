'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Save, Eye, FileText, BarChart3, Sparkles, Plus, Trash2, GripVertical, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface LandingPageContent {
  id?: string
  heroTitle: string | null
  heroTitleEn: string | null
  heroSubtitle: string | null
  heroSubtitleEn: string | null
  heroCtaText: string | null
  heroCtaTextEn: string | null
  badgeText: string | null
  badgeTextEn: string | null
  stat1Value: string | null
  stat1Label: string | null
  stat1LabelEn: string | null
  stat2Value: string | null
  stat2Label: string | null
  stat2LabelEn: string | null
  stat3Value: string | null
  stat3Label: string | null
  stat3LabelEn: string | null
  stat4Value: string | null
  stat4Label: string | null
  stat4LabelEn: string | null
  featuresTitle: string | null
  featuresTitleEn: string | null
  featuresSubtitle: string | null
  featuresSubtitleEn: string | null
  ctaTitle: string | null
  ctaTitleEn: string | null
  ctaSubtitle: string | null
  ctaSubtitleEn: string | null
  ctaButtonText: string | null
  ctaButtonTextEn: string | null
  footerText: string | null
  footerTextEn: string | null
}

interface Feature {
  id?: string
  title: string
  titleEn: string | null
  description: string
  descriptionEn: string | null
  icon: string
  color: string
  order: number
  isActive: boolean
}

const defaultContent: LandingPageContent = {
  heroTitle: '',
  heroTitleEn: '',
  heroSubtitle: '',
  heroSubtitleEn: '',
  heroCtaText: '',
  heroCtaTextEn: '',
  badgeText: '',
  badgeTextEn: '',
  stat1Value: '',
  stat1Label: '',
  stat1LabelEn: '',
  stat2Value: '',
  stat2Label: '',
  stat2LabelEn: '',
  stat3Value: '',
  stat3Label: '',
  stat3LabelEn: '',
  stat4Value: '',
  stat4Label: '',
  stat4LabelEn: '',
  featuresTitle: '',
  featuresTitleEn: '',
  featuresSubtitle: '',
  featuresSubtitleEn: '',
  ctaTitle: '',
  ctaTitleEn: '',
  ctaSubtitle: '',
  ctaSubtitleEn: '',
  ctaButtonText: '',
  ctaButtonTextEn: '',
  footerText: '',
  footerTextEn: '',
}

const iconOptions = [
  'Clock', 'Calendar', 'Target', 'Brain', 'Notebook', 'BarChart3', 
  'Sparkles', 'Zap', 'Star', 'Heart', 'Trophy', 'BookOpen', 
  'GraduationCap', 'Lightbulb', 'Rocket', 'Award'
]

const colorOptions = [
  'text-cyan', 'text-violet', 'text-emerald', 'text-pink', 'text-amber', 
  'text-blue', 'text-primary', 'text-orange', 'text-red', 'text-indigo'
]

export default function AdminLandingPageEditor() {
  const { toast } = useToast()
  const [content, setContent] = useState<LandingPageContent>(defaultContent)
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/admin/landing-page')
      const data = await res.json()
      if (data.success) {
        if (data.content) {
          setContent({ ...defaultContent, ...data.content })
        }
        if (data.features) {
          setFeatures(data.features)
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل المحتوى' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/landing-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, features })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم الحفظ', description: 'تم حفظ التغييرات بنجاح' })
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حفظ التغييرات' })
    } finally {
      setSaving(false)
    }
  }

  const updateContent = (key: keyof LandingPageContent, value: string | null) => {
    setContent(prev => ({ ...prev, [key]: value }))
  }

  const updateFeature = (index: number, key: keyof Feature, value: string | number | boolean) => {
    setFeatures(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [key]: value }
      return updated
    })
  }

  const addFeature = () => {
    setFeatures(prev => [...prev, {
      title: 'ميزة جديدة',
      titleEn: 'New Feature',
      description: 'وصف الميزة',
      descriptionEn: 'Feature description',
      icon: 'Star',
      color: 'text-primary',
      order: prev.length,
      isActive: true
    }])
  }

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <AdminLayout activeTab="landing-page">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeTab="landing-page">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">تعديل صفحة الهبوط</h2>
            <p className="text-sm text-muted-foreground">تخصيص محتوى صفحة الهبوط الرئيسية</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/" target="_blank">
                <Eye className="w-4 h-4 ml-1" />
                معاينة
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 ml-1" />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">قسم البطل (Hero)</CardTitle>
            </div>
            <CardDescription>القسم الرئيسي في أعلى الصفحة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الشعار الصغير</Label>
                <Input
                  value={content.badgeText || ''}
                  onChange={(e) => updateContent('badgeText', e.target.value)}
                  placeholder="مصمم خصيصاً لطلاب الثانوية المصرية"
                />
              </div>
              <div className="space-y-2">
                <Label>الشعار الصغير (EN)</Label>
                <Input
                  value={content.badgeTextEn || ''}
                  onChange={(e) => updateContent('badgeTextEn', e.target.value)}
                  placeholder="Designed for Egyptian High School Students"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان الرئيسي</Label>
                <Input
                  value={content.heroTitle || ''}
                  onChange={(e) => updateContent('heroTitle', e.target.value)}
                  placeholder="ادرس بذكاء،"
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان الرئيسي (EN)</Label>
                <Input
                  value={content.heroTitleEn || ''}
                  onChange={(e) => updateContent('heroTitleEn', e.target.value)}
                  placeholder="Study Smart,"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>النص الفرعي</Label>
              <Textarea
                value={content.heroSubtitle || ''}
                onChange={(e) => updateContent('heroSubtitle', e.target.value)}
                placeholder="تطبيق المذاكرة الذكي..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>النص الفرعي (EN)</Label>
              <Textarea
                value={content.heroSubtitleEn || ''}
                onChange={(e) => updateContent('heroSubtitleEn', e.target.value)}
                placeholder="The smart study app..."
                rows={2}
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص زر الدعوة للعمل</Label>
                <Input
                  value={content.heroCtaText || ''}
                  onChange={(e) => updateContent('heroCtaText', e.target.value)}
                  placeholder="ابدأ تجربتك المجانية"
                />
              </div>
              <div className="space-y-2">
                <Label>نص زر الدعوة للعمل (EN)</Label>
                <Input
                  value={content.heroCtaTextEn || ''}
                  onChange={(e) => updateContent('heroCtaTextEn', e.target.value)}
                  placeholder="Start Your Free Trial"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan" />
              <CardTitle className="text-base">قسم الإحصائيات</CardTitle>
            </div>
            <CardDescription>الأرقام والإحصائيات المعروضة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="grid grid-cols-3 gap-4 p-3 bg-white/5 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">القيمة {num}</Label>
                  <Input
                    value={content[`stat${num}Value` as keyof LandingPageContent] as string || ''}
                    onChange={(e) => updateContent(`stat${num}Value` as keyof LandingPageContent, e.target.value)}
                    placeholder="10K+"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">التسمية {num}</Label>
                  <Input
                    value={content[`stat${num}Label` as keyof LandingPageContent] as string || ''}
                    onChange={(e) => updateContent(`stat${num}Label` as keyof LandingPageContent, e.target.value)}
                    placeholder="طالب نشط"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">التسمية {num} (EN)</Label>
                  <Input
                    value={content[`stat${num}LabelEn` as keyof LandingPageContent] as string || ''}
                    onChange={(e) => updateContent(`stat${num}LabelEn` as keyof LandingPageContent, e.target.value)}
                    placeholder="Active Students"
                    className="h-8"
                    dir="ltr"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet" />
                  <CardTitle className="text-base">قسم المميزات</CardTitle>
                </div>
                <CardDescription>بطاقات المميزات المعروضة</CardDescription>
              </div>
              <Button onClick={addFeature} size="sm" variant="outline">
                <Plus className="w-4 h-4 ml-1" />
                إضافة ميزة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>عنوان القسم</Label>
                <Input
                  value={content.featuresTitle || ''}
                  onChange={(e) => updateContent('featuresTitle', e.target.value)}
                  placeholder="كل ما تحتاجه للتفوق"
                />
              </div>
              <div className="space-y-2">
                <Label>عنوان القسم (EN)</Label>
                <Input
                  value={content.featuresTitleEn || ''}
                  onChange={(e) => updateContent('featuresTitleEn', e.target.value)}
                  placeholder="Everything You Need to Excel"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label>النص الفرعي للقسم</Label>
              <Input
                value={content.featuresSubtitle || ''}
                onChange={(e) => updateContent('featuresSubtitle', e.target.value)}
                placeholder="أدوات مصممة بعناية لمساعدتك على المذاكرة بفعالية"
              />
            </div>

            {features.map((feature, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-sm font-medium">ميزة {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={feature.isActive}
                      onCheckedChange={(checked) => updateFeature(index, 'isActive', checked)}
                    />
                    <Button
                      onClick={() => removeFeature(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">العنوان</Label>
                    <Input
                      value={feature.title}
                      onChange={(e) => updateFeature(index, 'title', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">العنوان (EN)</Label>
                    <Input
                      value={feature.titleEn || ''}
                      onChange={(e) => updateFeature(index, 'titleEn', e.target.value)}
                      className="h-8"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">الوصف</Label>
                  <Textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">الأيقونة</Label>
                    <select
                      value={feature.icon}
                      onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                    >
                      {iconOptions.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">اللون</Label>
                    <select
                      value={feature.color}
                      onChange={(e) => updateFeature(index, 'color', e.target.value)}
                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                    >
                      {colorOptions.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber" />
              <CardTitle className="text-base">قسم الدعوة للعمل</CardTitle>
            </div>
            <CardDescription>القسم السفلي للدعوة للتسجيل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={content.ctaTitle || ''}
                  onChange={(e) => updateContent('ctaTitle', e.target.value)}
                  placeholder="جاهز تبدأ رحلتك؟"
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (EN)</Label>
                <Input
                  value={content.ctaTitleEn || ''}
                  onChange={(e) => updateContent('ctaTitleEn', e.target.value)}
                  placeholder="Ready to Start Your Journey?"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>النص الفرعي</Label>
              <Textarea
                value={content.ctaSubtitle || ''}
                onChange={(e) => updateContent('ctaSubtitle', e.target.value)}
                placeholder="انضم لآلاف الطلاب..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص الزر</Label>
                <Input
                  value={content.ctaButtonText || ''}
                  onChange={(e) => updateContent('ctaButtonText', e.target.value)}
                  placeholder="ابدأ الآن مجاناً"
                />
              </div>
              <div className="space-y-2">
                <Label>نص الزر (EN)</Label>
                <Input
                  value={content.ctaButtonTextEn || ''}
                  onChange={(e) => updateContent('ctaButtonTextEn', e.target.value)}
                  placeholder="Start Free Now"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">التذييل</CardTitle>
            <CardDescription>نص التذييل في أسفل الصفحة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص التذييل</Label>
                <Input
                  value={content.footerText || ''}
                  onChange={(e) => updateContent('footerText', e.target.value)}
                  placeholder="© 2024 Matrixa. جميع الحقوق محفوظة."
                />
              </div>
              <div className="space-y-2">
                <Label>نص التذييل (EN)</Label>
                <Input
                  value={content.footerTextEn || ''}
                  onChange={(e) => updateContent('footerTextEn', e.target.value)}
                  placeholder="© 2024 Matrixa. All rights reserved."
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
