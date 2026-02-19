'use client'

import Link from 'next/link'
import { ChevronRight, Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">سياسة الخصوصية</h1>
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
              <h2 className="text-xl font-bold mb-4 text-foreground">سياسة الخصوصية - Matrixa</h2>
              <p className="text-muted-foreground mb-6">آخر تحديث: يناير 2025</p>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">1. مقدمة</h3>
                <p className="text-muted-foreground leading-relaxed">
                  مرحباً بكم في Matrixa. نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيقنا.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">2. البيانات التي نجمعها</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">نجمع البيانات التالية عند استخدامك للتطبيق:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
                  <li>الاسم الكامل و البريد الإلكتروني</li>
                  <li>معلومات الشعبة الدراسية والتخصص</li>
                  <li>تقدمك في المواد والدروس</li>
                  <li>ملاحظاتك وبيانات الجدول الشخصي</li>
                  <li>معلومات الدفع والاشتراك (عند الاشتراك)</li>
                  <li>بيانات الجهاز للمصادقة الأمنية</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">3. كيف نستخدم بياناتك</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">نستخدم بياناتك للأغراض التالية:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
                  <li>توفير خدمات التطبيق الأساسية</li>
                  <li>تخصيص تجربتك الدراسية</li>
                  <li>تتبع تقدمك وعرض الإحصائيات</li>
                  <li>معالجة المدفوعات وإدارة الاشتراكات</li>
                  <li>تحسين جودة الخدمة</li>
                  <li>إرسال إشعارات مهمة متعلقة بحسابك</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">4. حماية البيانات</h3>
                <p className="text-muted-foreground leading-relaxed">
                  نتخذ إجراءات أمنية صارمة لحماية بياناتك، بما في ذلك التشفير، والمصادقة الآمنة، وتقييد الوصول للبيانات الحساسة. نستخدم بروتوكولات HTTPS و JWT tokens آمنة لحماية اتصالاتك.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">5. مشاركة البيانات</h3>
                <p className="text-muted-foreground leading-relaxed">
                  لا نبيع أو نشارك بياناتك الشخصية مع أطراف ثالثة إلا في الحالات الضرورية لتقديم الخدمة (مثل معالجة المدفوعات) أو عند الطلب القانوني.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">6. لوحة المتصدرين</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ظهورك في لوحة المتصدرين اختياري. يمكنك اختيار إخفاء نفسك من اللوحة في أي وقت من إعدادات حسابك. البيانات المعروضة تقتصر على النقاط والإنجازات دون معلومات شخصية.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">7. حقوقك</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">لديك الحق في:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
                  <li>الوصول إلى بياناتك الشخصية</li>
                  <li>تصحيح بياناتك غير الدقيقة</li>
                  <li>طلب حذف حسابك وجميع بياناتك</li>
                  <li>إلغاء اشتراكك في أي وقت</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">8. ملفات تعريف الارتباط</h3>
                <p className="text-muted-foreground leading-relaxed">
                  نستخدم ملفات تعريف الارتباط (Cookies) للحفاظ على تسجيل دخولك وتحسين تجربتك. يمكنك إدارة إعدادات ملفات تعريف الارتباط من متصفحك.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">9. التحديثات</h3>
                <p className="text-muted-foreground leading-relaxed">
                  قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-foreground">10. اتصل بنا</h3>
                <p className="text-muted-foreground leading-relaxed">
                  إذا كان لديك أي استفسارات حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: privacy@matrixa.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
