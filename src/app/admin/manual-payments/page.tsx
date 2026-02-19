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
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Eye,
  RefreshCw,
  Phone,
  User,
  CreditCard,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PaymentRequest {
  id: string
  amount: number
  paymentMethod: string
  senderPhone: string | null
  senderInstaPayUsername: string | null
  receiptImageUrl: string
  status: string
  adminNotes: string | null
  followUpMessage: string | null
  userResponse?: string | null
  additionalReceiptUrl?: string | null
  createdAt: string
  user: {
    id: string
    email: string
    fullName: string | null
    phone: string | null
  }
  plan: {
    nameAr: string
    price: number
    durationDays: number
  }
}

const PAYMENT_METHODS = [
  { id: 'VODAFONE_CASH', name: 'فودافون كاش' },
  { id: 'ETISALAT_CASH', name: 'اتصالات كاش' },
  { id: 'ORANGE_CASH', name: 'أورنج كاش' },
  { id: 'INSTAPAY', name: 'انستاباي' },
]

export default function AdminManualPaymentsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [followUpMessage, setFollowUpMessage] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const url = statusFilter !== 'all' 
        ? `/api/admin/manual-payments?status=${statusFilter}`
        : '/api/admin/manual-payments'
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (res.ok) {
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في تحميل البيانات'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject' | 'follow_up') => {
    if (!selectedRequest) return

    if (action === 'follow_up' && !followUpMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب كتابة رسالة المتابعة'
      })
      return
    }

    setActionLoading(true)

    try {
      const res = await fetch(`/api/admin/manual-payments/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes,
          followUpMessage: action === 'follow_up' ? followUpMessage : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'تم',
          description: data.message
        })
        setShowDialog(false)
        setSelectedRequest(null)
        setAdminNotes('')
        setFollowUpMessage('')
        fetchRequests()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500/10 text-yellow-500">قيد المراجعة</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-500/10 text-green-500">تم القبول</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-500/10 text-red-500">مرفوض</Badge>
      case 'NEEDS_INFO':
        return <Badge className="bg-orange-500/10 text-orange-500">يحتاج معلومات</Badge>
      case 'INFO_PROVIDED':
        return <Badge className="bg-blue-500/10 text-blue-500">تم الرد</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodName = (method: string) => {
    return PAYMENT_METHODS.find(m => m.id === method)?.name || method
  }

  const openRequestDetails = (request: PaymentRequest) => {
    setSelectedRequest(request)
    setAdminNotes(request.adminNotes || '')
    setFollowUpMessage('')
    setShowDialog(true)
  }

  // Stats
  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    needsInfo: requests.filter(r => r.status === 'NEEDS_INFO').length,
    infoProvided: requests.filter(r => r.status === 'INFO_PROVIDED').length,
    total: requests.length
  }

  return (
    <AdminLayout activeTab="manual-payments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              طلبات الدفع اليدوي
            </h2>
            <p className="text-sm text-muted-foreground">
              مراجعة والموافقة على طلبات الدفع
            </p>
          </div>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">قيد المراجعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.needsInfo}</p>
                  <p className="text-xs text-muted-foreground">تحتاج متابعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.infoProvided}</p>
                  <p className="text-xs text-muted-foreground">تم الرد</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Label>فلترة حسب الحالة:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل الطلبات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الطلبات</SelectItem>
              <SelectItem value="PENDING">قيد المراجعة</SelectItem>
              <SelectItem value="NEEDS_INFO">تحتاج متابعة</SelectItem>
              <SelectItem value="INFO_PROVIDED">تم الرد</SelectItem>
              <SelectItem value="APPROVED">تم القبول</SelectItem>
              <SelectItem value="REJECTED">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card 
                key={request.id} 
                className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => openRequestDetails(request)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {request.user.fullName || request.user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="font-bold text-lg">{request.amount} ج</p>
                        <p className="text-sm text-muted-foreground">
                          {request.plan.nameAr}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                      <Button variant="ghost" size="icon">
                        <Eye className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{getPaymentMethodName(request.paymentMethod)}</span>
                    <span>•</span>
                    <span>
                      {request.paymentMethod === 'INSTAPAY' 
                        ? request.senderInstaPayUsername 
                        : request.senderPhone}
                    </span>
                    <span>•</span>
                    <span>{new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Request Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>تفاصيل طلب الدفع</DialogTitle>
                <DialogDescription>
                  مراجعة طلب الدفع اليدوي
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">الحالة:</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>

                {/* User Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات المستخدم</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedRequest.user.fullName || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">البريد:</span>
                      <span>{selectedRequest.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedRequest.user.phone || 'غير محدد'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات الدفع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الخطة:</span>
                      <span>{selectedRequest.plan.nameAr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المبلغ:</span>
                      <span className="font-bold">{selectedRequest.amount} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المدة:</span>
                      <span>{selectedRequest.plan.durationDays} يوم</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">طريقة الدفع:</span>
                      <span>{getPaymentMethodName(selectedRequest.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {selectedRequest.paymentMethod === 'INSTAPAY' ? 'اسم المستخدم:' : 'رقم المرسل:'}
                      </span>
                      <span dir="ltr">
                        {selectedRequest.paymentMethod === 'INSTAPAY' 
                          ? selectedRequest.senderInstaPayUsername 
                          : selectedRequest.senderPhone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الطلب:</span>
                      <span>{new Date(selectedRequest.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Receipt Image */}
                <div className="space-y-2">
                  <Label>صورة الإيصال</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedRequest.receiptImageUrl}
                      alt="Receipt"
                      className="w-full max-h-96 object-contain bg-slate-900"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedRequest.receiptImageUrl, '_blank')}
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    فتح في نافذة جديدة
                  </Button>
                </div>

                {/* Follow-up Message (if exists) */}
                {selectedRequest.followUpMessage && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-sm font-medium text-orange-400 mb-1">رسالة المتابعة:</p>
                    <p className="text-sm">{selectedRequest.followUpMessage}</p>
                  </div>
                )}

                {/* User Response (if exists) */}
                {selectedRequest.userResponse && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-400 mb-1">رد المستخدم:</p>
                    <p className="text-sm">{selectedRequest.userResponse}</p>
                  </div>
                )}

                {/* Additional Receipt (if exists) */}
                {selectedRequest.additionalReceiptUrl && (
                  <div className="space-y-2">
                    <Label>إيصال إضافي</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={selectedRequest.additionalReceiptUrl}
                        alt="Additional Receipt"
                        className="w-full max-h-64 object-contain bg-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label>ملاحظات المشرف</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظات (اختياري)..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Follow-up Message Input */}
                <div className="space-y-2">
                  <Label>رسالة متابعة (لطلب معلومات إضافية)</Label>
                  <Textarea
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    placeholder="مثال: الصورة غير واضحة، يرجى إرسال صورة أوضح للإيصال..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Actions */}
                {['PENDING', 'NEEDS_INFO', 'INFO_PROVIDED'].includes(selectedRequest.status) && (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => handleAction('approve')}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      قبول وتفعيل
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction('reject')}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 ml-2" />
                      رفض
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction('follow_up')}
                      disabled={actionLoading || !followUpMessage.trim()}
                    >
                      <MessageSquare className="w-4 h-4 ml-2" />
                      متابعة
                    </Button>
                  </div>
                )}

                {selectedRequest.status === 'APPROVED' && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-500">تم قبول الطلب وتفعيل الاشتراك</p>
                  </div>
                )}

                {selectedRequest.status === 'REJECTED' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="font-medium text-red-500">تم رفض الطلب</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
