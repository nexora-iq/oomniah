import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Viewer() {
  const { themeSlug, shortId } = useParams<{ themeSlug: string, shortId: string }>();
  const [error, setError] = useState<string | null>(null);

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
          start: (data.song_start_seconds || 0).toString()
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

  // 🛑 شاشة الحظر الأمني (إذا قمت بتعطيل الرابط من اللوحة)
  if (error === 'معطل') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fff5f7', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '70px', marginBottom: '20px' }}>🔒</div>
      <h2 style={{ color: '#d32f2f', fontSize: '28px', marginBottom: '10px' }}>الرابط موقوف!</h2>
      <p style={{ color: '#666', fontSize: '18px', maxWidth: '300px', marginBottom: '30px' }}>
        عذراً، تم تعطيل هذا الرابط أو الثيم مؤقتاً من قبل الإدارة.
      </p>
    </div>
  );

  // 🎀 صفحة الهدية المنتهية (فخمة)
  if (error === 'انتهت الصلاحية') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fff5f7', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '70px', marginBottom: '20px' }}>🎀</div>
      <h2 style={{ color: '#ff69b4', fontSize: '28px', marginBottom: '10px' }}>الهدية انتهت! 🌸</h2>
      <p style={{ color: '#666', fontSize: '18px', maxWidth: '300px', marginBottom: '30px' }}>
        عذراً، الرابط الذي تحاول فتحه لم يعد متاحاً. تواصل مع المتجر لتجديد الهدية أو إنشاء رابط جديد.
      </p>
    </div>
  );

  // صفحة الخطأ العام
  if (error) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff5f7', color: '#d32f2f', fontWeight: 'bold' }}>
      {error}
    </div>
  );

  // صفحة التحميل السريعة
  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff5f7', color: '#ff69b4', fontSize: '24px', fontWeight: 'bold' }}>
      جاري تجهيز المفاجأة... ✨
    </div>
  );
}