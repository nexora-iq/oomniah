import React, { useState, useEffect, useRef } from 'react';
import StoryAds from './StoryAds';
import { supabase } from '../../supabase';
import { 
  FaHeart, FaMagic, FaStar, FaLock, FaPalette, FaBolt, FaGift, 
  FaHourglassHalf, FaImage, FaShoppingBag, FaEye, FaShoppingCart, 
  FaMoneyBillWave, FaInfinity, FaCreditCard, FaShieldAlt, FaCheckCircle, 
  FaLink, FaGlobe, FaInstagram, FaTiktok, FaHandshake, FaHeadset, 
  FaLightbulb, FaTimes, FaCheck 
} from 'react-icons/fa';

// 🌟 الذاكرة المؤقتة (Memory Cache)
let memoryThemesCache: any[] | null = null;
let memorySettingsCache: string | null = null;
let memoryPagesCache: any[] | null = null;

export default function Home() {
  const [themes, setThemes] = useState<any[]>([]);
  const [verifiedPages, setVerifiedPages] = useState<any[]>([]);
  const [marqueeText, setMarqueeText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // حالات البحث والسلايدر
  const [searchHandle, setSearchHandle] = useState('');
  const [verificationResult, setVerificationResult] = useState<null | 'verified' | 'not-found'>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  // جلب البيانات من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. جلب الثيمات
        if (memoryThemesCache) {
          setThemes(memoryThemesCache);
        } else {
          const { data: themesData } = await supabase
            .from('themes')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (themesData) {
            setThemes(themesData);
            memoryThemesCache = themesData;
          }
        }

        // 2. جلب البيجات المعتمدة (مع كامل بيانات المنصات والمدفوعات)
        if (memoryPagesCache) {
          setVerifiedPages(memoryPagesCache);
        } else {
          const { data: pagesData } = await supabase.from('verified_pages').select('*').order('created_at', { ascending: false });
          if (pagesData) {
            setVerifiedPages(pagesData);
            memoryPagesCache = pagesData;
          }
        }

        // 3. جلب نص الشريط المتحرك
        if (memorySettingsCache !== null) {
          setMarqueeText(memorySettingsCache);
        } else {
          const { data: settingsData } = await supabase.from('settings').select('marquee_text_ar').eq('id', 1).single();
          if (settingsData?.marquee_text_ar) {
            setMarqueeText(settingsData.marquee_text_ar);
            memorySettingsCache = settingsData.marquee_text_ar;
          }
        }

      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // نظام السلايدر التلقائي
  useEffect(() => {
    if (themes.length <= 1 || isSliderPaused) return;
    
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const scrollAmount = 340; 
        
        sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });

        if (Math.abs(scrollLeft) >= maxScroll - 10) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [themes.length, isSliderPaused]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
    }
  };

  const handleVerifyPage = () => {
    if (!searchHandle.trim()) {
      setVerificationResult(null);
      return;
    }
    const cleanSearch = searchHandle.trim().toLowerCase().replace('@', '');
    const found = verifiedPages.some(p => p.handle.toLowerCase().replace('@', '') === cleanSearch);
    setVerificationResult(found ? 'verified' : 'not-found');
  };

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#ffffff', minHeight: '100vh', paddingTop: '80px', userSelect: 'none' }}>
      
      {/* 1. الشريط المتحرك */}
      {marqueeText && (
        <div style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '10px 0', borderBottom: '1px solid #fee2e2', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-block', animation: 'scrollText 20s linear infinite', color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>
            {marqueeText}
          </div>
        </div>
      )}

      {/* 2. قسم الرئيسية (Hero) */}
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

      {/* 3. الشاشة الإعلانية (الستوريات) */}
      <div id="story-ads-section" style={{ padding: '0 5%', marginBottom: '40px' }}>
        <StoryAds />
      </div>

      {/* 4. لماذا نحن */}
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

      {/* 5. الثيمات المتوفرة */}
      <section id="themes-section" style={{ padding: '60px 0', background: '#ffffff' }}>
        <div style={{ padding: '0 5%' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            الثيمات المتوفرة <FaGift style={{ color: '#dc2626' }} />
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '18px', marginBottom: '40px' }}>اسحب لليمين واليسار لاستكشاف أجمل التصاميم التفاعلية.</p>
        </div>
        
        <div 
          ref={sliderRef}
          onMouseEnter={() => setIsSliderPaused(true)}
          onMouseLeave={() => setIsSliderPaused(false)}
          onTouchStart={() => setIsSliderPaused(true)}
          onTouchEnd={() => setIsSliderPaused(false)}
          className="themes-slider" 
          style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 5% 40px', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
        >
          {isLoading ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontSize: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              جاري تحميل الثيمات <FaHourglassHalf className="spin-icon" />
            </div>
          ) : themes.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontSize: '20px' }}>لا توجد ثيمات متوفرة حالياً.</div>
          ) : (
            themes.map(theme => (
              <div key={theme.id} style={{ minWidth: '320px', maxWidth: '320px', background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '220px', width: '100%', background: '#f1f5f9' }}>
                  {theme.img_url ? (
                    <img src={theme.img_url} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable="false" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '10px' }}>
                      لا توجد صورة <FaImage />
                    </div>
                  )}
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', color: '#1e293b', fontWeight: 'bold' }}>{theme.name}</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6', flexGrow: 1 }}>{theme.description || 'ثيم تفاعلي مميز لمناسباتكم السعيدة.'}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => scrollToSection('how-to-buy-section')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '10px 0', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }} className="btn-hover-red">
                      شراء الآن <FaShoppingBag />
                    </button>
                    <a href={`/themes/${theme.slug}/index.html`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, background: '#f1f5f9', color: '#0ea5e9', border: '1px solid #e0e7ff', textDecoration: 'none', padding: '10px 0', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', textAlign: 'center', transition: '0.2s' }} className="btn-hover-blue">
                      معاينة <FaEye />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 6. كيفية الشراء */}
      <section id="how-to-buy-section" style={{ padding: '60px 5% 20px', background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          كيفية الشراء <FaShoppingCart style={{ color: '#dc2626' }} />
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {[
            { step: '1', title: 'اختر الثيم', desc: 'تصفح قسم الثيمات واختر التصميم اللي يعبر عن مشاعرك.' },
            { step: '2', title: 'تواصل معنا', desc: 'إذا كنت تريد أن تعاملك معنا مباشرة فتواصل عبر حساباتنا الرسمية. أو إذا اشتريت عبر وكلائنا فيكون تعاملك معهم مباشرة.' },
            { step: '3', title: 'استلم هديتك', desc: 'استلم الرابط خلال نصف ساعة فقط من الدفع! (في أوقات الصيانة خلال 24 ساعة).' }
          ].map((item, index) => (
            <div key={index} style={{ textAlign: 'center', padding: '25px 15px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '50px', height: '50px', background: '#dc2626', color: '#fff', fontSize: '24px', fontWeight: 'bold', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>{item.step}</div>
              <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. الأسعار والباقات */}
      <section id="pricing-section" style={{ padding: '20px 5% 60px', background: '#f8fafc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* باقة 1 */}
          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>الباقة اليومية</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: يوم واحد</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>5,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> بدون دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>
          {/* باقة 2 */}
          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>الباقة الأسبوعية</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: أسبوع كامل</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>10,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>
          {/* باقة 3 */}
          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>الباقة الشهرية</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: شهر كامل</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>15,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>
          {/* باقة 4 */}
          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>باقة الشهرين</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: شهرين</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>19,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>
          {/* باقة 5 */}
          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #0ea5e9', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.1)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>باقة 3 شهور</h3>
            <p style={{ color: '#0ea5e9', fontSize: '14px', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>الأكثر توفيراً <FaMoneyBillWave /></p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>24,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>
          {/* باقة 6 */}
          <div style={{ background: '#dc2626', padding: '30px 20px', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '5px' }}>الباقة الدائمية</h3>
            <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>مدة الرابط: دائمي <FaInfinity /></p>
            <div style={{ fontSize: '24px', color: '#fff', fontWeight: '900', marginBottom: '20px' }}>50,000</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#fef2f2', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> نفس مميزات الباقات السابقة</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> تغيير المعلومات بأي وقت (بـ 5 آلاف فقط)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> إضافة رسالة صوتية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> دعم فني سريع</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 8. طرق الدفع */}
      <section id="payment-section" style={{ padding: '60px 5%', background: '#ffffff', textAlign: 'center', borderTop: '2px solid #f1f5f9' }}>
        <h2 style={{ fontSize: '32px', color: '#1e293b', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          طرق الدفع المتوفرة <FaCreditCard style={{ color: '#1e293b' }} />
        </h2>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px' }}>ندعم أشهر وسائل الدفع في العراق عبر بيجاتنا المعتمدة وتكون طرق الدفع مختلفة من بيج الى اخر.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '18px' }}>زين كاش</div>
          <div style={{ padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0ea5e9', fontSize: '18px' }}>ماستر كارد (Qi)</div>
          <div style={{ padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>تحويل رصيد اسيا</div>
        </div>
      </section>

      {/* 9. البيجات المعتمدة التفاعلية الكاملة */}
      <section id="verified-pages-section" style={{ padding: '60px 5%', background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            البيجات المعتمدة <FaShieldAlt style={{ color: '#dc2626' }} />
          </h2>
          
          <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fca5a5', marginBottom: '40px' }}>
            <p style={{ color: '#b91c1c', fontSize: '16px', margin: 0, fontWeight: 'bold', lineHeight: '1.6' }}>
              أي بيج يبيع ثيماتنا وغير موجود في هذه القائمة هو غير تابع لنا (احتيال). 
              <br/> يرجى إبلاغنا عنه فوراً وسنقدم لك <span style={{ textDecoration: 'underline' }}>مكافأة</span>! <FaGift style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
            </p>
          </div>

          {/* محرك البحث عن الوكيل */}
          <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto 30px' }}>
            <input 
              type="text" 
              placeholder="اكتب اليوزر (مثال: oomnia.1)" 
              value={searchHandle}
              onChange={(e) => setSearchHandle(e.target.value)}
              style={{ flex: 1, padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '16px', direction: 'ltr' }}
            />
            <button onClick={handleVerifyPage} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
              تحقق
            </button>
          </div>

          {verificationResult === 'verified' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#dcfce7', color: '#15803d', padding: '15px', borderRadius: '10px', marginBottom: '40px', fontWeight: 'bold', border: '1px solid #bbf7d0' }}>
              <FaCheckCircle style={{ fontSize: '20px' }} /> هذا الحساب معتمد ورسمي، يمكنك التعامل معه بأمان!
            </div>
          )}
          {verificationResult === 'not-found' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '40px', fontWeight: 'bold', border: '1px solid #fecaca' }}>
              <FaTimes style={{ fontSize: '20px' }} /> هذا الحساب غير موجود في قائمة وكلائنا، احذر التعامل معه!
            </div>
          )}

          {/* عرض بطاقات الوكلاء كاملة */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', textAlign: 'right' }}>
            {verifiedPages.length > 0 ? verifiedPages.map(page => (
              <div key={page.id} style={{ background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* رأس البطاقة */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                      {page.name} <FaCheckCircle style={{ color: '#0ea5e9', fontSize: '18px' }} />
                    </h3>
                    <span style={{ fontSize: '13px', color: '#64748b', direction: 'ltr', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                      @{page.handle}
                    </span>
                  </div>

                  {/* وصف الوكيل */}
                  {page.bio && (
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: '0 0 15px 0' }}>
                      {page.bio}
                    </p>
                  )}

                  {/* طرق الدفع عند الوكيل */}
                  {page.payment_methods && page.payment_methods.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>طرق الدفع المتوفرة:</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {page.payment_methods.map((pm: string, i: number) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '12px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                            <FaCreditCard /> {pm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* منصات التواصل الخاصة بالوكيل */}
                {page.platforms && page.platforms.length > 0 && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>تواصل عبر منصات الوكيل:</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {page.platforms.map((pl: { platform: string; link: string }, idx: number) => (
                        <a key={idx} href={pl.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1, minWidth: '80px',  background: '#0ea5e9', color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', transition: '0.2s' }}>
                          {pl.platform} <FaLink style={{ fontSize: '12px' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '30px 0', textAlign: 'center' }}>لا توجد بيجات معتمدة مضافة حالياً.</div>
            )}
          </div>
        </div>
      </section>

      {/* 10. صفحاتنا الرسمية */}
      <section id="official-pages-section" style={{ padding: '60px 5%', background: '#ffffff', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', color: '#1e293b', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          صفحاتنا الرسمية <FaGlobe style={{ color: '#0ea5e9' }} />
        </h2>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px' }}>تواصلوا معنا مباشرة عبر قنواتنا الوحيدة والرسمية.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <a href="https://www.instagram.com/oomnia.1/" style={{ textDecoration: 'none', padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#e1306c', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaInstagram style={{ fontSize: '24px' }} /> انستغرام
          </a>
          <a href="https://www.tiktok.com/@oomnia.1/" style={{ textDecoration: 'none', padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#000000', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaTiktok style={{ fontSize: '24px' }} /> تيك توك
          </a>
        </div>
      </section>

      {/* 11. الانضمام والوكالات */}
      <section id="join-us-section" style={{ padding: '60px 5%', background: '#f8fafc', borderTop: '2px solid #f1f5f9', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', padding: '40px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '32px', color: '#dc2626', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            كن جزءاً من عائلتنا <FaHandshake style={{ color: '#dc2626' }} />
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
            هل ترغب في الانضمام إلى Oomniah، أو شراء وكالة حصرية، أو حتى شراء حصة استثمارية من منصتنا؟ نرحب دائماً بالشركاء الجدد.
          </p>
          <button onClick={() => scrollToSection('official-pages-section')} style={{ background: '#0ea5e9', color: '#ffffff', border: 'none', padding: '14px 35px', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>تواصل معنا للتفاصيل</button>
        </div>
      </section>

     {/* 12. الدعم الفني والأسئلة الشائعة */}
      <section id="faq-section" style={{ padding: '60px 5% 80px', background: '#ffffff', borderTop: '2px solid #f1f5f9' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', color: '#1e293b', fontWeight: '900', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              الدعم الفني <FaHeadset style={{ color: '#1e293b' }} />
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>واجهت مشكلة؟ فريقنا متواجد لخدمتك. تواصل معنا عبر صفحاتنا الرسمية لأي استفسار تقني.</p>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            الأسئلة الشائعة <FaLightbulb style={{ color: '#fbbf24' }} />
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { 
                q: 'شنو هي منصة أمنية وشلون تشتغل؟', 
                a: 'أمنية هي منصة لإصدار وتوثيق المواقع والروابط التفاعلية والمناسبات السعيدة. نجهزلك رابط خاص يحتوي على ثيم تفاعلي ورسائلك الخاصة وموسيقى من اختيارك.' 
              },
              { 
                q: 'شلون يوصلني الرابط وبأي وقت ينتهي؟', 
                a: 'بعد إتمام الطلب مع متجرنا أو أحد وكلائنا المعتمدين، ينزلك الرابط السري خلال نصف ساعة فقط. أما مدة استمرار الرابط فتعتماد على الباقة اللي تختارها (يومية، أسبوعية، شهرية، أو دائمية).' 
              },
              { 
                q: 'شلون أضمن خصوصية بياناتي والرسائل الخاصة بالرابط؟', 
                a: 'نضمن لك الخصوصية والأمان التام، الرابط مالتك يكون مشفر ومخصص إلك، ولا يمكن لأي شخص الاطلاع عليه أو فتحه إلا من خلال الرابط المباشر اللي تتسلمه.' 
              },
              { 
                q: 'أقدر أعدل على الكلمات أو الموسيقى بعد ما أستلم الرابط؟', 
                a: 'نعم، التعديل متاح حسب باقتك. الباقة الدائمية تتيح لك التعديل بأي وقت مقابل أجور رمزية (5 آلاف دينار)، أما باقي الباقات فيتم تثبيت البيانات عند التسليم.' 
              },
              { 
                q: 'شلون أضمن إن البيج اللي اشتريت منه معتمد تابع لأمنية؟', 
                a: 'تقدر تتحقق من أي بيج أو وكيل من خلال قسم "البيجات المعتمدة" في موقعنا بمجرد البحث عن يوزر الحساب، وإذا كان غير موجود فهو غير تابع لنا.' 
              }
            ].map((faq, i) => (
              <details key={i} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{faq.q}</span>
                  <span style={{ color: '#dc2626', fontSize: '20px' }}>+</span>
                </summary>
                <p style={{ marginTop: '15px', color: '#64748b', lineHeight: '1.6', borderTop: '1px solid #e2e8f0', paddingTop: '15px', margin: '15px 0 0 0' }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      
      <style>{`
        @keyframes scrollText { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin-icon { animation: spin 2s linear infinite; }
        
        details > summary::-webkit-details-marker { display: none; }
        
        .themes-slider::-webkit-scrollbar { display: none; }
        .themes-slider { -ms-overflow-style: none; scrollbar-width: none; }
        
        .btn-hover-red:hover { background: #b91c1c !important; }
        .btn-hover-blue:hover { background: #e0f2fe !important; }
      `}</style>
    </div>
  );
}