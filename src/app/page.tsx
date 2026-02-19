'use client'

import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  Target, 
  Brain,  
  Sparkles,
  Calendar,
  BarChart3,
  Notebook,
  Zap,
  ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Feature cards data
const features = [
  {
    icon: Clock,
    title: 'تخلص من ضياع الوقت',
    titleEn: 'No More Time Blindness',
    description: 'مؤقت بومودورو ذكي يساعدك على التركيز وقياس وقت المذاكرة الفعلي',
    color: 'text-cyan'
  },
  {
    icon: Calendar,
    title: 'مخطط أسبوعي ذكي',
    titleEn: 'Smart Weekly Planner',
    description: 'نظم دروسك ومواعيد السنتر في مكان واحد مع سحب وإفلات سهل',
    color: 'text-violet'
  },
  {
    icon: Target,
    title: 'ركز على الأهم',
    titleEn: 'Focus on What Matters',
    description: 'اقتراحات ذكية للمواد التي تحتاج مذاكرة أكثر بناءً على تقدمك',
    color: 'text-emerald'
  },
  {
    icon: Brain,
    title: 'تغلب على التشتت',
    titleEn: 'Beat Distraction',
    description: 'واجهة هادئة وخالية من المقاطعات مصممة خصيصاً لطلاب الثانوية',
    color: 'text-pink'
  },
  {
    icon: Notebook,
    title: 'ملاحظات منظمة',
    titleEn: 'Organized Notes',
    description: 'اكتب ملاحظاتك واربطها بالمواد والدروس لسهولة الرجوع إليها',
    color: 'text-amber'
  },
  {
    icon: BarChart3,
    title: 'تتبع تقدمك',
    titleEn: 'Track Your Progress',
    description: 'إحصائيات ورسوم بيانية توضح مستوى إنجازك في كل مادة',
    color: 'text-blue'
  }
]

// Stats data
const stats = [
  { value: '10K+', label: 'طالب نشط' },
  { value: '50K+', label: 'ساعة مذاكرة' },
  { value: '95%', label: 'رضا المستخدمين' },
  { value: '4.9', label: 'تقييم التطبيق' }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Matrixa</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/auth/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/auth/register">
                ابدأ الآن
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>مصمم خصيصاً لطلاب الثانوية المصرية</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            ادرس بذكاء،
            <br />
            <span className="gradient-text">ابقَ مركزاً</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            تطبيق المذاكرة الذكي الذي يساعدك على التغلب على تشتت الانتباه، 
            وتنظيم وقتك، وتحقيق أهدافك الدراسية.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8">
              <Link href="/auth/register">
                ابدأ تجربتك المجانية
                <ChevronLeft className="w-5 h-5 mr-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-border text-lg">
              <Link href="/auth/login">لديك حساب؟ سجل دخولك</Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            14 يوم تجربة مجانية • بدون بطاقة ائتمان
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              كل ما تحتاجه للتفوق
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              أدوات مصممة بعناية لمساعدتك على المذاكرة بفعالية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-primary/10 ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')] opacity-5" />
            
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              جاهز تبدأ رحلتك؟
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              انضم لآلاف الطلاب الذين يستخدمون Matrixa لتحسين أدائهم الدراسي
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8 animate-pulse-glow">
              <Link href="/auth/register">
                ابدأ الآن مجاناً
                <ChevronLeft className="w-5 h-5 mr-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 Matrixa. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  )
}
