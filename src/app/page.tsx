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
import { useEffect, useState } from 'react'

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Clock, Calendar, Target, Brain, Notebook, BarChart3, 
  Sparkles, Zap, Star, Heart, Trophy, BookOpen, 
  GraduationCap, Lightbulb, Rocket, Award
}

interface LandingPageContent {
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
  stat2Value: string | null
  stat2Label: string | null
  stat3Value: string | null
  stat3Label: string | null
  stat4Value: string | null
  stat4Label: string | null
  featuresTitle: string | null
  featuresSubtitle: string | null
  ctaTitle: string | null
  ctaSubtitle: string | null
  ctaButtonText: string | null
  footerText: string | null
}

interface Feature {
  id: string
  title: string
  titleEn: string | null
  description: string
  descriptionEn: string | null
  icon: string
  color: string
}

// Default content fallback
const defaultContent: LandingPageContent = {
  heroTitle: 'ادرس بذكاء،',
  heroTitleEn: 'Study Smart,',
  heroSubtitle: 'تطبيق المذاكرة الذكي الذي يساعدك على التغلب على تشتت الانتباه، وتنظيم وقتك، وتحقيق أهدافك الدراسية.',
  heroSubtitleEn: 'The smart study app that helps you overcome distractions, organize your time, and achieve your academic goals.',
  heroCtaText: 'ابدأ تجربتك المجانية',
  heroCtaTextEn: 'Start Your Free Trial',
  badgeText: 'مصمم خصيصاً لطلاب الثانوية المصرية',
  badgeTextEn: 'Designed for Egyptian High School Students',
  stat1Value: '10K+',
  stat1Label: 'طالب نشط',
  stat2Value: '50K+',
  stat2Label: 'ساعة مذاكرة',
  stat3Value: '95%',
  stat3Label: 'رضا المستخدمين',
  stat4Value: '4.9',
  stat4Label: 'تقييم التطبيق',
  featuresTitle: 'كل ما تحتاجه للتفوق',
  featuresSubtitle: 'أدوات مصممة بعناية لمساعدتك على المذاكرة بفعالية',
  ctaTitle: 'جاهز تبدأ رحلتك؟',
  ctaSubtitle: 'انضم لآلاف الطلاب الذين يستخدمون Matrixa لتحسين أدائهم الدراسي',
  ctaButtonText: 'ابدأ الآن مجاناً',
  footerText: '© 2024 Matrixa. جميع الحقوق محفوظة.',
}

const defaultFeatures: Feature[] = [
  { id: '1', title: 'تخلص من ضياع الوقت', titleEn: 'No More Time Blindness', description: 'مؤقت بومودورو ذكي يساعدك على التركيز وقياس وقت المذاكرة الفعلي', descriptionEn: 'Smart Pomodoro timer helps you focus and track actual study time', icon: 'Clock', color: 'text-cyan' },
  { id: '2', title: 'مخطط أسبوعي ذكي', titleEn: 'Smart Weekly Planner', description: 'نظم دروسك ومواعيد السنتر في مكان واحد مع سحب وإفلات سهل', descriptionEn: 'Organize lessons and center schedules in one place with easy drag & drop', icon: 'Calendar', color: 'text-violet' },
  { id: '3', title: 'ركز على الأهم', titleEn: 'Focus on What Matters', description: 'اقتراحات ذكية للمواد التي تحتاج مذاكرة أكثر بناءً على تقدمك', descriptionEn: 'Smart suggestions for subjects that need more study based on your progress', icon: 'Target', color: 'text-emerald' },
  { id: '4', title: 'تغلب على التشتت', titleEn: 'Beat Distraction', description: 'واجهة هادئة وخالية من المقاطعات مصممة خصيصاً لطلاب الثانوية', descriptionEn: 'Calm, distraction-free interface designed specifically for high school students', icon: 'Brain', color: 'text-pink' },
  { id: '5', title: 'ملاحظات منظمة', titleEn: 'Organized Notes', description: 'اكتب ملاحظاتك واربطها بالمواد والدروس لسهولة الرجوع إليها', descriptionEn: 'Write notes and link them to subjects and lessons for easy reference', icon: 'Notebook', color: 'text-amber' },
  { id: '6', title: 'تتبع تقدمك', titleEn: 'Track Your Progress', description: 'إحصائيات ورسوم بيانية توضح مستوى إنجازك في كل مادة', descriptionEn: 'Statistics and charts showing your achievement level in each subject', icon: 'BarChart3', color: 'text-blue' },
]

export default function LandingPage() {
  const [content, setContent] = useState<LandingPageContent>(defaultContent)
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/landing-page')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.content) {
            setContent({ ...defaultContent, ...data.content })
          }
          if (data.features && data.features.length > 0) {
            setFeatures(data.features)
          }
        }
      })
      .catch(() => {
        // Use defaults on error
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { value: content.stat1Value, label: content.stat1Label },
    { value: content.stat2Value, label: content.stat2Label },
    { value: content.stat3Value, label: content.stat3Label },
    { value: content.stat4Value, label: content.stat4Label },
  ].filter(s => s.value && s.label)

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
          {content.badgeText && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6 animate-fade-in-up">
              <Sparkles className="w-4 h-4" />
              <span>{content.badgeText}</span>
            </div>
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {content.heroTitle}
            <br />
            <span className="gradient-text">ابقَ مركزاً</span>
          </h1>
          
          {content.heroSubtitle && (
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {content.heroSubtitle}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8">
              <Link href="/auth/register">
                {content.heroCtaText || 'ابدأ تجربتك المجانية'}
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
      {stats.length > 0 && (
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
      )}

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {content.featuresTitle || 'كل ما تحتاجه للتفوق'}
            </h2>
            {content.featuresSubtitle && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {content.featuresSubtitle}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || Star
              return (
                <div 
                  key={feature.id || index}
                  className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover"
                >
                  <div className={`w-12 h-12 rounded-xl bg-primary/10 ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
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
              {content.ctaTitle || 'جاهز تبدأ رحلتك؟'}
            </h2>
            {content.ctaSubtitle && (
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                {content.ctaSubtitle}
              </p>
            )}
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8 animate-pulse-glow">
              <Link href="/auth/register">
                {content.ctaButtonText || 'ابدأ الآن مجاناً'}
                <ChevronLeft className="w-5 h-5 mr-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>{content.footerText || '© 2024 Matrixa. جميع الحقوق محفوظة.'}</p>
        </div>
      </footer>
    </div>
  )
}
