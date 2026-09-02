import React from 'react';
import { FaHeart, FaMagic, FaStar, FaLock, FaPalette, FaBolt } from 'react-icons/fa';

export default function HeroFeatures() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
    }
  };

  return (
    <>
      <section id="home-hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px 30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#dc2626', margin: '0 0 15px 0', lineHeight: '1.4', fontFamily: '"Aref Ruqaa", serif' }}>
          لأن كل أمنية حلوة .. <br/>
          <span style={{ color: '#0ea5e9', fontSize: '48px', fontFamily: 'Tajawal, sans-serif', display: 'inline-flex', alignItems: 'center', gap: '15px' }}>
            وراها قصة <FaHeart style={{ color: '#ec4899', fontSize: '40px' }} />
          </span>
        </h1>
        <h2 style={{ fontSize: '24px', color: '#1e293b', margin: '0 0 30px 0', fontWeight: 'bold' }}>منصتكم الأولى لتوثيق أحلى أيامكم</h2>
        <button onClick={() => scrollToSection('themes-section')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#dc2626', color: '#ffffff', border: 'none', padding: '16px 40px', borderRadius: '12px', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)', transition: 'transform 0.3s' }}>
          أصنعوا أمنيتكم الآن <FaMagic />
        </button>
      </section>

      <section id="features-section" style={{ padding: '60px 5%', background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          لماذا أمنية؟ <FaStar style={{ color: '#fbbf24' }} />
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <FaLock style={{ fontSize: '40px', color: '#10b981', marginBottom: '15px' }} />
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '10px' }}>خصوصية تامة</h3>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>روابط هداياكم مشفرة ومحمية بالكامل ولا تفتح إلا بالرابط الذي يسلمه لكم متجرنا أو حسب الوكيل</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <FaPalette style={{ fontSize: '40px', color: '#8b5cf6', marginBottom: '15px' }} />
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '10px' }}>تصاميم حصرية</h3>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>ثيمات تفاعلية مليئة بالمفاجآت والحركات والموسيقى المدمجة.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <FaBolt style={{ fontSize: '40px', color: '#eab308', marginBottom: '15px' }} />
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '10px' }}>تسليم سريع</h3>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>استلم هديتك السحرية جاهزة خلال نصف ساعة فقط من الطلب.</p>
          </div>
        </div>
      </section>
    </>
  );
}