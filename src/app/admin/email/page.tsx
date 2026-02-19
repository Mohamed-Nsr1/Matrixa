'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Mail, Send, Plus, Edit, Trash2, Copy, Users, Clock, 
  CheckCircle, AlertCircle, Eye, FileText, RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  subjectAr?: string
  body: string
  bodyAr?: string
  type: string
  trigger?: string
  isActive: boolean
  isSystem: boolean
  triggerOffset?: number
  createdAt: string
}

interface EmailLog {
  id: string
  email: string
  userName?: string
  subject: string
  status: string
  sentAt?: string
  error?: string
  createdAt: string
}

interface Student {
  id: string
  email: string
  fullName?: string
  subscriptionStatus: string
}

const EMAIL_TRIGGERS = [
  { value: 'TRIAL_STARTED', label: 'بداية الفترة التجريبية', labelEn: 'Trial Started' },
  { value: 'TRIAL_ENDING', label: 'انتهاء الفترة التجريبية قريباً', labelEn: 'Trial Ending' },
  { value: 'TRIAL_EXPIRED', label: 'انتهاء الفترة التجريبية', labelEn: 'Trial Expired' },
  { value: 'SUBSCRIPTION_ACTIVE', label: 'تفعيل الاشتراك', labelEn: 'Subscription Active' },
  { value: 'SUBSCRIPTION_ENDING', label: 'انتهاء الاشتراك قريباً', labelEn: 'Subscription Ending' },
  { value: 'SUBSCRIPTION_EXPIRED', label: 'انتهاء الاشتراك', labelEn: 'Subscription Expired' },
  { value: 'GRACE_PERIOD_STARTED', label: 'بداية فترة السماح', labelEn: 'Grace Period Started' },
  { value: 'GRACE_PERIOD_ENDING', label: 'انتهاء فترة السماح قريباً', labelEn: 'Grace Period Ending' },
  { value: 'ACCESS_DENIED', label: 'حجب الوصول', labelEn: 'Access Denied' },
  { value: 'PAYMENT_SUCCESS', label: 'نجاح الدفع', labelEn: 'Payment Success' },
  { value: 'PAYMENT_FAILED', label: 'فشل الدفع', labelEn: 'Payment Failed' },
  { value: 'WELCOME', label: 'ترحيب بمستخدم جديد', labelEn: 'Welcome' },
]

const TEMPLATE_TYPES = [
  { value: 'SUBSCRIPTION', label: 'اشتراك' },
  { value: 'ONBOARDING', label: 'تسجيل جديد' },
  { value: 'ENGAGEMENT', label: 'تفاعل' },
  { value: 'NOTIFICATION', label: 'إشعار' },
  { value: 'GENERAL', label: 'عام' },
]

const AVAILABLE_VARIABLES = [
  { name: 'userName', description: 'اسم المستخدم' },
  { name: 'userEmail', description: 'بريد المستخدم' },
  { name: 'subscriptionEnd', description: 'تاريخ انتهاء الاشتراك' },
  { name: 'gracePeriodEnd', description: 'تاريخ انتهاء فترة السماح' },
  { name: 'trialEnd', description: 'تاريخ انتهاء الفترة التجريبية' },
  { name: 'remainingDays', description: 'الأيام المتبقية' },
  { name: 'planName', description: 'اسم الخطة' },
  { name: 'price', description: 'السعر' },
]

export default function AdminEmailPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('templates')
  
  // Template form state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    subjectAr: '',
    body: '',
    bodyAr: '',
    type: 'GENERAL',
    trigger: '',
    isActive: true,
    triggerOffset: 0
  })
  
  // Send email form state
  const [sendForm, setSendForm] = useState({
    templateId: '',
    recipients: [] as string[],
    customSubject: '',
    customBody: '',
    recipientFilter: 'all' as 'all' | 'expired' | 'active' | 'trial' | 'custom'
  })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [templatesRes, logsRes, studentsRes] = await Promise.all([
        fetch('/api/admin/email/templates'),
        fetch('/api/admin/email/logs?limit=50'),
        fetch('/api/admin/users?role=STUDENT')
      ])
      
      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      }
      
      if (logsRes.ok) {
        const data = await logsRes.json()
        setLogs(data.logs || [])
      }
      
      if (studentsRes.ok) {
        const data = await studentsRes.json()
        setStudents(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate 
        ? `/api/admin/email/templates/${editingTemplate.id}`
        : '/api/admin/email/templates'
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      })
      
      if (res.ok) {
        toast({ title: 'تم الحفظ', description: 'تم حفظ القالب بنجاح' })
        setShowTemplateForm(false)
        setEditingTemplate(null)
        resetTemplateForm()
        fetchData()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حفظ القالب' })
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return
    
    try {
      const res = await fetch(`/api/admin/email/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف القالب بنجاح' })
        fetchData()
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حذف القالب' })
    }
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      subjectAr: template.subjectAr || '',
      body: template.body,
      bodyAr: template.bodyAr || '',
      type: template.type,
      trigger: template.trigger || '',
      isActive: template.isActive,
      triggerOffset: template.triggerOffset || 0
    })
    setShowTemplateForm(true)
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      subjectAr: '',
      body: '',
      bodyAr: '',
      type: 'GENERAL',
      trigger: '',
      isActive: true,
      triggerOffset: 0
    })
  }

  const handleSendEmails = async () => {
    if (sendForm.recipients.length === 0 && sendForm.recipientFilter === 'custom') {
      toast({ variant: 'destructive', title: 'خطأ', description: 'اختر مستلمين على الأقل' })
      return
    }
    
    setSending(true)
    try {
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendForm)
      })
      
      const data = await res.json()
      if (res.ok) {
        toast({ 
          title: 'تم الإرسال', 
          description: `تم إرسال ${data.sent} رسالة بنجاح${data.failed > 0 ? `، فشل ${data.failed} رسالة` : ''}` 
        })
        fetchData()
      } else {
        throw new Error(data.error || 'Failed to send')
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إرسال الرسائل' })
    } finally {
      setSending(false)
    }
  }

  const getFilteredStudents = () => {
    switch (sendForm.recipientFilter) {
      case 'expired':
        return students.filter(s => s.subscriptionStatus === 'EXPIRED')
      case 'active':
        return students.filter(s => s.subscriptionStatus === 'ACTIVE')
      case 'trial':
        return students.filter(s => s.subscriptionStatus === 'TRIAL')
      case 'all':
        return students
      default:
        return students.filter(s => sendForm.recipients.includes(s.id))
    }
  }

  if (loading) {
    return (
      <AdminLayout activeTab="email">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeTab="email">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              أداة البريد الإلكتروني
            </h2>
            <p className="text-sm text-muted-foreground">
              إنشاء قوالب البريد وإرسالها للطلاب
            </p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">قوالب البريد</TabsTrigger>
            <TabsTrigger value="send">إرسال بريد</TabsTrigger>
            <TabsTrigger value="logs">سجل الرسائل</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {!showTemplateForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">القوالب المتاحة</h3>
                  <Button onClick={() => { resetTemplateForm(); setShowTemplateForm(true); }}>
                    <Plus className="w-4 h-4 ml-2" />
                    قالب جديد
                  </Button>
                </div>

                <div className="grid gap-4">
                  {templates.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد قوالب بريد حالياً</p>
                        <Button className="mt-4" onClick={() => setShowTemplateForm(true)}>
                          إنشاء أول قالب
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    templates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              {template.isSystem && (
                                <Badge variant="secondary">نظام</Badge>
                              )}
                              {template.isActive ? (
                                <Badge variant="default" className="bg-green-500">نشط</Badge>
                              ) : (
                                <Badge variant="destructive">غير نشط</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditTemplate(template)}
                                disabled={template.isSystem}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteTemplate(template.id)}
                                disabled={template.isSystem}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <CardDescription>
                            {template.subjectAr || template.subject}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {template.trigger && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {EMAIL_TRIGGERS.find(t => t.value === template.trigger)?.label}
                              </div>
                            )}
                            <Badge variant="outline">
                              {TEMPLATE_TYPES.find(t => t.value === template.type)?.label}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{editingTemplate ? 'تعديل القالب' : 'قالب جديد'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم القالب</Label>
                      <Input
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        placeholder="اسم داخلي للقالب"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع القالب</Label>
                      <select
                        className="w-full p-2 rounded-md border bg-background"
                        value={templateForm.type}
                        onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                      >
                        {TEMPLATE_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>عنوان البريد (إنجليزي)</Label>
                      <Input
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                        placeholder="Email Subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>عنوان البريد (عربي)</Label>
                      <Input
                        value={templateForm.subjectAr}
                        onChange={(e) => setTemplateForm({ ...templateForm, subjectAr: e.target.value })}
                        placeholder="عنوان البريد"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>محتوى البريد (HTML) - عربي</Label>
                    <Textarea
                      value={templateForm.bodyAr}
                      onChange={(e) => setTemplateForm({ ...templateForm, bodyAr: e.target.value })}
                      placeholder="<p>مرحباً {{userName}}،</p>"
                      rows={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>محتوى البريد (HTML) - إنجليزي</Label>
                    <Textarea
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                      placeholder="<p>Hello {{userName}},</p>"
                      rows={8}
                    />
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">المتغيرات المتاحة:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_VARIABLES.map(v => (
                        <Badge key={v.name} variant="outline" className="cursor-pointer">
                          {`{{${v.name}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>التفعيل التلقائي</Label>
                      <select
                        className="w-full p-2 rounded-md border bg-background"
                        value={templateForm.trigger}
                        onChange={(e) => setTemplateForm({ ...templateForm, trigger: e.target.value })}
                      >
                        <option value="">بدون تفعيل تلقائي</option>
                        {EMAIL_TRIGGERS.map(trigger => (
                          <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>توقيت الإرسال (ساعات)</Label>
                      <Input
                        type="number"
                        value={templateForm.triggerOffset}
                        onChange={(e) => setTemplateForm({ ...templateForm, triggerOffset: parseInt(e.target.value) || 0 })}
                        placeholder="-168 = قبل أسبوع"
                      />
                      <p className="text-xs text-muted-foreground">
                        سالب = قبل الحدث، موجب = بعد الحدث
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={templateForm.isActive}
                        onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
                      />
                      <Label>تفعيل القالب</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); resetTemplateForm(); }}>
                        إلغاء
                      </Button>
                      <Button onClick={handleSaveTemplate}>
                        حفظ القالب
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Send Email Tab */}
          <TabsContent value="send" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إرسال بريد جديد</CardTitle>
                <CardDescription>اختر القالب والمستلمين وأرسل البريد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اختر القالب</Label>
                  <select
                    className="w-full p-2 rounded-md border bg-background"
                    value={sendForm.templateId}
                    onChange={(e) => setSendForm({ ...sendForm, templateId: e.target.value })}
                  >
                    <option value="">بدون قالب (رسالة مخصصة)</option>
                    {templates.filter(t => t.isActive).map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                {!sendForm.templateId && (
                  <>
                    <div className="space-y-2">
                      <Label>عنوان البريد</Label>
                      <Input
                        value={sendForm.customSubject}
                        onChange={(e) => setSendForm({ ...sendForm, customSubject: e.target.value })}
                        placeholder="عنوان البريد"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>محتوى البريد (HTML)</Label>
                      <Textarea
                        value={sendForm.customBody}
                        onChange={(e) => setSendForm({ ...sendForm, customBody: e.target.value })}
                        placeholder="<p>محتوى البريد...</p>"
                        rows={8}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>تصفية المستلمين</Label>
                  <select
                    className="w-full p-2 rounded-md border bg-background"
                    value={sendForm.recipientFilter}
                    onChange={(e) => setSendForm({ ...sendForm, recipientFilter: e.target.value as any })}
                  >
                    <option value="all">جميع الطلاب ({students.length})</option>
                    <option value="active">المشتركون النشطون ({students.filter(s => s.subscriptionStatus === 'ACTIVE').length})</option>
                    <option value="trial">الفترة التجريبية ({students.filter(s => s.subscriptionStatus === 'TRIAL').length})</option>
                    <option value="expired">منتهية الاشتراك ({students.filter(s => s.subscriptionStatus === 'EXPIRED').length})</option>
                  </select>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    سيتم الإرسال إلى <span className="font-bold">{getFilteredStudents().length}</span> طالب
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSendEmails}
                  disabled={sending || (getFilteredStudents().length === 0)}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      إرسال البريد
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>سجل الرسائل</CardTitle>
                <CardDescription>آخر 50 رسالة تم إرسالها</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد رسائل مرسلة بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {log.status === 'SENT' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{log.email}</p>
                            <p className="text-sm text-muted-foreground">{log.subject}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant={log.status === 'SENT' ? 'default' : 'destructive'}>
                            {log.status === 'SENT' ? 'تم الإرسال' : 'فشل'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
