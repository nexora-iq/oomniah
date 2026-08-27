import { Link } from 'react-router-dom';
import React, { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' 
    });
  }, []);

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', padding: '130px 5% 80px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>🔒</div>
          <h1 style={{ color: '#dc2626', fontSize: '36px', fontWeight: '900', margin: '0 0 10px 0' }}>سياسة الخصوصية</h1>
          <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 15px 0' }}>نحن في منصة أمنية نولي حماية بياناتك وصورك أهمية قصوى.</p>
          <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '6px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
            آخر تحديث: 27 أغسطس 2026
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #0ea5e9', paddingRight: '10px', marginBottom: '15px' }}>
              1. سرية الروابط والصور
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              كل هدية يتم إنشاؤها على منصتنا تمتلك رابطاً سرياً وخاصاً (Unique URL). لا يتم أرشفة هذه الروابط في محركات البحث (مثل جوجل)، ولا يمكن لأي شخص الوصول إلى الهدية أو مشاهدة الصور والرسائل إلا إذا قمت بمشاركة الرابط معه شخصياً.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #0ea5e9', paddingRight: '10px', marginBottom: '15px' }}>
              2. المعلومات التي نجمعها
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              لإتمام طلبك، نقوم فقط بجمع المعلومات الضرورية لتصميم الثيم، والتي تشمل: الأسماء، الرسائل النصية، الصور (إن تطلبت الباقة ذلك)، والملفات الصوتية. لا نطلب أي معلومات بنكية أو كلمات مرور.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #0ea5e9', paddingRight: '10px', marginBottom: '15px' }}>
              3. الاحتفاظ بالبيانات وحذفها
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              يتم الاحتفاظ ببيانات هديتك على خوادمنا السحابية الآمنة وفقاً لمدة الباقة التي قمت باختيارها (يومي، أسبوعي، شهري، الخ). بمجرد انتهاء مدة الباقة (وعدم التجديد)، يتم حذف الصور والبيانات تلقائياً وبشكل نهائي من نظامنا لحماية خصوصيتك.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #0ea5e9', paddingRight: '10px', marginBottom: '15px' }}>
              4. عدم مشاركة البيانات
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              نتعهد بعدم بيع أو تأجير أو مشاركة صورك وبياناتك مع أي طرف ثالث تحت أي ظرف من الظروف. خصوصيتك هي رأس مال منصتنا.
            </p>
          </section>

          {/* 🌟 البند المضاف (تعديل السياسة حصراً من مدير منصة أمنية) */}
          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #0ea5e9', paddingRight: '10px', marginBottom: '15px' }}>
              5. تعديل سياسة الخصوصية
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              تحتفظ الإدارة العليا لمنصة "أمنية" وحدها بالحق في تعديل، تحديث، أو تغيير بنود سياسة الخصوصية في أي وقت تراه مناسباً. يُعتبر استمرارك في استخدام خدماتنا بعد نشر أي تعديلات قبولاً تاماً وموافقة صريحة على السياسة المحدثة.
            </p>
          </section>

        </div>

        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <Link to="/" style={{ display: 'inline-block', background: '#f1f5f9', color: '#1e293b', textDecoration: 'none', padding: '12px 30px', borderRadius: '10px', fontWeight: 'bold', border: '1px solid #cbd5e1', transition: '0.3s' }}>
            العودة للرئيسية 🏠
          </Link>
        </div>

      </div>
    </div>
  );
}