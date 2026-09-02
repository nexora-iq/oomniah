import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGift, FaEye, FaShoppingBag, FaCrown, FaFire, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

export default function ThemesSection({ themes, isLoading }: { themes: any[], isLoading: boolean }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filters = [
    { id: 'all', label: 'الكل' },
    { id: 'trending', label: '🔥 الأكثر طلباً' },
    { id: 'vip', label: '👑 VIP' },
    { id: 'حب', label: '❤️ حب' }, // 🌟 تم تغيير الاسم هنا
    { id: 'صوت', label: '🎵 إهداء صوتي' },
    { id: 'شتاء', label: '❄️ شتاء' },
    { id: 'ميلاد', label: '🎂 أعياد ميلاد' },
    { id: 'صور', label: '📸 ألبومات' },
    { id: 'أنمي', label: 'أنمي🔥' }
  ];

  const filteredThemes = themes.filter(theme => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'trending') return theme.is_trending === true;
    if (activeFilter === 'vip') return theme.is_vip === true;
    return theme.categories && theme.categories.includes(activeFilter);
  });

  const handleInteractionStart = () => {
    setIsSliderPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsSliderPaused(false);
    }, 1000); // 🌟 تم تقليل الوقت إلى ثانية واحدة (1000ms)
  };

  // 🌟 دوال أزرار التحريك اليدوي للسلايدر
  const scrollNext = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' }); // يتحرك لليسار
      handleInteractionStart();
      handleInteractionEnd();
    }
  };

  const scrollPrev = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' }); // يتحرك لليمين
      handleInteractionStart();
      handleInteractionEnd();
    }
  };

  useEffect(() => {
    if (filteredThemes.length <= 1 || isSliderPaused) return;

    const scrollInterval = setInterval(() => {
      if (sliderRef.current) {
        sliderRef.current.scrollBy({ left: -1 }); 
        
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (Math.abs(scrollLeft) >= maxScroll - 2) {
          sliderRef.current.scrollTo({ left: 0 });
        }
      }
    }, 25);

    return () => clearInterval(scrollInterval);
  }, [filteredThemes.length, isSliderPaused]);

  return (
    <section id="themes-section" style={{ padding: '60px 0', background: '#ffffff', overflow: 'hidden' }}>
      <div style={{ padding: '0 5%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', color: '#1e293b', fontWeight: '900', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          اكتشف الثيمات <FaGift style={{ color: '#dc2626' }} />
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '16px', marginBottom: '25px' }}>اختر التصميم الذي يعبر عن مشاعرك.</p>
        
        <div className="filters-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' }}>
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px',
                cursor: 'pointer', transition: 'all 0.3s ease',
                border: activeFilter === filter.id ? 'none' : '1px solid #e2e8f0',
                background: activeFilter === filter.id ? 'linear-gradient(45deg, #dc2626, #f43f5e)' : '#f8fafc',
                color: activeFilter === filter.id ? '#fff' : '#475569',
                boxShadow: activeFilter === filter.id ? '0 4px 15px rgba(220,38,38,0.3)' : 'none',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 🌟 أزرار التحكم بالسلايدر (يمين ويسار) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button 
            onClick={scrollPrev} 
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', transition: '0.2s' }}
          >
            <FaChevronRight />
          </button>
          <button 
            onClick={scrollNext} 
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', transition: '0.2s' }}
          >
            <FaChevronLeft />
          </button>
        </div>
      </div>
      
      <div 
        ref={sliderRef}
        onMouseEnter={handleInteractionStart}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        className="themes-slider" 
        style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '15px 5% 40px', scrollBehavior: 'auto', scrollbarWidth: 'none' }}
      >
        {isLoading ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontSize: '18px', fontWeight: 'bold' }}>جاري تحميل الثيمات...</div>
        ) : filteredThemes.length === 0 ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontSize: '18px' }}>لا توجد ثيمات متوفرة في هذا القسم حالياً.</div>
        ) : (
          filteredThemes.map(theme => (
            <div key={theme.id} style={{ 
              minWidth: '280px', maxWidth: '300px', background: '#ffffff', borderRadius: '24px', 
              overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', 
              display: 'flex', flexDirection: 'column', position: 'relative',
              
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased'
            }}>
              
              <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2 }}>
                {theme.is_trending && (
                  <span style={{ background: '#ef4444', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 10px rgba(239,68,68,0.4)' }}>
                    <FaFire /> الأكثر طلباً
                  </span>
                )}
                {theme.is_vip && (
                  <span style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 10px rgba(217,119,6,0.4)' }}>
                    <FaCrown /> VIP
                  </span>
                )}
              </div>

              <div style={{ height: '200px', width: '100%', background: '#f8fafc', position: 'relative' }}>
                {theme.img_url ? (
                  <img src={theme.img_url} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable="false" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>بدون صورة</div>
                )}
              </div>
              
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                
                {/* 🌟 تاكات الأقسام تظهر فوق الاسم */}
                {theme.categories && theme.categories.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {theme.categories
                      .filter((cat: string) => cat !== 'vip' && cat !== 'trending') // فلترة الـ VIP والأكثر طلبا لأن إلها بادج خاص
                      .map((cat: string, index: number) => (
                        <span key={index} style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                          {cat}
                        </span>
                    ))}
                  </div>
                )}

                <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#1e293b', fontWeight: '900' }}>{theme.name}</h3>
                
                <div style={{ marginBottom: '15px', display: 'inline-block' }}>
                  {theme.is_vip && theme.extra_price > 0 ? (
                    <span style={{ color: '#d97706', fontSize: '14px', fontWeight: 'bold', background: '#fef3c7', padding: '4px 10px', borderRadius: '8px' }}>
                      + {theme.extra_price.toLocaleString()} د.ع إضافية 
                    </span>
                  ) : (
                    <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', background: '#dcfce7', padding: '4px 10px', borderRadius: '8px' }}>
                      مجاني (تدفع فقط سعر الباقة)
                    </span>
                  )}
                </div>

                <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6', flexGrow: 1 }}>{theme.description}</p>
                
<div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>                  <a href="#pricing-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, background: '#1e293b', color: '#fff', textDecoration: 'none', padding: '12px 0', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' }}>
                    شراء <FaShoppingBag />
                  </a>
                  <Link to={`/preview/${theme.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, background: '#f1f5f9', color: '#0ea5e9', textDecoration: 'none', padding: '12px 0', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' }}>
                    معاينة <FaEye />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}