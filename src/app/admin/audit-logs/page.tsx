'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  User,
  Activity,
  Clock
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface AuditLog {
  id: string
  userId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  oldValue: string | null
  newValue: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    email: string
    fullName: string | null
    role: string
  } | null
}

const actionColors: Record<string, string> = {
  // User actions
  'USER_LOGIN': 'bg-blue-500/20 text-blue-400',
  'USER_LOGOUT': 'bg-gray-500/20 text-gray-400',
  'USER_REGISTER': 'bg-green-500/20 text-green-400',
  'USER_BAN': 'bg-red-500/20 text-red-400',
  'USER_UNBAN': 'bg-emerald-500/20 text-emerald-400',
  'USER_PASSWORD_RESET': 'bg-amber-500/20 text-amber-400',
  'USER_FORCE_LOGOUT': 'bg-orange-500/20 text-orange-400',
  // Admin actions
  'ADMIN_USER_EDIT': 'bg-violet-500/20 text-violet-400',
  'ADMIN_USER_DELETE': 'bg-red-500/20 text-red-400',
  'ADMIN_STREAK_EDIT': 'bg-cyan-500/20 text-cyan-400',
  'ADMIN_STREAK_RESET': 'bg-pink-500/20 text-pink-400',
  'ADMIN_PLAN_CREATE': 'bg-green-500/20 text-green-400',
  'ADMIN_PLAN_EDIT': 'bg-blue-500/20 text-blue-400',
  'ADMIN_PLAN_DELETE': 'bg-red-500/20 text-red-400',
  'ADMIN_SETTINGS_UPDATE': 'bg-amber-500/20 text-amber-400',
  // Default
  'default': 'bg-gray-500/20 text-gray-400'
}

const actionLabels: Record<string, string> = {
  'USER_LOGIN': 'تسجيل دخول',
  'USER_LOGOUT': 'تسجيل خروج',
  'USER_REGISTER': 'تسجيل جديد',
  'USER_BAN': 'حظر مستخدم',
  'USER_UNBAN': 'إلغاء حظر',
  'USER_PASSWORD_RESET': 'إعادة تعيين كلمة المرور',
  'USER_FORCE_LOGOUT': 'تسجيل خروج إجباري',
  'ADMIN_USER_EDIT': 'تعديل مستخدم',
  'ADMIN_USER_DELETE': 'حذف مستخدم',
  'ADMIN_STREAK_EDIT': 'تعديل streak',
  'ADMIN_STREAK_RESET': 'إعادة تعيين streak',
  'ADMIN_PLAN_CREATE': 'إنشاء خطة',
  'ADMIN_PLAN_EDIT': 'تعديل خطة',
  'ADMIN_PLAN_DELETE': 'حذف خطة',
  'ADMIN_SETTINGS_UPDATE': 'تحديث الإعدادات'
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/audit-logs')
        const data = await res.json()

        if (data.success) {
          setLogs(data.logs)
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  if (loading) {
    return (
      <AdminLayout activeTab="audit-logs">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeTab="audit-logs">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">سجل النشاطات</h2>
          <p className="text-muted-foreground">تتبع جميع النشاطات في النظام</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي النشاطات</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تسجيلات دخول</CardTitle>
              <User className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {logs.filter(l => l.action === 'USER_LOGIN').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجراءات حظر</CardTitle>
              <Shield className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {logs.filter(l => l.action.includes('BAN')).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">آخر 24 ساعة</CardTitle>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                {logs.filter(l => {
                  const logDate = new Date(l.createdAt)
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  return logDate > yesterday
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>آخر 200 نشاط</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد نشاطات مسجلة</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log) => {
                  const colorClass = actionColors[log.action] || actionColors.default
                  const label = actionLabels[log.action] || log.action
                  
                  return (
                    <div key={log.id} className="py-4 hover:bg-muted/50 transition-colors -mx-6 px-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {/* Action Badge */}
                          <Badge variant="secondary" className={colorClass}>
                            {label}
                          </Badge>
                          
                          <div>
                            {/* User Info */}
                            {log.user && (
                              <p className="font-medium text-sm">
                                {log.user.fullName || log.user.email}
                                <span className="text-muted-foreground mr-2">
                                  ({log.user.role === 'ADMIN' ? 'مدير' : 'طالب'})
                                </span>
                              </p>
                            )}
                            
                            {/* Entity Info */}
                            {log.entityType && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {log.entityType}: {log.entityId}
                              </p>
                            )}
                            
                            {/* IP Address */}
                            {log.ipAddress && (
                              <p className="text-xs text-muted-foreground mt-1">
                                IP: {log.ipAddress}
                              </p>
                            )}
                            
                            {/* Changes */}
                            {log.oldValue && log.newValue && (
                              <details className="mt-2">
                                <summary className="text-xs text-primary cursor-pointer hover:underline">
                                  عرض التغييرات
                                </summary>
                                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                                  <p className="text-red-400">قبل: {log.oldValue}</p>
                                  <p className="text-green-400 mt-1">بعد: {log.newValue}</p>
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                        
                        {/* Timestamp */}
                        <div className="text-left text-xs text-muted-foreground whitespace-nowrap">
                          <p>{format(new Date(log.createdAt), 'dd MMM', { locale: ar })}</p>
                          <p>{format(new Date(log.createdAt), 'HH:mm:ss')}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
