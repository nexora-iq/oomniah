import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  FaGift, FaBan, FaHourglassEnd, 
  FaExclamationTriangle, FaHeadset, FaSyncAlt, 
  FaRocket, FaGlobe, FaMusic, FaHeart
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
  const [isLoaded, setIsLoaded] = useState(false); // لمعرفة انتهاء جلب البيانات
  
  // 🌟 حالات المتصفحات
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const OOMNIAH_INSTAGRAM = "https://www.instagram.com/oomnia.1/";

  useEffect(() => {
    // 🌟 اكتشاف المتصفحات المدمجة (Instagram, TikTok, Facebook, Snapchat)
    const ua = navigator.userAgent || navigator.vendor;
    if (/Instagram|FBAN|FBAV|TikTok|Bytedance|Snapchat|Snap/i.test(ua)) {
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
          const { data, error: fetchError } = await supabase.from('gift_links').select('*').eq('short_id', shortId).single();
          if (fetchError || !data) { setError('not_found'); return; }
          giftData = data;
          sessionStorage.setItem(cacheKey, JSON.stringify(giftData));
        }

        if (giftData.status === 'inactive' || giftData.status === 'disabled') { setError('blocked'); return; }
        if (new Date(giftData.expires_at) < new Date()) { setError('expired'); return; }

        const { data: themeInfo } = await supabase.from('themes').select('name, description, img_url').eq('slug', themeSlug).single();

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
        
        // تأخير بسيط لإعطاء إحساس بالتحميل الأنيق
        setTimeout(() => setIsLoaded(true), 1500);

      } catch (err) {
        setError('unexpected');
      }
    };

    processGift();
  }, [themeSlug, shortId]);

  const forceOpenExternalBrowser = () => {
    const currentUrl = window.location.href;
    if (isAndroid) {
      window.location.href = `intent://${currentUrl.replace(/^https?:\/\//i, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    } else if (isIOS) {
      window.location.href = `googlechrome://${currentUrl.replace(/^https?:\/\//i, '')}`; 
      setTimeout(() => { window.location.href = `x-web-search://?${currentUrl}`; }, 500);
    } else {
      window.open(currentUrl, '_blank'); 
    }
  };

  const handleOpenGift = () => {
    setIsOpened(true);
  };

  const pageContainer: React.CSSProperties = {
    height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', fontFamily: 'Tajawal, system-ui, -apple-system, sans-serif',
    padding: '20px', direction: 'rtl', position: 'relative', overflow: 'hidden'
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)',
    padding: '40px 30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05), 0 0 20px rgba(220, 38, 38, 0.05)', 
    textAlign: 'center', maxWidth: '420px', width: '100%', 
    display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10
  };

  const actionBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    background: 'linear-gradient(45deg, #dc2626, #f43f5e)', color: '#ffffff', textDecoration: 'none', 
    padding: '16px 35px', borderRadius: '50px', fontWeight: '900', fontSize: '18px', 
    boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)', transition: 'all 0.3s ease', 
    marginTop: '15px', width: '100%', cursor: 'pointer', border: 'none', outline: 'none'
  };

  const logoStyle: React.CSSProperties = {
    width: '90px', height: '90px', marginBottom: '20px', objectFit: 'contain',
    filter: 'drop-shadow(0 10px 15px rgba(220, 38, 38, 0.2))'
  };

  // 🌟 شاشات الأخطاء والحظر
  if (error === 'blocked') return (
    <div style={pageContainer}>
      <div style={{...cardStyle, borderTop: '5px solid #dc2626'}}>
        <img src="/oomniah-logo.png" alt="أمنية" style={logoStyle} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <FaBan style={{ fontSize: '50px', color: '#dc2626', marginBottom: '15px' }} />
        <h2 style={{ color: '#1e293b', fontSize: '24px', marginBottom: '10px', fontWeight: '900' }}>تم إيقاف الرابط</h2>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، تم إيقاف هذا الرابط من قبل الإدارة المركزية. لمزيد من التفاصيل يرجى مراجعة الدعم الفني.
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
        <a href={OOMNIAH_INSTAGRAM} target="_blank" rel="noreferrer" style={{...actionBtnStyle, background: 'linear-gradient(45deg, #ea580c, #f97316)', boxShadow: '0 10px 25px rgba(234, 88, 12, 0.3)'}} className="hover-effect-orange">
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
        <a href={window.location.origin} style={{...actionBtnStyle, background: 'linear-gradient(45deg, #1e293b, #334155)', boxShadow: '0 10px 25px rgba(30, 41, 59, 0.3)'}} className="hover-effect-dark">
          <FaRocket /> تصفح خدمات منصة أمنية
        </a>
      </div>
    </div>
  );

  // 🌟 إذا تم الفتح، نعرض الهدية ونخفي واجهة البداية
  if (isOpened && readyUrl) return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000', zIndex: 999999 }}>
      <iframe 
        src={readyUrl} 
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
        allow="autoplay; fullscreen"
        title="Oomniah Gift"
      />
    </div>
  );

  // 🌟 شاشة الانتظار إذا كانت البيانات لم تجهز بعد
  if (!isLoaded || !readyUrl) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
      <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '80px', height: '80px', animation: 'pulseLogo 1.5s infinite alternate', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
      <p style={{ marginTop: '20px', fontSize: '15px', color: '#dc2626', fontWeight: 'bold', fontFamily: 'Tajawal', letterSpacing: '1px' }}>جاري تجهيز المفاجأة...</p>
      <style>{`@keyframes pulseLogo { 0% { transform: scale(0.9); filter: drop-shadow(0 0 5px rgba(220,38,38,0.2)); } 100% { transform: scale(1.1); filter: drop-shadow(0 0 20px rgba(220,38,38,0.6)); } }`}</style>
    </div>
  );

  // 🌟 الشاشة الرئيسية الأنيقة قبل فتح الهدية
  return (
    <div style={pageContainer}>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
        .pulse-btn { animation: pulse-ring 2s infinite; }
        .hover-effect:hover { transform: translateY(-3px) scale(1.03); }
        .background-blob { position: absolute; filter: blur(60px); opacity: 0.4; z-index: 1; border-radius: 50%; }
      `}</style>
      
      <div className="background-blob" style={{ top: '-10%', left: '-10%', width: '300px', height: '300px', background: '#fca5a5' }}></div>
      <div className="background-blob" style={{ bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: '#fbcfe8' }}></div>

      <div style={cardStyle} className="fade-in">
        <img 
          src="/oomniah-logo.png" alt="أمنية" 
          style={{ width: '100px', height: '100px', animation: 'float 4s ease-in-out infinite', objectFit: 'contain', marginBottom: '20px', filter: 'drop-shadow(0 15px 25px rgba(220,38,38,0.25))' }} 
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h2 style={{ color: '#1e293b', fontSize: '28px', marginBottom: '5px', fontWeight: '900' }}>مفاجأة بانتظارك</h2>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px', fontWeight: 'bold' }}>اضغط على الزر أدناه لفتح هديتك الخاصة</p>
        
        {/* 🌟 معالجة المتصفحات المدمجة (انستا/تيك توك) */}
        {isInAppBrowser ? (
          <div style={{ textAlign: 'center', padding: '25px 20px', background: '#fff0f2', borderRadius: '20px', border: '1px dashed #fecaca', width: '100%' }}>
            <div style={{ background: '#fff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px', boxShadow: '0 4px 10px rgba(220,38,38,0.1)' }}>
              <FaMusic style={{ fontSize: '24px', color: '#dc2626' }} />
            </div>
            <h2 style={{ color: '#dc2626', fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>لتعمل الموسيقى بشكل صحيح!</h2>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px', fontWeight: 'bold' }}>
              أنت تستخدم متصفح تطبيق. لضمان تجربة المفاجأة كاملة مع الصوت، يرجى فتح الرابط في المتصفح الخارجي.
            </p>
            <button onClick={forceOpenExternalBrowser} style={{...actionBtnStyle, marginTop: 0, padding: '14px 20px', fontSize: '15px'}} className="hover-effect">
              فتح في المتصفح الأساسي <FaGlobe style={{ fontSize: '18px' }} />
            </button>
            <button onClick={handleOpenGift} style={{ background: 'transparent', color: '#94a3b8', border: 'none', marginTop: '15px', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
              تخطي وفتح الهدية هنا (بدون موسيقى)
            </button>
          </div>
        ) : (
          <button onClick={handleOpenGift} style={actionBtnStyle} className="hover-effect pulse-btn">
            <FaHeart style={{ fontSize: '20px' }} /> افتح الهدية الآن
          </button>
        )}

      </div>
      
      {/* 🌟 تحميل خفي للهدية بالخلفية لضمان السرعة (Preloading) */}
      {!isOpened && readyUrl && (
        <iframe src={readyUrl} style={{ width: 0, height: 0, border: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }} title="preload" />
      )}
    </div>
  );
}