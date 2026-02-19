'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Branch {
  id: string
  nameAr: string
  nameEn: string
  code: string
}

interface ImportResult {
  created: {
    branches: number
    subjects: number
    units: number
    lessons: number
  }
  updated: {
    branches: number
    subjects: number
    units: number
    lessons: number
  }
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  totalRows: number
  processedRows: number
}

interface CurriculumImportExportProps {
  branches: Branch[]
  onDataChanged: () => void
}

export function CurriculumImportExport({ branches, onDataChanged }: CurriculumImportExportProps) {
  const { toast } = useToast()
  
  // Export state
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx'>('xlsx')
  const [exportBranchId, setExportBranchId] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  
  // Import state
  const [importMode, setImportMode] = useState<'replace' | 'merge' | 'append'>('merge')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false)

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        ...(exportBranchId !== 'all' && { branchId: exportBranchId })
      })
      
      const response = await fetch(`/api/admin/curriculum/export?${params}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في التصدير')
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `curriculum.${exportFormat}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }
      
      // Download file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({ title: 'تم التصدير', description: `تم تحميل ${filename}` })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ في التصدير',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      })
    } finally {
      setIsExporting(false)
    }
  }, [exportFormat, exportBranchId, toast])

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }, [])

  // Validate file
  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    const validExtensions = ['.json', '.csv', '.xlsx', '.xls']
    
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )
    const hasValidType = validTypes.includes(file.type)
    
    if (!hasValidExtension && !hasValidType) {
      toast({
        variant: 'destructive',
        title: 'ملف غير صالح',
        description: 'يرجى اختيار ملف JSON أو CSV أو XLSX'
      })
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'ملف كبير جداً',
        description: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت'
      })
      return
    }
    
    setImportFile(file)
    setImportResult(null)
  }

  // Handle import
  const handleImport = useCallback(async () => {
    if (!importFile) return
    
    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const response = await fetch(`/api/admin/curriculum/import?mode=${importMode}`, {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      setImportProgress(100)
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل في الاستيراد')
      }
      
      setImportResult(data.result)
      onDataChanged()
      
      toast({
        title: 'تم الاستيراد',
        description: `تم معالجة ${data.result.processedRows} من ${data.result.totalRows} صف`
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ في الاستيراد',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      })
    } finally {
      setIsImporting(false)
    }
  }, [importFile, importMode, onDataChanged, toast])

  // Clear file
  const clearFile = useCallback(() => {
    setImportFile(null)
    setImportResult(null)
    setImportProgress(0)
  }, [])

  // Get format icon
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <FileJson className="w-4 h-4" />
      case 'csv':
        return <FileText className="w-4 h-4" />
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            تصدير المنهج
          </CardTitle>
          <CardDescription>
            قم بتصدير بيانات المنهج الدراسي إلى ملف
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>صيغة الملف</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'json' | 'csv' | 'xlsx')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (XLSX)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>الشعبة (اختياري)</Label>
            <Select value={exportBranchId} onValueChange={setExportBranchId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشعب</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 ml-2" />
            )}
            {isExporting ? 'جاري التصدير...' : 'تحميل الملف'}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            استيراد المنهج
          </CardTitle>
          <CardDescription>
            قم باستيراد بيانات المنهج الدراسي من ملف
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>وضع الاستيراد</Label>
            <Select value={importMode} onValueChange={(v) => setImportMode(v as 'replace' | 'merge' | 'append')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">
                  <div className="flex flex-col items-start">
                    <span>دمج</span>
                    <span className="text-xs text-muted-foreground">تحديث الموجود وإضافة الجديد</span>
                  </div>
                </SelectItem>
                <SelectItem value="append">
                  <div className="flex flex-col items-start">
                    <span>إضافة</span>
                    <span className="text-xs text-muted-foreground">إضافة بيانات جديدة فقط</span>
                  </div>
                </SelectItem>
                <SelectItem value="replace">
                  <div className="flex flex-col items-start">
                    <span className="text-red-400">استبدال</span>
                    <span className="text-xs text-muted-foreground">حذف الكامل وإضافة الجديد ⚠️</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* File Drop Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${importFile ? 'border-green-500 bg-green-500/5' : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".json,.csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
            
            {importFile ? (
              <div className="flex items-center justify-center gap-3">
                {getFormatIcon(importFile.name.split('.').pop() || '')}
                <div className="text-right">
                  <p className="font-medium">{importFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(importFile.size / 1024).toFixed(1)} كيلوبايت
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-auto"
                  onClick={(e) => { e.stopPropagation(); clearFile() }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  اسحب الملف هنا أو اضغط للاختيار
                </p>
                <p className="text-xs text-muted-foreground">
                  JSON, CSV, XLSX (الحد الأقصى 10MB)
                </p>
              </div>
            )}
          </div>
          
          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>جاري الاستيراد...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}
          
          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.errors.length > 0 ? 'destructive' : 'default'}>
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>نتيجة الاستيراد</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تم إنشاء: {importResult.created.branches + importResult.created.subjects + importResult.created.units + importResult.created.lessons}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>تم تحديث: {importResult.updated.branches + importResult.updated.subjects + importResult.updated.units + importResult.updated.lessons}</span>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="font-medium text-red-400">أخطاء ({importResult.errors.length}):</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <p key={i} className="text-xs">
                          صف {error.row}: {error.message}
                        </p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          و {importResult.errors.length - 5} أخطاء أخرى...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleImport}
            disabled={!importFile || isImporting}
            variant={importMode === 'replace' ? 'destructive' : 'default'}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 ml-2" />
            )}
            {isImporting ? 'جاري الاستيراد...' : 'استيراد الملف'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Help Section */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-4 h-4" />
            دليل الاستيراد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">الأعمدة المطلوبة</h4>
              <div className="flex flex-wrap gap-1">
                {[
                  'branch_code',
                  'branch_name_ar',
                  'branch_name_en',
                  'subject_name_ar',
                  'subject_name_en',
                  'unit_name_ar',
                  'unit_name_en',
                  'lesson_name_ar',
                  'lesson_name_en'
                ].map((col) => (
                  <Badge key={col} variant="secondary" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">أعمدة اختيارية</h4>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">order</Badge>
                <Badge variant="outline" className="text-xs">lesson_duration</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">أنماط الاستيراد</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>دمج:</strong> يحدث الموجود ويضيف الجديد</li>
                <li><strong>إضافة:</strong> يضيف جديد فقط بدون تعديل</li>
                <li><strong>استبدال:</strong> يحذف الكامل ويستورد (خطر)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
