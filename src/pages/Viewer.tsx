import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Viewer() {
  const { themeSlug, shortId } = useParams<{ themeSlug: string, shortId: string }>();
  const [error, setError] = useState<string | null>(null);

  const INSTAGRAM_URL = "https://www.instagram.com/link.love1?igsh=dDRjd2d3MTN1dm92";

  useEffect(() => {
    const processGift = async () => {
      try {
        if (!themeSlug || !shortId) return;

        // جلب الرابط مع حالة الثيم المرتبط به
        const { data, error: fetchError } = await supabase
          .from('gift_links')
          .select('*, themes(slug, status)')
          .eq('short_id', shortId)
          .single();

        if (fetchError || !data) {
          setError('عذراً، هذا الرابط غير صحيح أو تم حذفه ❌');
          return;
        }

        // 🛡️ الجدار الناري: فحص إذا تم تعطيل الرابط أو الثيم من لوحة الإدارة الكبرى
        if (data.status === 'inactive' || data.themes?.status === 'inactive') {
          setError('معطل');
          return;
        }

        // فحص صلاحية الوقت
        if (new Date(data.expires_at) < new Date()) {
          setError('انتهت الصلاحية');
          return;
        }

        // تجهيز البيانات
        const queryParams = new URLSearchParams({
          sender: data.sender_name || 'مجهول',
          recipient: data.recipient_name || 'صديقي',
          message: data.message || '',
          yt: data.song_url || '',
          start: (data.song_start_seconds || 0).toString(),
          gender: data.recipient_gender || 'female' // 👈 هذا السطر الجديد
        }).toString();
        // التوجيه المباشر لملف الثيم
        window.location.replace(`/themes/${themeSlug}/index.html?${queryParams}`);
        
      } catch (err) {
        console.error(err);
        setError('حدث خطأ غير متوقع');
      }
    };

    processGift();
  }, [themeSlug, shortId]);

  // --- الستايلات المشتركة لصفحات الخطأ ---
  const pageContainer: React.CSSProperties = {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#ffeef2', // لون خلفية وردي باستيل
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    padding: '20px',
    direction: 'rtl'
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    padding: '40px 30px',
    borderRadius: '24px',
    boxShadow: '0 15px 35px rgba(255, 143, 163, 0.2)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
    border: '2px solid #ffccd5' // إطار وردي ناعم
  };

  const instaBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 25px',
    borderRadius: '50px',
    fontWeight: 'bold',
    fontSize: '15px',
    boxShadow: '0 5px 15px rgba(220, 39, 67, 0.3)',
    transition: 'all 0.3s ease',
    marginTop: '10px'
  };

  // 🛑 شاشة الحظر الأمني (إذا قمت بتعطيل الرابط من اللوحة)
  if (error === 'معطل') return (
    <div style={pageContainer}>
      <div style={cardStyle}>
        <div style={{ fontSize: '70px', marginBottom: '15px' }}>🔒</div>
        <h2 style={{ color: '#ff477e', fontSize: '26px', marginBottom: '10px', fontWeight: '900' }}>الرابط متوقف!</h2>
        <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، تم إيقاف هذا الرابط مؤقتاً. إذا كنت تعتقد أن هذا حدث بالخطأ أو تود إعادة تفعيله، يسعدنا تواصلك معنا.
        </p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" style={instaBtnStyle} className="hover-bounce">
          💬 تواصل مع الدعم الفني
        </a>
      </div>
    </div>
  );

  // 🎀 صفحة الهدية المنتهية
  if (error === 'انتهت الصلاحية') return (
    <div style={pageContainer}>
      <style>{`
        .hover-bounce:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(220, 39, 67, 0.4) !important; }
      `}</style>
      <div style={cardStyle}>
        <div style={{ fontSize: '70px', marginBottom: '15px' }}>🎀</div>
        <h2 style={{ color: '#ff477e', fontSize: '26px', marginBottom: '10px', fontWeight: '900' }}>انتهت صلاحية الهدية!</h2>
        <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، الوقت المخصص لعرض هذه الهدية قد انتهى. يمكنك تجديد الرابط أو تصميم هدية جديدة ومفاجأة من تحب! ✨
        </p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" style={instaBtnStyle} className="hover-bounce">
          <svg style={{ width: '18px', height: '18px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          جدد هديتك عبر انستغرام
        </a>
      </div>
    </div>
  );

  // صفحة الخطأ العام (إذا الرابط غلط أو انحذف)
  if (error) return (
    <div style={pageContainer}>
      <div style={cardStyle}>
        <div style={{ fontSize: '60px', marginBottom: '15px' }}>💔</div>
        <h2 style={{ color: '#ff477e', fontSize: '24px', marginBottom: '10px', fontWeight: '900' }}>الرابط غير صحيح</h2>
        <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، لا يمكننا العثور على هذه الهدية. قد يكون الرابط خاطئاً أو تم حذفه.
        </p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" style={instaBtnStyle} className="hover-bounce">
          ابتكر هديتك الخاصة 🎁
        </a>
      </div>
    </div>
  );

  // صفحة التحميل السريعة (تظهر أجزاء من الثانية)
  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffeef2', color: '#ff477e', fontSize: '22px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ fontSize: '50px', animation: 'pulse 1.5s infinite' }}>✨</div>
        جاري تجهيز المفاجأة...
      </div>
    </div>
  );
}