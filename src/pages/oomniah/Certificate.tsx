import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { FaCheckCircle, FaShieldAlt, FaHome, FaInstagram, FaAward, FaStar } from 'react-icons/fa';

export default function Certificate() {
  const { handle } = useParams<{ handle: string }>();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // إزالة السكرول والحدود البيضاء من الصفحة بالكامل عند فتح الشهادة
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const fetchPage = async () => {
      if (!handle) return;
      const cleanHandle = handle.replace('@', '').toLowerCase();
      const { data } = await supabase
        .from('verified_pages')
        .select('*')
        .ilike('handle', cleanHandle)
        .single();
      
      if (data) {
        setPageData(data);
      }
      setLoading(false);
    };
    fetchPage();

    // إرجاع السكرول في حال غادر الزبون هذه الصفحة
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [handle]);

  if (loading) {
    return (
      <div style={{ height: '100dvh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#7f1d1d' }}>
        <div className="loader-ring"></div>
        <style>{`.loader-ring { width: 60px; height: 60px; border: 5px solid rgba(255, 255, 255, 0.3); border-top: 5px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div style={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#7f1d1d', fontFamily: 'Tajawal, sans-serif', padding: '20px', boxSizing: 'border-box' }}>
        <FaShieldAlt style={{ fontSize: '80px', color: '#fca5a5', marginBottom: '20px' }} />
        <h1 style={{ color: '#ffffff', marginBottom: '10px', fontWeight: '900', textAlign: 'center' }}>الحساب غير معتمد</h1>
        <p style={{ color: '#fecaca', marginBottom: '30px', fontSize: '18px', textAlign: 'center' }}>عذراً، هذا الحساب غير مسجل في شبكتنا.</p>
        <Link to="/" style={{ padding: '14px 35px', background: '#ffffff', color: '#dc2626', textDecoration: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '18px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>العودة للموقع الرسمي</Link>
      </div>
    );
  }

  const joinDate = new Date(pageData.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="cert-page">
      <style>{`
        /* 🌟 القاعدة الأساسية لمسح أي حدود بيضاء أو سكرول */
        * { box-sizing: border-box; }

        /* 🌟 الخلفية المتحركة */
        .cert-page {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw;
          height: 100dvh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(-45deg, #ef4444, #b91c1c, #7f1d1d, #450a0a);
          background-size: 400% 400%;
          animation: gradientBG 20s ease infinite;
          font-family: 'Tajawal', sans-serif;
          padding: clamp(10px, 3vh, 20px);
          direction: rtl;
          z-index: 99999; /* تضمن تغطية الشاشة بالكامل */
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* 🌟 النجوم المتحركة */
        .stars-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2.5px 2.5px at 60px 80px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 120px 40px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 200px 150px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 300px 250px, #ffffff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 350px 350px;
          animation: moveStars 80s linear infinite;
          opacity: 0.6;
          z-index: 0;
        }

        @keyframes moveStars {
          from { background-position: 0 0; }
          to { background-position: -1000px 1000px; }
        }

        /* 🌟 اللوغوات العائمة بالخلفية */
        .bg-logo {
          position: absolute;
          opacity: 0.05;
          z-index: 1;
          pointer-events: none;
          filter: grayscale(100%) brightness(200%);
        }
        .bg-logo-1 { top: 5%; left: 5%; width: max(80px, 15vh); animation: floatGlow 6s ease-in-out infinite alternate; }
        .bg-logo-2 { bottom: 5%; right: -2%; width: max(120px, 20vh); animation: floatGlow 8s ease-in-out infinite alternate-reverse; }

        @keyframes floatGlow { 
          0% { transform: translateY(0px) rotate(-10deg); } 
          100% { transform: translateY(30px) rotate(10deg); } 
        }

        /* 🌟 البطاقة المركزية الديناميكية */
        .cert-card {
          position: relative;
          background: rgba(153, 27, 27, 0.5);
          backdrop-filter: blur(25px);
          width: 100%;
          height: 100%;
          max-width: 900px;
          border-radius: 24px;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.1);
          z-index: 5;
          display: flex;
          flex-direction: column; /* الترتيب الافتراضي بالطول للموبايل */
          justify-content: space-evenly;
          align-items: center;
          padding: 2vh 4vw;
          overflow: hidden;
        }

        /* 🌟 تكييف ذكي جداً للشاشات بالعرض (Landscape) */
        @media (orientation: landscape) and (max-height: 600px), (min-width: 768px) {
          .cert-card {
            flex-direction: row;
            justify-content: space-between;
            padding: 3vh 3vw;
          }
          .cert-header-section {
            width: 40%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-left: 2px dashed rgba(255,255,255,0.2);
            padding-left: 2vw;
          }
          .cert-body-section {
            width: 60%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding-right: 2vw;
          }
        }

        /* حاويات الأقسام (تستخدم في الموبايل بالطول بشكل اعتيادي) */
        .cert-header-section, .cert-body-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          text-align: center;
        }

        /* 🌟 العلامة المائية بمنتصف البطاقة */
        .watermark-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(60vmin, 300px);
          height: auto;
          opacity: 0.05;
          pointer-events: none;
          animation: spinSlow 50s linear infinite;
          z-index: -1;
        }

        @keyframes spinSlow { 
          from { transform: translate(-50%, -50%) rotate(0deg); } 
          to { transform: translate(-50%, -50%) rotate(360deg); } 
        }

        /* 🌟 الزر اللامع جداً */
        .shiny-btn {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          color: #dc2626;
          text-decoration: none;
          padding: min(1.5vh, 14px) min(4vw, 30px);
          border-radius: 12px;
          font-weight: 900;
          font-size: clamp(14px, 2vh, 18px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
          border: 2px solid #ffffff;
          transition: transform 0.2s;
          flex: 1;
          white-space: nowrap;
        }

        .shiny-btn:active { transform: scale(0.95); }

        .shiny-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.4), transparent);
          transform: skewX(-25deg);
          animation: shineSweep 2s infinite;
        }

        @keyframes shineSweep {
          0% { left: -100%; }
          15% { left: 200%; }
          100% { left: 200%; }
        }

        .store-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          color: #fff;
          padding: min(1.5vh, 14px) min(3vw, 25px);
          border-radius: 12px;
          text-decoration: none;
          font-weight: 900;
          font-size: clamp(13px, 1.8vh, 16px);
          box-shadow: 0 5px 15px rgba(225, 48, 108, 0.4);
          flex: 1;
          white-space: nowrap;
        }

        /* 🌟 نصوص متجاوبة ذكية */
        .main-logo { height: min(12vh, 120px); object-fit: contain; margin-bottom: 1vh; filter: drop-shadow(0 0 15px rgba(255,255,255,0.4)); }
        .cert-title { font-size: clamp(24px, 5vh, 38px); font-weight: 900; margin: 0 0 0.5vh; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5); font-family: '"Aref Ruqaa", serif'; }
        .cert-sub { font-size: clamp(12px, 2vh, 16px); color: #fca5a5; margin: 0 0 2vh; font-weight: bold; letter-spacing: 1px; }
        
        .seal-box { background: linear-gradient(135deg, #fde047 0%, #d97706 100%); width: min(12vh, 100px); height: min(12vh, 100px); border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 4px solid #fff; box-shadow: 0 0 25px rgba(251, 191, 36, 0.6); margin-bottom: 2vh; }
        .seal-icon { font-size: min(6vh, 45px); color: #fff; }

        .intro-text { color: #fff; font-size: clamp(13px, 2.2vh, 18px); margin: 0 0 1vh; font-weight: bold; }
        .page-name { font-size: clamp(28px, 6vh, 48px); font-weight: 900; color: #fff; margin: 0 0 1vh; text-shadow: 0 0 15px rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; line-height: 1.2; }
        .page-handle { background: #fff; color: #dc2626; padding: 4px 15px; border-radius: 20px; font-weight: 900; font-size: clamp(14px, 2.5vh, 20px); margin-bottom: 2vh; display: inline-block; direction: ltr; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .desc-text { color: #f8fafc; font-size: clamp(12px, 2vh, 16px); line-height: 1.6; margin: 0 0 2vh; font-weight: 600; max-width: 90%; }
        
        .verified-icon-wrapper { position: relative; display: inline-flex; align-items: center; justify-content: center; width: min(5vh, 32px); height: min(5vh, 32px); }
        .verified-icon-bg { position: absolute; width: 50%; height: 50%; background: #fff; border-radius: 50%; z-index: 0; }
        .verified-icon { color: #1da1f2; font-size: min(5vh, 32px); position: relative; z-index: 1; filter: drop-shadow(0 0 5px rgba(29, 161, 242, 0.5)); }

        .dates-row { display: flex; justify-content: space-around; width: 100%; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 1.5vh; margin-bottom: 2vh; }
        .date-label { color: #fca5a5; font-size: clamp(11px, 1.8vh, 14px); font-weight: bold; }
        .date-value { color: #ffffff; font-size: clamp(14px, 2.2vh, 18px); font-weight: bold; }
        .status-value { color: #4ade80; font-size: clamp(14px, 2.4vh, 20px); font-weight: 900; text-shadow: 0 0 10px rgba(74, 222, 128, 0.6); }

        .buttons-row { display: flex; gap: 10px; width: 100%; justify-content: center; flex-wrap: wrap; }
      `}</style>

      {/* النجوم واللوغوات العائمة بالخلفية */}
      <div className="stars-overlay"></div>
      <img src="/oomniah-logo.png" className="bg-logo bg-logo-1" alt="" />
      <img src="/oomniah-logo.png" className="bg-logo bg-logo-2" alt="" />

      {/* البطاقة المركزية */}
      <div className="cert-card">
        <img src="/oomniah-logo.png" className="watermark-logo" alt="" />

        {/* 🌟 القسم الأول: الهيدر والختم */}
        <div className="cert-header-section">
          <img src="/oomniah-logo.png" alt="أمنية" className="main-logo" />
          <h1 className="cert-title">شهادة توثيق واعتماد</h1>
          <p className="cert-sub">وثيقة ثقة وضمان من منصة أمنية</p>
          
          <div className="seal-box">
             <FaAward className="seal-icon" />
          </div>
        </div>

        {/* 🌟 القسم الثاني: التفاصيل والأزرار */}
        <div className="cert-body-section">
          <p className="intro-text">بكل فخر، تشهد منصة أمنية بأن:</p>
          
          <h2 className="page-name">
            {pageData.name}
            {/* علامة التوثيق الزرقاء الأصلية */}
            <div className="verified-icon-wrapper">
              <div className="verified-icon-bg"></div>
              <FaCheckCircle className="verified-icon" />
            </div>
          </h2>
          
          <div className="page-handle">@{pageData.handle}</div>

          <p className="desc-text">
            هو <strong>وكيل حصري ومعتمد رسمياً</strong>. نضمن لزبائننا الكرام بأن التعامل معه آمن تماماً، ويقدم خدماتنا المعتمدة بأعلى معايير الجودة والسرعة.
          </p>

          {/* قسم التواريخ */}
          <div className="dates-row">
            <div>
              <div className="date-label">تاريخ الاعتماد</div>
              <div className="date-value">{joinDate}</div>
            </div>
            <div>
              <div className="date-label">حالة الوكالة</div>
              <div className="status-value">موثوق 100%</div>
            </div>
          </div>

          {/* الأزرار اللامعة والمنسقة */}
          <div className="buttons-row">
            <Link to="/" className="shiny-btn">
              <FaHome style={{ fontSize: '18px' }}/> الموقع الرسمي
            </Link>
            
            {pageData?.platforms?.map((pl: any, i: number) => {
              if(pl.platform === 'انستغرام') {
                return (
                  <a key={i} href={pl.link} target="_blank" rel="noreferrer" className="store-btn">
                    <FaInstagram style={{ fontSize: '18px' }} /> زيارة المتجر
                  </a>
                )
              }
              return null;
            })}
          </div>
        </div>

      </div>
    </div>
  );
}