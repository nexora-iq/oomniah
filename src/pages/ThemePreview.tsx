import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowRight, FaEye, FaCopy, FaTimes, FaMobileAlt, FaCheckCircle } from 'react-icons/fa';

// 🌟 استدعاء الثيمات الـ VIP كـ React Components
import ThemeOneSoul from './them-mul-player/ThemeOneSoul/ThemeOneSoul';
import ThemeVoiceGift from './them-mul-player/ThemeVoiceGift1'; 

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
  return `${isSenderMale ? 'أرسل' : 'أرسلت'} ${isReceiverMale ? 'لك' : 'لكِ'} ${isSenderMale ? 'صديقك' : 'صديقتك'}`;
};

export default function ThemePreview() {
  const { themeSlug } = useParams<{ themeSlug: string }>();
  const navigate = useNavigate();
  
  // 🌟 استخدام الغرف العشوائية للـ VIP
  const [searchParams] = useSearchParams();
  const roomQuery = searchParams.get('room');
  
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [showMultiplayerHint, setShowMultiplayerHint] = useState(true);
  
  // حالة الزر بعد النسخ
  const [isCopied, setIsCopied] = useState(false);

  const isMultiplayer = themeSlug === 'one-soul' || themeSlug === 'voice-gift1';

  // 1. توليد غرفة عشوائية للثيمات الثنائية
  useEffect(() => {
    if (isMultiplayer && !roomQuery) {
      const uniqueRoomId = 'prev_' + Math.random().toString(36).substring(2, 10);
      navigate(`/preview/${themeSlug}?room=${uniqueRoomId}`, { replace: true });
    }
  }, [isMultiplayer, roomQuery, navigate, themeSlug]);

  // 🌟 البيانات التجريبية
  const mockOrderData = {
    short_id: roomQuery || 'PREVIEW_DEFAULT',
    sender_name: 'أحمد',
    recipient_name: 'سارة',
    message: 'هذه مجرد معاينة تجريبية للثيم! عند طلبك الحقيقي، ستظهر رسالتك الخاصة هنا لتفاجئ من تحب بأجمل طريقة ممكنة ✨.',
    song_url: isMultiplayer 
      ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // ملف MP3 تجريبي للـ VIP
      : 'https://www.youtube.com/watch?v=b2vxSfbuA8o&t=190s', // اليوتيوب الخاص بك من الثانية 190
    song_start_seconds: 190, 
    sender_gender: 'male',
    recipient_gender: 'female'
  };

  // 🌟 تحويل البيانات للهيكل الذي تتوقعه مكونات الـ VIP (حل مشكلة TypeScript)
  const formattedVipOrderData = {
    sender_name: mockOrderData.sender_name,
    receiver_name: mockOrderData.recipient_name, // استخدام receiver_name بدل recipient_name
    message: mockOrderData.message,
    audio_url: mockOrderData.song_url            // استخدام audio_url بدل song_url
  };

  // 2. تهيئة الثيمات العادية (HTML)
  useEffect(() => {
    if (!themeSlug || isMultiplayer) return;
    
    const cleanYtUrl = getCleanYouTubeEmbed(mockOrderData.song_url, mockOrderData.song_start_seconds);
    const greeting = getGreetingText(mockOrderData.sender_gender, mockOrderData.recipient_gender);

    const queryParams = new URLSearchParams({
      sender: mockOrderData.sender_name,
      recipient: mockOrderData.recipient_name,
      message: mockOrderData.message,
      yt: mockOrderData.song_url,
      yt_clean: cleanYtUrl,
      greeting: greeting,
      gender: mockOrderData.recipient_gender
    }).toString();

    setIframeUrl(`/themes/${themeSlug}/index.html?${queryParams}`);
  }, [themeSlug, isMultiplayer]);

  // 🌟 دالة النسخ الذكية
  const copyPreviewLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2500);
  };

  // ==========================================
  // عناصر الواجهة المشتركة
  // ==========================================
  const backButton = (
    <button onClick={() => navigate(-1)} style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 9999998, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid #e2e8f0', borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#1e293b', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
      <FaArrowRight /> رجوع للمتجر
    </button>
  );

  const previewBadge = (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999998, background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(10px)', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
      <FaEye color="#0ea5e9" /> وضع المعاينة
    </div>
  );

  const multiplayerHintOverlay = (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999999, padding: '20px'
    }}>
      <div style={{
        background: '#ffffff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px',
        textAlign: 'center', direction: 'rtl', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        position: 'relative', animation: 'fadeInScale 0.3s ease'
      }}>
        <button onClick={() => setShowMultiplayerHint(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' }}>
          <FaTimes />
        </button>
        
        <div style={{ fontSize: '40px', marginBottom: '15px', display: 'flex', justifyContent: 'center', gap: '10px', color: '#0ea5e9' }}>
          <FaMobileAlt /> <FaMobileAlt />
        </div>
        
        <h3 style={{ margin: '0 0 15px', color: '#1e293b', fontSize: '22px', fontWeight: '900' }}>تجربة ثنائية مذهلة!</h3>
        
        <p style={{ margin: '0 0 25px', color: '#475569', fontSize: '16px', lineHeight: '1.7', fontWeight: 'bold' }}>
          هذا الثيم مخصص لشخصين. <br/>
          <span style={{ color: '#dc2626' }}>أبقي الرابط مفتوحاً في هذا الجهاز</span>، 
          وانسخ الرابط وافتحه في جهاز ثاني لتعيش التجربة!
        </p>

        <button 
          onClick={copyPreviewLink} 
          style={{ 
            background: isCopied ? '#10b981' : 'linear-gradient(45deg, #0ea5e9, #3b82f6)', 
            color: '#fff', border: 'none', padding: '14px 20px', borderRadius: '15px', 
            fontWeight: 'bold', width: '100%', cursor: 'pointer', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '16px', 
            boxShadow: isCopied ? '0 10px 20px rgba(16, 185, 129, 0.3)' : '0 10px 20px rgba(14, 165, 233, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {isCopied ? <><FaCheckCircle /> تم نسخ الرابط بنجاح!</> : <><FaCopy /> انسخ رابط المعاينة</>}
        </button>
      </div>
      <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );

  // ==========================================
  // العرض (Render)
  // ==========================================
  if (themeSlug === 'one-soul') {
    if (!roomQuery) return null;
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        {backButton}
        {previewBadge}
        {showMultiplayerHint && multiplayerHintOverlay}
        <ThemeOneSoul roomId={mockOrderData.short_id} orderData={formattedVipOrderData} />
      </div>
    );
  }

  if (themeSlug === 'voice-gift1') {
    if (!roomQuery) return null;
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        {backButton}
        {previewBadge}
        {showMultiplayerHint && multiplayerHintOverlay}
        <ThemeVoiceGift roomId={mockOrderData.short_id} orderData={formattedVipOrderData} />
      </div>
    );
  }

  if (iframeUrl) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
        {backButton}
        {previewBadge}
        <iframe src={iframeUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} allow="autoplay; fullscreen" title="Theme Preview" />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#64748b', fontWeight: 'bold' }}>
      جاري تهيئة المعاينة الحيّة...
    </div>
  );
}