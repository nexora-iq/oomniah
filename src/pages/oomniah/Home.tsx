import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

// 🌟 استيراد الأقسام المقسمة (Components)
import StoryAds from './StoryAds';
import HeroFeatures from './HeroFeatures';
import ThemesSection from './ThemesSection'; // (الملف اللي سويناه بالسلايدر)
import PricingSteps from './PricingSteps';
import VerifiedPagesSection from './VerifiedPagesSection';
import FAQContact from './FAQContact';

// الذاكرة المؤقتة (Memory Cache) للسرعة
let memoryThemesCache: any[] | null = null;
let memorySettingsCache: string | null = null;
let memoryPagesCache: any[] | null = null;

export default function Home() {
  const [themes, setThemes] = useState<any[]>([]);
  const [verifiedPages, setVerifiedPages] = useState<any[]>([]);
  const [marqueeText, setMarqueeText] = useState('');
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);

  // جلب البيانات من قاعدة البيانات دفعة واحدة
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الثيمات
        if (memoryThemesCache) {
          setThemes(memoryThemesCache);
        } else {
          const { data } = await supabase.from('themes').select('*').eq('status', 'active').order('created_at', { ascending: false });
          if (data) { setThemes(data); memoryThemesCache = data; }
        }
        setIsLoadingThemes(false);

        // جلب البيجات المعتمدة
        if (memoryPagesCache) {
          setVerifiedPages(memoryPagesCache);
        } else {
          const { data } = await supabase.from('verified_pages').select('*').order('created_at', { ascending: false });
          if (data) { setVerifiedPages(data); memoryPagesCache = data; }
        }

        // جلب الشريط المتحرك
        if (memorySettingsCache !== null) {
          setMarqueeText(memorySettingsCache);
        } else {
          const { data } = await supabase.from('settings').select('marquee_text_ar').eq('id', 1).single();
          if (data?.marquee_text_ar) { setMarqueeText(data.marquee_text_ar); memorySettingsCache = data.marquee_text_ar; }
        }
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#ffffff', minHeight: '100vh', paddingTop: '80px', userSelect: 'none' }}>
      
      {/* الشريط المتحرك (Marquee) */}
      {marqueeText && (
        <div style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '10px 0', borderBottom: '1px solid #fee2e2', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-block', animation: 'scrollText 20s linear infinite', color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>
            {marqueeText}
          </div>
        </div>
      )}

      {/* دمج المكونات هنا بكل نظافة وترتيب */}
      <HeroFeatures />
      
      <div id="story-ads-section" style={{ padding: '0 5%', marginBottom: '40px' }}>
        <StoryAds />
      </div>

      <ThemesSection themes={themes} isLoading={isLoadingThemes} />
      
      <PricingSteps />
      
      <VerifiedPagesSection verifiedPages={verifiedPages} />
      
      <FAQContact />

      <style>{`
        @keyframes scrollText { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}