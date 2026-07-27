import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase'; // 🔌 تأكد من مسار الاستدعاء

export default function StoryAds() {
  const [ads, setAds] = useState<any[]>([]); // 👈 مصفوفة فارغة بالبداية
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartTime = useRef<number>(0); 

  // 📥 جلب الستوريات من قاعدة البيانات
  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('story_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        // ترتيب البيانات حتى تطابق تصميم المكون الحالي
        const formattedAds = data.map(ad => ({
          id: ad.id,
          type: ad.type || 'image', // تحديد النوع (صورة كافتراضي)
          url: ad.media_url, // الحقل اللي بقاعدة البيانات
          duration: 5000 // 5 ثواني لكل صورة
        }));
        setAds(formattedAds);
      }
    };

    fetchStories();
  }, []);

  const currentAd = ads[currentIndex];

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex(prev => (prev === ads.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex(prev => (prev === 0 ? ads.length - 1 : prev - 1));
  };

  // ⏱️ مؤقت الصور الذكي
  useEffect(() => {
    if (ads.length === 0 || !currentAd || currentAd.type === 'video') return;

    const intervalTime = 50; 
    const step = (intervalTime / (currentAd.duration || 5000)) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => prev + step);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, currentAd, ads.length]);

  useEffect(() => {
    if (progress >= 100 && currentAd?.type === 'image') {
      handleNext();
    }
  }, [progress, currentAd]);

  useEffect(() => {
    if (currentAd?.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, currentAd]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  // 🧠 الذكاء في التفريق بين "اللمسة السريعة" و "اللمسة المطولة"
  const handlePointerDown = () => {
    touchStartTime.current = Date.now();
    setIsPaused(true);
  };

  const handlePointerUp = (action: 'next' | 'prev') => {
    setIsPaused(false);
    const holdDuration = Date.now() - touchStartTime.current;
    
    // إذا اللمسة كانت أقل من 200 ملي ثانية (يعني نقرة سريعة) نعبر للصورة
    if (holdDuration < 200) {
      if (action === 'next') handleNext();
      else handlePrev();
    }
  };

  // إذا قاعدة البيانات فارغة (ماكو ستوريات)، يختفي القسم بالكامل من الموقع
  if (ads.length === 0 || !currentAd) return null;

  return (
    <div style={{
      width: '100%', maxWidth: '1200px', margin: '20px auto', position: 'relative', 
      borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
      background: '#000', aspectRatio: '21/9', userSelect: 'none'
    }}>
      
      {/* 📊 أشرطة التقدم */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10, direction: 'ltr' }}>
        {ads.map((ad, idx) => (
          <div key={ad.id} style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.4)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', background: '#ffffff', 
              width: idx === currentIndex ? `${progress}%` : (idx < currentIndex ? '100%' : '0%'),
              transition: isPaused || currentAd.type === 'video' ? 'none' : 'width 0.05s linear'
            }} />
          </div>
        ))}
      </div>

      {currentAd.type === 'image' ? (
        <img src={currentAd.url} alt="إعلان" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} draggable="false" />
      ) : (
        <video ref={videoRef} src={currentAd.url} muted playsInline onTimeUpdate={handleVideoTimeUpdate} onEnded={handleNext} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {/* 👈 التنقل الذكي (بدون onClick) */}
      <div 
        onPointerDown={handlePointerDown} 
        onPointerUp={() => handlePointerUp('prev')} 
        onPointerLeave={() => setIsPaused(false)}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', zIndex: 5, touchAction: 'none' }} 
      />
      <div 
        onPointerDown={handlePointerDown} 
        onPointerUp={() => handlePointerUp('next')} 
        onPointerLeave={() => setIsPaused(false)}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', zIndex: 5, touchAction: 'none' }} 
      />
    </div>
  );
}