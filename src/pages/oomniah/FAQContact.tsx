import React, { useState } from 'react';
import { FaGlobe, FaInstagram, FaTiktok, FaHandshake, FaHeadset, FaLightbulb } from 'react-icons/fa';

export default function FAQContact() {
  // حالة لحفظ رقم السؤال المفتوح حالياً (إذا null يعني كلها مسدودة)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
  };

  const toggleFaq = (index: number) => {
    // إذا ضغط على نفس السؤال ينغلق، وإذا غيره ينفتح وينغلق السابق
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqList = [
    { 
      q: 'شنو هي منصة أمنية وشلون تشتغل؟', 
      a: 'أمنية هي منصة لإصدار وتوثيق المواقع والروابط التفاعلية والمناسبات السعيدة. نجهزلك رابط خاص يحتوي على ثيم تفاعلي ورسائلك الخاصة وموسيقى من اختيارك.' 
    },
    { 
      q: 'شلون يوصلني الرابط وبأي وقت ينتهي؟', 
      a: 'بعد إتمام الطلب مع متجرنا أو أحد وكلائنا المعتمدين، ينزلك الرابط السري خلال نصف ساعة فقط. أما مدة استمرار الرابط فتعتماد على الباقة اللي تختارها (يومية، أسبوعية، شهرية، أو دائمية).' 
    },
    { 
      q: 'شلون أضمن خصوصية بياناتي والرسائل الخاصة بالرابط؟', 
      a: 'نضمن لك الخصوصية والأمان التام، الرابط مالتك يكون مشفر ومخصص إلك، ولا يمكن لأي شخص الاطلاع عليه أو فتحه إلا من خلال الرابط المباشر اللي تتسلمه.' 
    },
    { 
      q: 'أقدر أعدل على الكلمات أو الموسيقى بعد ما أستلم الرابط؟', 
      a: 'نعم، التعديل متاح حسب باقتك. الباقة الدائمية تتيح لك التعديل بأي وقت مقابل أجور رمزية (5 آلاف دينار)، أما باقي الباقات فيتم تثبيت البيانات عند التسليم.' 
    },
    { 
      q: 'شلون أضمن إن البيج اللي اشتريت منه معتمد تابع لأمنية؟', 
      a: 'تقدر تتحقق من أي بيج أو وكيل من خلال قسم "البيجات المعتمدة" في موقعنا بمجرد البحث عن يوزر الحساب، وإذا كان غير موجود فهو غير تابع لنا.' 
    }
  ];

  return (
    <>
      <section id="official-pages-section" style={{ padding: '60px 5%', background: '#ffffff', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', color: '#1e293b', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          صفحاتنا الرسمية <FaGlobe style={{ color: '#0ea5e9' }} />
        </h2>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px' }}>تواصلوا معنا مباشرة عبر قنواتنا الوحيدة والرسمية.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <a href="https://www.instagram.com/oomnia.1/" style={{ textDecoration: 'none', padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#e1306c', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaInstagram style={{ fontSize: '24px' }} /> انستغرام
          </a>
          <a href="https://www.tiktok.com/@oomnia.1/" style={{ textDecoration: 'none', padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#000000', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaTiktok style={{ fontSize: '24px' }} /> تيك توك
          </a>
        </div>
      </section>

      <section id="join-us-section" style={{ padding: '60px 5%', background: '#f8fafc', borderTop: '2px solid #f1f5f9', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', padding: '40px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '32px', color: '#dc2626', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            كن جزءاً من عائلتنا <FaHandshake style={{ color: '#dc2626' }} />
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
            هل ترغب في الانضمام إلى Oomniah، أو شراء وكالة حصرية، أو حتى شراء حصة استثمارية من منصتنا؟ نرحب دائماً بالشركاء الجدد.
          </p>
          <button onClick={() => scrollToSection('official-pages-section')} style={{ background: '#0ea5e9', color: '#ffffff', border: 'none', padding: '14px 35px', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>تواصل معنا للتفاصيل</button>
        </div>
      </section>

      <section id="faq-section" style={{ padding: '60px 5% 80px', background: '#ffffff', borderTop: '2px solid #f1f5f9' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', color: '#1e293b', fontWeight: '900', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              الدعم الفني <FaHeadset style={{ color: '#1e293b' }} />
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>واجهت مشكلة؟ فريقنا متواجد لخدمتك. تواصل معنا عبر صفحاتنا الرسمية لأي استفسار تقني.</p>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            الأسئلة الشائعة <FaLightbulb style={{ color: '#fbbf24' }} />
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {faqList.map((faq, i) => (
              <div 
                key={i} 
                onClick={() => toggleFaq(i)}
                style={{ 
                  background: openFaq === i ? '#ffffff' : '#f8fafc', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: openFaq === i ? '1px solid #dc2626' : '1px solid #e2e8f0', 
                  cursor: 'pointer',
                  boxShadow: openFaq === i ? '0 10px 20px rgba(220,38,38,0.05)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{faq.q}</span>
                  <span style={{ color: '#dc2626', fontSize: '24px', transition: 'transform 0.3s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>
                    +
                  </span>
                </div>
                
                {/* المحتوى يظهر فقط إذا كان الـ state يطابق رقم السؤال */}
                <div style={{ 
                  maxHeight: openFaq === i ? '500px' : '0', 
                  overflow: 'hidden', 
                  transition: 'max-height 0.4s ease' 
                }}>
                  <p style={{ marginTop: '15px', color: '#64748b', lineHeight: '1.6', borderTop: '1px solid #e2e8f0', paddingTop: '15px', margin: '15px 0 0 0' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}