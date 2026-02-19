'use client'

import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="glass sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
              <span>العودة</span>
            </Link>

            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">شروط الاستخدام</h1>
            </div>

            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card rounded-2xl border border-border p-8">
            
            <div className="prose prose-invert max-w-none text-right" dir="rtl">
              <h2 className="text-xl font-bold mb-4 text-foreground">شروط الاستخدام - Matrixa</h2>
              <p className="text-muted-foreground mb-6">آخر تحديث: يناير 2025</p>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">1. قبول الشروط</h3>
                <p className="text-muted-foreground leading-relaxed">
                  باستخدامك لتطبيق Matrixa، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام التطبيق.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">2. وصف الخدمة</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Matrixa هو تطبيق تعليمي مصمم لمساعدة طلاب الثانوية العامة في مصر على تنظيم دراستهم، وإدارة وقتهم، وتتبع تقدمهم الأكاديمي. الخدمة تشمل جدولة المهام، وضع أهداف دراسية، نظام ملاحظات، ومؤقت التركيز.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">3. التسجيل والحساب</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
                  <li>يجب تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                  <li>أنت مسؤول عن الحفاظ على سرية كلمة مرورك</li>
                  <li>لا يجوز مشاركة حسابك مع الآخرين</li>
                  <li>يجب إخطارنا فوراً في حالة الاختراق أو الاستخدام غير المصرح به</li>
                  <li>التسجيل يتطلب رمز دعوة في حالة تفعيل هذه الميزة</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">4. الاشتراك والدفع</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
                  <li>الخدمة تعمل بنظام الاشتراك الشهري/الربعي/السنوي</li>
                  <li>فترة تجريبية مجانية متاحة للمستخدمين الجدد</li>
                  <li>جميع المدفوعات تتم بشكل آمن عبر بوابات الدفع المعتمدة</li>
                  <li>لا يتم استرداد رسوم الاشتراك بعد الدفع</li>
                  <li>يمكن إلغاء الاشتراك في أي وقت من إعدادات الحساب</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">5. الاستخدام المقبول</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">تتعهد بعدم:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
                  <li>استخدام التطبيق لأي غرض غير قانوني</li>
                  <li>محاولة اختراق أو إتلاف أنظمة التطبيق</li>
                  <li>نشر محتوى مسيء أو غير لائق</li>
                  <li>إنشاء حسابات متعددة للتحايل على النظام</li>
                  <li>مشاركة رموز الدعوة بشكل غير مصرح به</li>
                  <li>استخدام برامج آلية أو بوتات للتفاعل مع التطبيق</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">6. المحتوى</h3>
                <p className="text-muted-foreground leading-relaxed">
                  أنت تحتفظ بملكية المحتوى الذي تنشئه (ملاحظات، مهام). نحن نحتفظ بالحق في إزالة أي محتوى ينتهك هذه الشروط. المنهج الدراسي والبيانات التعليمية ملك لـ Matrixa ولا يجوز نسخها أو توزيعها.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">7. حقوق الملكية الفكرية</h3>
                <p className="text-muted-foreground leading-relaxed">
                  جميع حقوق الملكية الفكرية في التطبيق، بما في ذلك التصميم، الكود، العلامات التجارية، والمحتوى، ملك لـ Matrixa. لا يجوز نسخ أو تعديل أو توزيع أي جزء من التطبيق دون إذن مسبق.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">8. الخصوصية</h3>
                <p className="text-muted-foreground leading-relaxed">
                  استخدامنا لبياناتك الشخصية يخضع لـ <Link href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link> الخاصة بنا. باستخدام التطبيق، توافق على ممارسات جمع البيانات الموضحة فيها.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">9. إخلاء المسؤولية</h3>
                <p className="text-muted-foreground leading-relaxed">
                  التطبيق مقدمة "كما هي" دون أي ضمانات. نحن لا نضمن النتائج الأكاديمية. لسنا مسؤولين عن أي خسائر ناتجة عن استخدام التطبيق أو عدم القدرة على الوصول إليه.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">10. التعليق والإنهاء</h3>
                <p className="text-muted-foreground leading-relaxed">
                  نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة انتهاك هذه الشروط، دون إشعار مسبق ودون استرداد المبالغ المدفوعة. يمكنك إنهاء حسابك في أي وقت من إعدادات التطبيق.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">11. التعديلات</h3>
                <p className="text-muted-foreground leading-relaxed">
                  نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنخطرك بالتعديلات الجوهرية عبر التطبيق أو البريد الإلكتروني. استمرار استخدامك للتطبيق بعد التعديلات يعني قبولك لها.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-foreground">12. القانون الحاكم</h3>
                <p className="text-muted-foreground leading-relaxed">
                  تخضع هذه الشروط وتفسر وفقاً لقوانين جمهورية مصر العربية. أي نزاعات تنشأ عن هذه الشروط تختص بها محاكم القاهرة.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  للتواصل والاستفسارات: legal@matrixa.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
