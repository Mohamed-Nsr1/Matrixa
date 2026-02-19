'use client'

import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Languages, 
  User, 
  GraduationCap,
  Calculator,
  FlaskConical,
  Globe,
  Clock,
  Check,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

// Types
interface Branch {
  id: string
  nameAr: string
  nameEn: string
  code: string
}

interface OnboardingData {
  studyLanguage: 'arabic' | 'english'
  fullName: string
  branchId: string
  specialization: 'science' | 'math' | null
  secondLanguage: 'french' | 'german'
  dailyStudyGoal: number
}

const STEPS = [
  { id: 'welcome', title: 'مرحباً', titleEn: 'Welcome' },
  { id: 'language', title: 'لغة الدراسة', titleEn: 'Study Language' },
  { id: 'name', title: 'الاسم', titleEn: 'Name' },
  { id: 'branch', title: 'الشعبة', titleEn: 'Branch' },
  { id: 'specialization', title: 'التخصص', titleEn: 'Specialization' },
  { id: 'secondLanguage', title: 'اللغة الثانية', titleEn: 'Second Language' },
  { id: 'goal', title: 'الهدف اليومي', titleEn: 'Daily Goal' },
  { id: 'complete', title: 'تم', titleEn: 'Complete' }
]

export default function OnboardingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    studyLanguage: 'arabic',
    fullName: '',
    branchId: '',
    specialization: null,
    secondLanguage: 'french',
    dailyStudyGoal: 120
  })

  // Check auth and onboarding status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const result = await res.json()
        
        if (!result.success) {
          // Not authenticated, redirect to login using full page navigation
          window.location.href = '/auth/login'
          return
        }
        
        if (result.user.onboardingCompleted) {
          // Already completed onboarding, redirect to dashboard using full page navigation
          window.location.href = '/dashboard'
          return
        }
        
        // Pre-fill name if available
        if (result.user.fullName) {
          setData(prev => ({ ...prev, fullName: result.user.fullName }))
        }
        
        setChecking(false)
      } catch {
        window.location.href = '/auth/login'
      }
    }
    
    checkAuth()
  }, []) // Remove router dependency

  // Fetch branches on mount
  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setBranches(res.data)
        }
      })
      .catch(() => {})
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return true
      case 'language':
        return !!data.studyLanguage
      case 'name':
        return data.fullName.trim().length >= 2
      case 'branch':
        return !!data.branchId
      case 'specialization':
        // Only required for scientific branch
        const selectedBranch = branches.find(b => b.id === data.branchId)
        if (selectedBranch?.code === 'scientific') {
          return !!data.specialization
        }
        return true
      case 'secondLanguage':
        return !!data.secondLanguage
      case 'goal':
        return data.dailyStudyGoal >= 30
      case 'complete':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    // Skip specialization step if not scientific
    if (STEPS[currentStep].id === 'branch') {
      const selectedBranch = branches.find(b => b.id === data.branchId)
      if (selectedBranch?.code !== 'scientific') {
        setCurrentStep(currentStep + 2) // Skip specialization
        return
      }
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    // Handle back from secondLanguage to branch (skip specialization if not scientific)
    if (STEPS[currentStep].id === 'secondLanguage') {
      const selectedBranch = branches.find(b => b.id === data.branchId)
      if (selectedBranch?.code !== 'scientific') {
        setCurrentStep(currentStep - 2) // Skip specialization
        return
      }
    }
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'تم الإعداد بنجاح!',
          description: 'مرحباً بك في Matrixa'
        })
        // Use full page navigation to ensure middleware sees new cookies
        window.location.href = '/dashboard'
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: result.error || 'حدث خطأ، أعد المحاولة'
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع'
      })
    } finally {
      setLoading(false)
    }
  }

  // Render current step content
  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet to-primary flex items-center justify-center mx-auto animate-pulse-glow">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">مرحباً بك في Matrixa!</h2>
              <p className="text-muted-foreground text-lg">
                دعنا نساعدك على البدء. سيستغرق هذا دقيقة واحدة فقط.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald" />
                14 يوم مجاناً
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald" />
                إلغاء في أي وقت
              </span>
            </div>
          </div>
        )

      case 'language':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Languages className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">لغة الدراسة</h2>
              <p className="text-muted-foreground">
                اختر اللغة التي تريد أن تظهر بها أسماء المواد والدروس
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setData({ ...data, studyLanguage: 'arabic' })}
                className={`p-6 rounded-xl border-2 transition-all ${
                  data.studyLanguage === 'arabic'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl font-bold block mb-1">العربية</span>
                <span className="text-sm text-muted-foreground">Arabic</span>
              </button>
              <button
                onClick={() => setData({ ...data, studyLanguage: 'english' })}
                className={`p-6 rounded-xl border-2 transition-all ${
                  data.studyLanguage === 'english'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl font-bold block mb-1">English</span>
                <span className="text-sm text-muted-foreground">الإنجليزية</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              يمكنك تغيير هذه الإعدادات لاحقاً من الإعدادات
            </p>
          </div>
        )

      case 'name':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ما اسمك؟</h2>
              <p className="text-muted-foreground">
                سنستخدم اسمك لتخصيص تجربتك
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                placeholder="أدخل اسمك الكامل"
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className="text-lg"
              />
            </div>
          </div>
        )

      case 'branch':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">اختر شعبتك</h2>
              <p className="text-muted-foreground">
                هذا سيحدد المواد الدراسية التي ستظهر لك
              </p>
            </div>
            <div className="grid gap-4">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => setData({ ...data, branchId: branch.id, specialization: null })}
                  className={`p-6 rounded-xl border-2 text-right transition-all ${
                    data.branchId === branch.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl font-bold block">
                    {data.studyLanguage === 'arabic' ? branch.nameAr : branch.nameEn}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {branch.code === 'scientific' ? 'علوم - رياضة' : 'أدبي'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'specialization':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FlaskConical className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">اختر تخصصك</h2>
              <p className="text-muted-foreground">
                هذا سيحدد المواد العلمية التي ستدرسها
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setData({ ...data, specialization: 'science' })}
                className={`p-6 rounded-xl border-2 transition-all ${
                  data.specialization === 'science'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FlaskConical className="w-8 h-8 mb-2 text-emerald" />
                <span className="text-lg font-bold block">علمي علوم</span>
                <span className="text-sm text-muted-foreground">Science Track</span>
              </button>
              <button
                onClick={() => setData({ ...data, specialization: 'math' })}
                className={`p-6 rounded-xl border-2 transition-all ${
                  data.specialization === 'math'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Calculator className="w-8 h-8 mb-2 text-cyan" />
                <span className="text-lg font-bold block">علمي رياضة</span>
                <span className="text-sm text-muted-foreground">Math Track</span>
              </button>
            </div>
          </div>
        )

      case 'secondLanguage':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">اللغة الثانية</h2>
              <p className="text-muted-foreground">
                اختر اللغة الثانية التي تدرسها
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setData({ ...data, secondLanguage: 'french' })}
                className={`p-6 rounded-xl border-2 transition-all ${
                  data.secondLanguage === 'french'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-3xl font-bold block mb-1">🇫🇷</span>
                <span className="text-lg font-bold block">الفرنسية</span>
                <span className="text-sm text-muted-foreground">French</span>
              </button>
              <button
                onClick={() => setData({ ...data, secondLanguage: 'german' })}
                className={`p-6 rounded-xl border-2 transition-all ${
                  data.secondLanguage === 'german'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-3xl font-bold block mb-1">🇩🇪</span>
                <span className="text-lg font-bold block">الألمانية</span>
                <span className="text-sm text-muted-foreground">German</span>
              </button>
            </div>
          </div>
        )

      case 'goal':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">هدفك اليومي</h2>
              <p className="text-muted-foreground">
                كم ساعة تريد أن تذاكر يومياً؟
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setData({ ...data, dailyStudyGoal: Math.max(30, data.dailyStudyGoal - 30) })}
                >
                  -
                </Button>
                <div className="text-center px-8 py-4 bg-card rounded-xl border border-border min-w-[120px]">
                  <span className="text-4xl font-bold gradient-text">
                    {Math.floor(data.dailyStudyGoal / 60)}
                  </span>
                  <span className="text-xl text-muted-foreground mr-1">س</span>
                  <span className="text-2xl font-bold gradient-text">
                    {data.dailyStudyGoal % 60 > 0 ? ` ${data.dailyStudyGoal % 60}` : ''}
                  </span>
                  {data.dailyStudyGoal % 60 > 0 && (
                    <span className="text-lg text-muted-foreground mr-1">د</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setData({ ...data, dailyStudyGoal: Math.min(480, data.dailyStudyGoal + 30) })}
                >
                  +
                </Button>
              </div>
              
              {/* Quick presets */}
              <div className="flex flex-wrap justify-center gap-2">
                {[60, 120, 180, 240].map((mins) => (
                  <Button
                    key={mins}
                    variant={data.dailyStudyGoal === mins ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setData({ ...data, dailyStudyGoal: mins })}
                  >
                    {Math.floor(mins / 60)} {mins % 60 > 0 ? `و ${mins % 60} د` : 'ساعات'}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              يمكنك تعديل هذا لاحقاً من الإعدادات
            </p>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-emerald" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">أحسنت، {data.fullName}! 🎉</h2>
              <p className="text-muted-foreground text-lg">
                أنت جاهز للبدء. لنبدأ رحلتك الدراسية!
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-right">
              <h3 className="font-semibold mb-3">ملخص إعداداتك:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">لغة الدراسة:</span>
                  <span>{data.studyLanguage === 'arabic' ? 'العربية' : 'English'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الشعبة:</span>
                  <span>
                    {branches.find(b => b.id === data.branchId)?.nameAr || '-'}
                    {data.specialization && (
                      <span className="text-muted-foreground mr-1">
                        ({data.specialization === 'science' ? 'علوم' : 'رياضة'})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اللغة الثانية:</span>
                  <span>{data.secondLanguage === 'french' ? 'الفرنسية' : 'الألمانية'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الهدف اليومي:</span>
                  <span>{Math.floor(data.dailyStudyGoal / 60)} ساعة</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              الخطوة {currentStep + 1} من {STEPS.length}
            </span>
            <span className="text-sm font-medium">
              {STEPS[currentStep].title}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-24">
        <div className="w-full max-w-lg">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              السابق
            </Button>
            
            {STEPS[currentStep].id === 'complete' ? (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="bg-emerald hover:bg-emerald/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    ابدأ الآن
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                التالي
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
