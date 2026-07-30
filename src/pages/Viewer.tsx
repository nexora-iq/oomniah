import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  FaGift, FaBan, FaHourglassEnd, FaSearch, 
  FaExclamationTriangle, FaHeadset, FaSyncAlt, 
  FaRocket, FaExternalLinkAlt 
} from 'react-icons/fa';

const getCleanYouTubeEmbed = (url: string, start: number) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const ytId = (match && match[2].length === 11) ? match[2] : '';
  if (!ytId) return '';
  return `https://www.youtube.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&start=${start || 0}`;
};

const getGreetingText = (sGender: string, rGender: string) => {
  const isSenderMale = sGender === 'male' || sGender === 'ذكر';
  const isReceiverMale = rGender === 'male' || rGender === 'ذكر';
  const action = isSenderMale ? 'أرسل' : 'أرسلت';
  const preposition = isReceiverMale ? 'لك' : 'لكِ';
  const friend = isSenderMale ? 'صديقك' : 'صديقتك';
  return `${action} ${preposition} ${friend}`;
};

export default function Viewer() {
  const { themeSlug, shortId } = useParams<{ themeSlug: string, shortId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [isOpened, setIsOpened] = useState(false);
  
  // 🌟 حالات اكتشاف المتصفح والجهاز
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const OOMNIAH_INSTAGRAM = "https://www.instagram.com/oomnia.1/";

  useEffect(() => {
    // 🌟 فحص نوع المتصفح والجهاز
    const ua = navigator.userAgent || navigator.vendor;
    
    if (ua.includes('Instagram') || ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('TikTok') || ua.includes('Snapchat')) {
      setIsInAppBrowser(true);
    }
    
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setIsIOS(true);
    } else if (/android/i.test(ua)) {
      setIsAndroid(true);
    }

    const processGift = async () => {
      try {
        if (!themeSlug || !shortId) return;

        let giftData = null;
        const cacheKey = `oomniah_gift_${shortId}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
          giftData = JSON.parse(cachedData);
        } else {
          const { data, error: fetchError } = await supabase
            .from('gift_links')
            .select('*')
            .eq('short_id', shortId)
            .single();

          if (fetchError || !data) {
            console.error("Supabase Error Details:", fetchError);
            setError('not_found');
            return;
          }
          giftData = data;
          sessionStorage.setItem(cacheKey, JSON.stringify(giftData));
        }

        if (giftData.status === 'inactive' || giftData.status === 'disabled') {
          sessionStorage.removeItem(cacheKey); 
          setError('blocked');
          return;
        }

        if (new Date(giftData.expires_at) < new Date()) {
          sessionStorage.removeItem(cacheKey); 
          setError('expired');
          return;
        }

        const { data: themeInfo } = await supabase
          .from('themes')
          .select('name, description, img_url')
          .eq('slug', themeSlug)
          .single();

        if (themeInfo && themeInfo.img_url) {
          const setMetaTag = (property: string, content: string) => {
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
              element = document.createElement('meta');
              element.setAttribute('property', property);
              document.head.appendChild(element);
            }
            element.setAttribute('content', content);
          };

          document.title = `مفاجأة من أمنية | ${themeInfo.name}`;
          setMetaTag('og:title', `مفاجأة خاصة لك - ${themeInfo.name}`);
          setMetaTag('og:description', giftData.message ? `"${giftData.message}"` : (themeInfo.description || 'اضغط هنا لفتح هديتك السرية!'));
          setMetaTag('og:image', themeInfo.img_url); 
          setMetaTag('og:type', 'website');
          setMetaTag('twitter:card', 'summary_large_image');
          setMetaTag('twitter:image', themeInfo.img_url);
        }

        const cleanYtUrl = getCleanYouTubeEmbed(giftData.song_url, giftData.song_start_seconds);
        const greeting = getGreetingText(giftData.sender_gender, giftData.recipient_gender);

        const queryParams = new URLSearchParams({
          sender: giftData.sender_name || 'مجهول',
          recipient: giftData.recipient_name || 'صديقي',
          message: giftData.message || '',
          yt: giftData.song_url || '',
          yt_clean: cleanYtUrl,
          greeting: greeting,
          gender: giftData.recipient_gender || 'female'
        }).toString();
        
        setReadyUrl(`/themes/${themeSlug}/index.html?${queryParams}`);
        
      } catch (err) {
        console.error("Viewer Error:", err);
        setError('unexpected');
      }
    };

    processGift();
  }, [themeSlug, shortId]);

  // 🌟 [الخدعة البرمجية] إجبار الجهاز على فتح المتصفح الخارجي
  const forceOpenExternalBrowser = () => {
    const currentUrl = window.location.href;
    
    if (isAndroid) {
      // خدعة الأندرويد (تفتح الرابط بكروم حصراً وتطرد الانستغرام)
      const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//i, '')}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    } else if (isIOS) {
      // خدعة الايفون (تفتح متصفح سفاري)
      // أحياناً تفشل لأن أبل صارمة، فإذا فشلت، نطلب منه ينسخ الرابط
      const safariUrl = `googlechrome://${currentUrl.replace(/^https?:\/\//i, '')}`;
      window.location.href = safariUrl; // محاولة أولى للكروم عالايفون
      setTimeout(() => {
        // محاولة ثانية لسفاري إذا ماعنده كروم
        window.location.href = `x-web-search://?${currentUrl}`; 
      }, 500);
    } else {
      // للأجهزة غير المعروفة
      window.open(currentUrl, '_system');
    }
  };

  const pageContainer: React.CSSProperties = {
    height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: '#f8fafc', fontFamily: 'Tajawal, system-ui, -apple-system, sans-serif',
    padding: '20px', direction: 'rtl'
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff', padding: '40px 30px', borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)', textAlign: 'center',
    maxWidth: '400px', width: '100%', border: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  };

  const actionBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    background: '#dc2626', color: '#ffffff', textDecoration: 'none', padding: '16px 32px',
    borderRadius: '16px', fontWeight: '900', fontSize: '16px', boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)',
    transition: 'all 0.3s ease', marginTop: '10px', width: '100%', boxSizing: 'border-box',
    cursor: 'pointer', border: 'none', outline: 'none'
  };

  const externalBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#2563eb', color: '#ffffff', textDecoration: 'none', padding: '14px 20px',
    borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.3s ease', marginTop: '15px', width: '100%', boxSizing: 'border-box',
    cursor: 'pointer', border: 'none', outline: 'none'
  };

  const logoStyle: React.CSSProperties = {
    width: '70px', height: '70px', marginBottom: '20px', objectFit: 'contain'
  };

  if (error === 'blocked') return (
    <div style={pageContainer}>
      <div style={{...cardStyle, borderTop: '5px solid #dc2626'}}>
        <img src="/oomniah-logo.png" alt="أمنية" style={logoStyle} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <FaBan style={{ fontSize: '50px', color: '#dc2626', marginBottom: '15px' }} />
        <h2 style={{ color: '#1e293b', fontSize: '24px', marginBottom: '10px', fontWeight: '900' }}>تم إيقاف الرابط</h2>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، تم إيقاف هذا الرابط من قبل الإدارة المركزية أو الفرع. لمزيد من التفاصيل يرجى مراجعة الدعم الفني.
        </p>
        <a href={OOMNIAH_INSTAGRAM} target="_blank" rel="noreferrer" style={actionBtnStyle} className="hover-effect">
          <FaHeadset /> مراسلة الدعم الفني
        </a>
      </div>
    </div>
  );

  if (error === 'expired') return (
    <div style={pageContainer}>
      <div style={{...cardStyle, borderTop: '5px solid #ea580c'}}>
        <img src="/oomniah-logo.png" alt="أمنية" style={logoStyle} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <FaHourglassEnd style={{ fontSize: '50px', color: '#ea580c', marginBottom: '15px' }} />
        <h2 style={{ color: '#1e293b', fontSize: '24px', marginBottom: '10px', fontWeight: '900' }}>انتهت صلاحية الهدية!</h2>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، الوقت المخصص لعرض هذه الهدية قد انتهى. يرجى تجديد الاشتراك للتمكن من مشاهدتها مرة أخرى.
        </p>
        <a href={OOMNIAH_INSTAGRAM} target="_blank" rel="noreferrer" style={{...actionBtnStyle, background: '#ea580c', boxShadow: '0 8px 25px rgba(234, 88, 12, 0.4)'}} className="hover-effect-orange">
          <FaSyncAlt /> طلب تجديد الرابط
        </a>
      </div>
    </div>
  );

  if (error === 'not_found' || error === 'unexpected') return (
    <div style={pageContainer}>
      <div style={cardStyle}>
        <img src="/oomniah-logo.png" alt="أمنية" style={logoStyle} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <FaExclamationTriangle style={{ fontSize: '50px', color: '#1e293b', marginBottom: '15px' }} />
        <h2 style={{ color: '#1e293b', fontSize: '24px', marginBottom: '10px', fontWeight: '900' }}>الرابط غير صحيح</h2>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، لا يمكننا العثور على هذه الهدية. قد يكون الرابط خاطئاً أو تم حذفه من النظام بشكل نهائي.
        </p>
        <a href={window.location.origin} style={{...actionBtnStyle, background: '#1e293b', boxShadow: '0 8px 25px rgba(30, 41, 59, 0.4)'}} className="hover-effect-dark">
          <FaRocket /> تصفح خدمات منصة أمنية
        </a>
      </div>
    </div>
  );

  if (isOpened && readyUrl) return (
    <iframe 
      src={readyUrl} 
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', border: 'none', margin: 0, padding: 0, display: 'block' }} 
      allow="autoplay; fullscreen"
      title="Oomniah Gift"
    />
  );

  if (readyUrl) return (
    <div style={pageContainer}>
      <div style={{...cardStyle, background: 'transparent', border: 'none', boxShadow: 'none'}}>
        <img 
          src="/oomniah-logo.png" alt="أمنية" 
          style={{ width: '120px', height: '120px', animation: 'float 3s ease-in-out infinite', objectFit: 'contain', marginBottom: '25px', filter: 'drop-shadow(0 10px 15px rgba(220,38,38,0.2))' }} 
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h2 style={{ color: '#1e293b', fontSize: '26px', marginBottom: '5px', fontWeight: '900' }}>لديك مفاجأة</h2>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '30px' }}>اضغط على الزر أدناه لفتح هديتك</p>
        
        {/* 🌟 التنبيه وزر الانتقال للمتصفح الخارجي */}
        {isInAppBrowser ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.6', textAlign: 'center', width: '100%', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.1)' }}>
            <FaExclamationTriangle style={{ fontSize: '20px', marginBottom: '8px' }} /> <br/>
            أنت تفتح الرابط من داخل انستغرام، <br/> والصوت <span style={{ textDecoration: 'underline' }}>لن يعمل</span> بسبب سياسات التطبيق.<br/>
            
            <button 
              onClick={forceOpenExternalBrowser}
              style={externalBtnStyle}
              className="hover-effect-blue"
            >
              <FaExternalLinkAlt /> اضغط هنا لفتح الهدية بمتصفح الجهاز
            </button>
            
            <div style={{ marginTop: '12px', fontSize: '11px', color: '#991b1b' }}>
              إذا لم يعمل الزر، اضغط على النقاط (•••) في الأعلى واختر "فتح في متصفح خارجي" أو "Open in Browser"
            </div>
          </div>
        ) : (
          <button onClick={() => setIsOpened(true)} style={actionBtnStyle} className="hover-effect pulse-btn">
            <FaGift style={{ fontSize: '20px' }} /> افتح الهدية الآن
          </button>
        )}
      </div>

      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); } 70% { box-shadow: 0 0 0 20px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
        .pulse-btn { animation: pulse-ring 2s infinite; }
        .hover-effect:hover { transform: translateY(-3px) scale(1.02); background: #b91c1c !important; }
        .hover-effect-blue:hover { transform: translateY(-3px) scale(1.02); background: #1d4ed8 !important; }
      `}</style>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
      <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '80px', height: '80px', animation: 'pulse 1s infinite ease-in-out', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
      <style>{`@keyframes pulse { 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 15px rgba(220,38,38,0.3)); } 100% { transform: scale(0.95); opacity: 0.8; } }`}</style>
    </div>
  );
}