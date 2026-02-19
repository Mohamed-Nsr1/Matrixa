'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Plus, Edit, Trash2, ChevronRight, BookOpen, Layers, FileText, Import, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CurriculumImportExport } from '@/components/admin/CurriculumImportExport'

interface Branch {
  id: string
  nameAr: string
  nameEn: string
  code: string
  isActive: boolean
  _count?: { subjects: number; users: number }
}

interface Subject {
  id: string
  nameAr: string
  nameEn: string
  branch: { nameAr: string }
  xpPerLesson: number
  isActive: boolean
  _count?: { units: number }
}

interface Unit {
  id: string
  nameAr: string
  nameEn: string
  subject: { nameAr: string }
  isActive: boolean
  _count?: { lessons: number }
}

interface Lesson {
  id: string
  nameAr: string
  nameEn: string
  unit: { nameAr: string; subject: { nameAr: string } }
  duration: number | null
  isActive: boolean
  _count?: { lessonProgress: number }
}

export default function AdminCurriculumPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('branches')
  const [isImportExportOpen, setIsImportExportOpen] = useState(false)
  
  // Data states
  const [branches, setBranches] = useState<Branch[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  
  // Dialog states
  const [showDialog, setShowDialog] = useState(false)
  const [dialogType, setDialogType] = useState<'branch' | 'subject' | 'unit' | 'lesson'>('branch')
  const [editingItem, setEditingItem] = useState<unknown>(null)
  
  // Form state
  const [form, setForm] = useState<Record<string, unknown>>({
    nameAr: '',
    nameEn: '',
    branchId: '',
    subjectId: '',
    unitId: '',
    code: '',
    xpPerLesson: 10,
    duration: 30,
    isActive: true
  })

  const fetchData = useCallback(async () => {
    try {
      const [branchesRes, subjectsRes, unitsRes, lessonsRes] = await Promise.all([
        fetch('/api/admin/curriculum/branches'),
        fetch('/api/admin/curriculum/subjects'),
        fetch('/api/admin/curriculum/units'),
        fetch('/api/admin/curriculum/lessons')
      ])

      const branchesData = await branchesRes.json()
      const subjectsData = await subjectsRes.json()
      const unitsData = await unitsRes.json()
      const lessonsData = await lessonsRes.json()

      if (branchesData.success) setBranches(branchesData.branches)
      if (subjectsData.success) setSubjects(subjectsData.subjects)
      if (unitsData.success) setUnits(unitsData.units)
      if (lessonsData.success) setLessons(lessonsData.lessons)
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    }
  }, [toast])

  useEffect(() => {
    // Fetch data on mount
    void fetchData()
  }, [fetchData])

  const openCreateDialog = (type: 'branch' | 'subject' | 'unit' | 'lesson') => {
    setDialogType(type)
    setEditingItem(null)
    setForm({
      nameAr: '',
      nameEn: '',
      branchId: '',
      subjectId: '',
      unitId: '',
      code: '',
      xpPerLesson: 10,
      duration: 30,
      isActive: true
    })
    setShowDialog(true)
  }

  const openEditDialog = (type: 'branch' | 'subject' | 'unit' | 'lesson', item: Branch | Subject | Unit | Lesson) => {
    setDialogType(type)
    setEditingItem(item)
    const baseForm = {
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      isActive: item.isActive
    }
    
    if (type === 'branch') {
      const branch = item as Branch
      setForm({
        ...baseForm,
        branchId: '',
        subjectId: '',
        unitId: '',
        code: branch.code || '',
        xpPerLesson: 10,
        duration: 30
      })
    } else if (type === 'subject') {
      const subject = item as Subject
      setForm({
        ...baseForm,
        branchId: (item as Subject & { branchId?: string }).branchId || '',
        subjectId: '',
        unitId: '',
        code: '',
        xpPerLesson: subject.xpPerLesson || 10,
        duration: 30
      })
    } else if (type === 'unit') {
      setForm({
        ...baseForm,
        branchId: '',
        subjectId: (item as Unit & { subjectId?: string }).subjectId || '',
        unitId: '',
        code: '',
        xpPerLesson: 10,
        duration: 30
      })
    } else {
      const lesson = item as Lesson
      setForm({
        ...baseForm,
        branchId: '',
        subjectId: '',
        unitId: (item as Lesson & { unitId?: string }).unitId || '',
        code: '',
        xpPerLesson: 10,
        duration: lesson.duration || 30
      })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    const endpoints: Record<string, { create: string; update: string }> = {
      branch: { create: '/api/admin/curriculum/branches', update: `/api/admin/curriculum/branches/${(editingItem as { id: string })?.id}` },
      subject: { create: '/api/admin/curriculum/subjects', update: `/api/admin/curriculum/subjects/${(editingItem as { id: string })?.id}` },
      unit: { create: '/api/admin/curriculum/units', update: `/api/admin/curriculum/units/${(editingItem as { id: string })?.id}` },
      lesson: { create: '/api/admin/curriculum/lessons', update: `/api/admin/curriculum/lessons/${(editingItem as { id: string })?.id}` }
    }

    const endpoint = editingItem ? endpoints[dialogType].update : endpoints[dialogType].create
    
    try {
      const res = await fetch(endpoint, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: editingItem ? 'تم التحديث' : 'تم الإضافة' })
        fetchData()
        setShowDialog(false)
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحفظ' })
    }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return

    const endpoints: Record<string, string> = {
      branch: `/api/admin/curriculum/branches/${id}`,
      subject: `/api/admin/curriculum/subjects/${id}`,
      unit: `/api/admin/curriculum/units/${id}`,
      lesson: `/api/admin/curriculum/lessons/${id}`
    }

    try {
      const res = await fetch(endpoints[type], { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم الحذف' })
        fetchData()
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' })
    }
  }

  return (
    <AdminLayout activeTab="curriculum">
      <div className="space-y-6">
        {/* Import/Export Section */}
        <Collapsible open={isImportExportOpen} onOpenChange={setIsImportExportOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Import className="w-4 h-4" />
                استيراد / تصدير المنهج
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isImportExportOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <CurriculumImportExport 
              branches={branches} 
              onDataChanged={fetchData} 
            />
          </CollapsibleContent>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branches">الشعب</TabsTrigger>
            <TabsTrigger value="subjects">المواد</TabsTrigger>
            <TabsTrigger value="units">الوحدات</TabsTrigger>
            <TabsTrigger value="lessons">الدروس</TabsTrigger>
          </TabsList>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">الشعب الدراسية</h3>
              <Button onClick={() => openCreateDialog('branch')}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة شعبة
              </Button>
            </div>
            <div className="grid gap-4">
              {branches.map((branch) => (
                <div key={branch.id} className="p-4 rounded-xl border border-border bg-card flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{branch.nameAr} ({branch.nameEn})</p>
                      <p className="text-sm text-muted-foreground">
                        {branch._count?.subjects || 0} مواد • {branch._count?.users || 0} طالب
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                      {branch.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog('branch', branch)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete('branch', branch.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">المواد الدراسية</h3>
              <Button onClick={() => openCreateDialog('subject')}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة مادة
              </Button>
            </div>
            <div className="grid gap-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="p-4 rounded-xl border border-border bg-card flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-cyan" />
                    <div>
                      <p className="font-medium">{subject.nameAr} ({subject.nameEn})</p>
                      <p className="text-sm text-muted-foreground">
                        {subject.branch.nameAr} • {subject._count?.units || 0} وحدات • {subject.xpPerLesson} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={subject.isActive ? 'default' : 'secondary'}>
                      {subject.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog('subject', subject)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete('subject', subject.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">الوحدات</h3>
              <Button onClick={() => openCreateDialog('unit')}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة وحدة
              </Button>
            </div>
            <div className="grid gap-4">
              {units.map((unit) => (
                <div key={unit.id} className="p-4 rounded-xl border border-border bg-card flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-violet" />
                    <div>
                      <p className="font-medium">{unit.nameAr} ({unit.nameEn})</p>
                      <p className="text-sm text-muted-foreground">
                        {unit.subject.nameAr} • {unit._count?.lessons || 0} دروس
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={unit.isActive ? 'default' : 'secondary'}>
                      {unit.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog('unit', unit)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete('unit', unit.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">الدروس</h3>
              <Button onClick={() => openCreateDialog('lesson')}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة درس
              </Button>
            </div>
            <div className="grid gap-4">
              {lessons.slice(0, 50).map((lesson) => (
                <div key={lesson.id} className="p-4 rounded-xl border border-border bg-card flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="w-5 h-5 text-emerald" />
                    <div>
                      <p className="font-medium">{lesson.nameAr}</p>
                      <p className="text-sm text-muted-foreground">
                        {lesson.unit.subject.nameAr} → {lesson.unit.nameAr}
                        {lesson.duration && ` • ${lesson.duration} دقيقة`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={lesson.isActive ? 'default' : 'secondary'}>
                      {lesson.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog('lesson', lesson)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete('lesson', lesson.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'تعديل' : 'إضافة'} {dialogType === 'branch' ? 'شعبة' : dialogType === 'subject' ? 'مادة' : dialogType === 'unit' ? 'وحدة' : 'درس'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم بالعربية</Label>
                <Input
                  value={form.nameAr as string}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية</Label>
                <Input
                  value={form.nameEn as string}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </div>
            </div>

            {dialogType === 'branch' && (
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input
                  value={form.code as string}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="scientific / literary"
                />
              </div>
            )}

            {dialogType === 'subject' && (
              <div className="space-y-2">
                <Label>الشعبة</Label>
                <Select value={form.branchId as string} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشعبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dialogType === 'unit' && (
              <div className="space-y-2">
                <Label>المادة</Label>
                <Select value={form.subjectId as string} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dialogType === 'lesson' && (
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select value={form.unitId as string} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الوحدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
