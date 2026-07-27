import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase'; // 🔌 تأكد من مسار الاستدعاء
import { FaHome, FaPalette, FaMoneyBillWave, FaShieldAlt, FaHeadset, FaMagic } from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

const translations = {
  ar: {
    home: "الرئيسية",
    themes: "الثيمات",
    pricing: "الأسعار",
    verifiedPages: "البيجات المعتمدة",
    support: "الدعم الفني",
    discoverBtn: "اكتشف تصاميمنا",
  },
  en: {
    home: "Home",
    themes: "Themes",
    pricing: "Pricing",
    verifiedPages: "Verified Pages",
    support: "Support",
    discoverBtn: "Discover Designs",
  }
};

export default function Navbar() {
  const [lang] = useState<'ar' | 'en'>('ar'); // ثبتنا اللغة على العربي حالياً
  
  const [marqueeAr, setMarqueeAr] = useState('');
  const [marqueeEn, setMarqueeEn] = useState('');

  const t = translations[lang];
  const location = useLocation();
  const navigate = useNavigate();

  // 📥 جلب نصوص الشريط من قاعدة البيانات
  useEffect(() => {
    const fetchMarquee = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('marquee_text_ar, marquee_text_en')
          .eq('id', 1)
          .single();

        if (data && !error) {
          setMarqueeAr(data.marquee_text_ar || '');
          setMarqueeEn(data.marquee_text_en || '');
        }
      } catch (err) {
        console.error('خطأ في جلب شريط النصوص:', err);
      }
    };

    fetchMarquee();
  }, []);

  // دالة الانتقال السلس للأقسام
  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 130, behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 130, behavior: 'smooth' });
    }
  };

  const currentMarqueeText = lang === 'ar' ? marqueeAr : marqueeEn;

  return (
    <>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap');
      </style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, direction: lang === 'ar' ? 'rtl' : 'ltr', fontFamily: 'Tajawal, sans-serif' }}>
        
        {/* الهيدر الرئيسي */}
        <header style={{ background: '#ffffff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative', zIndex: 2 }}>
          <div className="header-container">
            
            {/* 1. اللوغو (يمين) */}
            <Link to="/" className="logo-section">
              <img src="/oomniah-logo.png" alt="أمنية" className="logo-img" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <h1 className="logo-text">{lang === 'ar' ? 'أُمنيــــة' : 'Oomniah'}</h1>
            </Link>

            {/* 2. الأقسام (وسط) */}
            <nav className="nav-links-container">
              <button onClick={() => scrollToSection('home-hero')} className="nav-item">
                <FaHome style={{ fontSize: '16px' }} /> {t.home}
              </button>
              <button onClick={() => scrollToSection('themes-section')} className="nav-item">
                <FaPalette style={{ fontSize: '16px' }} /> {t.themes}
              </button>
              <button onClick={() => scrollToSection('pricing-section')} className="nav-item">
                <FaMoneyBillWave style={{ fontSize: '16px' }} /> {t.pricing}
              </button>
              <button onClick={() => scrollToSection('verified-pages-section')} className="nav-item">
                <FaShieldAlt style={{ fontSize: '16px' }} /> {t.verifiedPages}
              </button>
              <button onClick={() => scrollToSection('faq-section')} className="nav-item">
                <FaHeadset style={{ fontSize: '16px' }} /> {t.support}
              </button>
            </nav>

            {/* 3. الإجراءات (يسار) */}
            <div className="action-section">
              <button className="cta-hover" onClick={() => scrollToSection('themes-section')}>
                <FaMagic style={{ fontSize: '14px' }} /> {t.discoverBtn}
              </button>
            </div>

          </div>
        </header>

        {/* 🌟 شريط النصوص المتحرك */}
        {currentMarqueeText && (
          <div className="marquee-wrapper">
            <div className="marquee-content">
               {currentMarqueeText} &nbsp;&nbsp;&nbsp; 🌸 &nbsp;&nbsp;&nbsp; {currentMarqueeText} &nbsp;&nbsp;&nbsp; 🌸 &nbsp;&nbsp;&nbsp; {currentMarqueeText}
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* تنسيقات الهيكل الرئيسي لتجنب الفراغات */
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 5%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
        }
        
        .logo-img { width: 45px; height: 45px; object-fit: contain; }
        .logo-text { font-size: 26px; font-weight: 900; color: #dc2626; margin: 0; line-height: 1; font-family: 'Aref Ruqaa', serif; }

        .cta-hover {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 8px;
          font-weight: bold; cursor: pointer; font-size: 13px; font-family: Tajawal, sans-serif;
          transition: all 0.3s ease; white-space: nowrap;
        }
        .cta-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3); background: #b91c1c; }

        .nav-item {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: none; border: none; color: #1e293b; font-size: 15px; font-weight: bold; cursor: pointer;
          transition: color 0.3s; font-family: Tajawal, sans-serif; white-space: nowrap;
        }
        .nav-item:hover { color: #dc2626; }

        .marquee-wrapper {
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(5px); border-bottom: 1px solid #fecaca;
          padding: 6px 0; overflow: hidden; white-space: nowrap; position: relative; z-index: 1;
        }
        .marquee-content {
          display: inline-block; color: #ef4444; font-weight: bold; font-size: 13px; direction: ltr;
          animation: ${lang === 'ar' ? 'scroll-rtl' : 'scroll-ltr'} 40s linear infinite;
        }

        @keyframes scroll-rtl { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes scroll-ltr { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

        /* إخفاء شريط التمرير لأقسام الموبايل */
        .nav-links-container::-webkit-scrollbar { display: none; }
        .nav-links-container { -ms-overflow-style: none; scrollbar-width: none; }

        /* الشاشات الكبيرة (لابتوب وايباد) */
        @media (min-width: 850px) {
          .nav-links-container {
            display: flex; gap: 20px; align-items: center; justify-content: center; flex-grow: 1; padding: 0 20px;
          }
        }

        /* الشاشات الصغيرة (الموبايل) */
        @media (max-width: 849px) {
          .header-container {
            flex-wrap: wrap; 
            padding: 10px 15px 5px 15px; /* تقليل الفراغات العلوية والسفلية بالموبايل */
            gap: 12px;
          }
          .logo-section { order: 1; }
          .action-section { order: 2; }
          .nav-links-container {
            order: 3; width: 100%; display: flex; gap: 15px; overflow-x: auto; padding-bottom: 5px;
          }
        }
      `}</style>
    </>
  );
}