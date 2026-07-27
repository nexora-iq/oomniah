import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';
import { Toast } from '../toast';
import { 
  FaStore, FaUserCircle, FaSignOutAlt, FaVenus, FaMars, 
  FaPalette, FaClock, FaUser, FaGift, FaPen, FaMusic, 
  FaUpload, FaYoutube, FaMoneyBillWave, FaLink, 
  FaCheckCircle, FaCopy, FaSpinner 
} from 'react-icons/fa';

const DURATION_PRICES = {
  daily: { label: 'يومي', price: 5000 },
  weekly: { label: 'أسبوعي', price: 10000 },
  monthly: { label: 'شهري', price: 15000 },
  two_months: { label: 'شهرين', price: 19000 },
  three_months: { label: '3 أشهر', price: 24000 },
  permanent: { label: 'دائمي', price: 50000 },
  trial: { label: 'تجريبي (تصوير)', price: 0 }
};

type DurationType = 'daily' | 'weekly' | 'monthly' | 'two_months' | 'three_months' | 'permanent' | 'trial';

export default function POS() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [showSplash, setShowSplash] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [posName, setPosName] = useState('');
  const [posId, setPosId] = useState<string | null>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false); 
  const [uploadProgress, setUploadProgress] = useState(''); 

  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    theme_id: '', sender_name: '', recipient_name: '', recipient_gender: 'female',
    song_url: '', song_start_seconds: 0, message: '', duration_type: 'daily' as DurationType
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/secure-portal-access');

      const { data: profile } = await supabase.from('profiles').select('fullname, is_blocked').eq('id', session.user.id).single();
      if (profile) {
        if (profile.is_blocked) {
          await supabase.auth.signOut();
          await Swal.fire({ icon: 'error', title: 'حسابك محظور!', text: 'تم حظرك من قبل الإدارة! تم تسجيل خروجك فوراً.', confirmButtonText: 'حسناً' });
          return navigate('/secure-portal-access');
        }
        setAdminName(profile.fullname);
      }

      const { data: posData } = await supabase.from('pages').select('id, name').eq('slug', slug).single();
      if (posData) {
        setPosId(posData.id);
        setPosName(posData.name);
      } else {
        await Swal.fire({ icon: 'error', title: 'خطأ أمني', text: 'رابط الفرع هذا غير مسجل في النظام.', confirmButtonText: 'رجوع' });
        return navigate('/secure-portal-access');
      }

      const { data: th } = await supabase.from('themes').select('*').eq('status', 'active');
      if (th && th.length > 0) {
        setThemes(th);
      }

      setLoading(false);
      setTimeout(() => setShowSplash(false), 4000); 
    };
    init();
  }, [slug, navigate]);

  const filteredThemes = themes.filter(t => 
    !t.gender || t.gender === 'all' || t.gender === formData.recipient_gender
  );

  useEffect(() => {
    if (filteredThemes.length > 0) {
      const isValid = filteredThemes.some(t => t.id === formData.theme_id);
      if (!isValid) {
        setFormData(prev => ({ ...prev, theme_id: filteredThemes[0].id }));
      }
    } else {
      setFormData(prev => ({ ...prev, theme_id: '' }));
    }
  }, [formData.recipient_gender, themes]);

  const currentPrice = DURATION_PRICES[formData.duration_type].price;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAudioFile(null);
      return;
    }
    
    if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith('.mp3')) {
      Toast.fire({ icon: 'error', title: 'نعتذر، النظام يقبل ملفات بصيغة (MP3) فقط!' });
      e.target.value = ''; 
      return;
    }

    const MAX_SIZE = 3 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      Toast.fire({ icon: 'error', title: 'حجم الملف كبير جداً! الحد الأقصى المسموح به هو 3 ميغابايت.' });
      e.target.value = '';
      return;
    }

    setAudioFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return; 
    if (!posId || !formData.theme_id) { 
      Toast.fire({ icon: 'warning', title: 'يرجى اختيار الثيم والتأكد من البيانات.' }); 
      return; 
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (formData.duration_type === 'trial') {
      setIsGenerating(true);
      setUploadProgress('جاري التحقق من الصلاحية...');
      
      const { data: lastTrial } = await supabase
        .from('gift_links')
        .select('created_at')
        .eq('created_by', session?.user?.id)
        .eq('duration_type', 'trial')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastTrial) {
        const lastTrialTime = new Date(lastTrial.created_at).getTime();
        const now = new Date().getTime();
        const diffHours = (now - lastTrialTime) / (1000 * 60 * 60);
        
        if (diffHours < 15) {
          const remainingHours = Math.ceil(15 - diffHours);
          Swal.fire({ icon: 'error', title: 'غير مسموح', text: `لا يمكنك إنشاء رابط تجريبي الآن! يرجى الانتظار ${remainingHours} ساعة والمحاولة مجدداً.`, confirmButtonColor: '#dc2626' });
          setIsGenerating(false);
          return;
        }
      }
    }

    setIsGenerating(true);
    setUploadProgress('جاري تجهيز البيانات...');

    let finalSongUrl = formData.song_url.trim();

    if (audioFile) {
      setUploadProgress('جاري رفع ملف الـ MP3 للمخزن...');
      const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.mp3`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('songs')
        .upload(uniqueFileName, audioFile);

      if (uploadError) {
        Swal.fire({ icon: 'error', title: 'فشل الرفع', text: `فشل رفع ملف الصوت: ${uploadError.message}` });
        setIsGenerating(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(uniqueFileName);
      finalSongUrl = publicUrlData.publicUrl;
    }

    setUploadProgress('جاري تشفير وتوليد الرابط النهائي...');

    const selTheme = themes.find(t => t.id === formData.theme_id);
    const expiresAt = new Date();
    
    if (formData.duration_type === 'trial') expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    else if (formData.duration_type === 'daily') expiresAt.setDate(expiresAt.getDate() + 1);
    else if (formData.duration_type === 'weekly') expiresAt.setDate(expiresAt.getDate() + 7);
    else if (formData.duration_type === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (formData.duration_type === 'two_months') expiresAt.setMonth(expiresAt.getMonth() + 2);
    else if (formData.duration_type === 'three_months') expiresAt.setMonth(expiresAt.getMonth() + 3);
    else if (formData.duration_type === 'permanent') expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    const shortId = Math.random().toString(36).substring(2, 10);
    const isCleared = formData.duration_type === 'trial'; 

    const ownerCut = currentPrice * 0.5; 
    const pageCut = currentPrice * 0.5;  

    const { data, error } = await supabase.from('gift_links').insert([{
      page_id: posId,
      pos_id: posId, 
      theme_id: formData.theme_id, 
      created_by: session?.user?.id,
      creator_id: session?.user?.id,
      sender_name: formData.sender_name.trim(), 
      recipient_name: formData.recipient_name.trim(), 
      recipient_gender: formData.recipient_gender,
      song_url: finalSongUrl, 
      song_start_seconds: Number(formData.song_start_seconds) || 0,
      message: formData.message.trim(), 
      duration_type: formData.duration_type,
      price: currentPrice, 
      price_at_sale: currentPrice, 
      pos_share_percentage: 50,
      owner_cut: ownerCut,
      page_cut: pageCut,
      status: 'active', 
      is_cleared: isCleared, 
      expires_at: expiresAt.toISOString(), 
      short_id: shortId
    }]).select('short_id').single();

    if (error) {
      console.error("تفاصيل الخطأ:", error.message);
      Toast.fire({ icon: 'error', title: `حدث خطأ أثناء التوليد: ${error.message}` });
      setIsGenerating(false);
    } else if (data) {
      const themeSlug = selTheme?.slug || 'gift';
      const fullUrl = `${window.location.origin}/${themeSlug}/${data.short_id}`;

      const actionText = formData.duration_type === 'trial' ? 'توليد رابط تجريبي (تصوير)' : 'توليد رابط';
      await supabase.from('system_logs').insert([{
        admin_name: adminName, 
        pos_name: posName, 
        action_type: actionText,
        details: `توليد ثيم (${selTheme?.name}) | السعر: ${currentPrice} د.ع | معرف الرابط: ${data.short_id} | الرابط المباشر: ${fullUrl}`
      }]);
      
      setGeneratedLink(fullUrl);
      setShowModal(true);
      setIsGenerating(false);
      setAudioFile(null); 
    }
  };

  if (showSplash || loading) return (
    <div className="splash-container" onClick={() => setShowSplash(false)}>
      <style>{`
        .splash-container {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          z-index: 9999; cursor: pointer; overflow: hidden;
          animation: splashOut 0.8s cubic-bezier(0.16, 1, 0.3, 1) 3.5s forwards;
        }
        .splash-logo-wrapper { position: relative; margin-bottom: 20px; }
        .splash-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 150%; height: 150%; 
          background: radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%);
          z-index: -1; animation: pulseGlow 3s infinite alternate;
        }
        .splash-logo {
          width: 90px; height: 90px; object-fit: contain;
          animation: cinematicScale 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          filter: drop-shadow(0 15px 30px rgba(220, 38, 38, 0.15));
        }
        .splash-brand {
          color: #dc2626; font-size: 32px; font-weight: 900; font-family: "Aref Ruqaa", serif;
          margin: 0 0 10px 0; opacity: 0; transform: translateY(20px); letter-spacing: 2px;
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }
        .splash-welcome {
          color: #1e293b; font-size: 20px; font-weight: 800; opacity: 0; transform: translateY(20px);
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }
        .splash-hint {
          position: absolute; bottom: 30px; color: #94a3b8; font-size: 13px; font-weight: bold; letter-spacing: 1px;
          opacity: 0; animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 1.5s forwards, pulseHint 2s infinite 2.5s;
        }
        
        @keyframes cinematicScale { 0% { transform: scale(0.7); opacity: 0; filter: blur(10px); } 100% { transform: scale(1); opacity: 1; filter: blur(0); } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes pulseGlow { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; } 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } }
        @keyframes pulseHint { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        @keyframes splashOut { 0% { opacity: 1; pointer-events: auto; } 100% { opacity: 0; pointer-events: none; visibility: hidden; } }
      `}</style>
      
      <div className="splash-logo-wrapper">
        <div className="splash-glow"></div>
        <img src="/oomniah-logo.png" alt="أمنية" className="splash-logo" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>
      
      <h1 className="splash-brand">أُمنيــــة</h1>
      <h2 className="splash-welcome">أهلاً بك، <span style={{ color: '#dc2626' }}>{adminName || 'جاري التحميل...'}</span></h2>
      
      <div className="splash-hint">اضغط في أي مكان للتخطي</div>
    </div>
  );

  return (
    <div className="pos-page-wrapper">
      <style>{`
        body { background-color: #f8fafc; margin: 0; padding: 0; }
        .pos-page-wrapper { min-height: 100vh; padding: 12px; direction: rtl; font-family: 'Tajawal', system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        
        /* Header responsive */
        .top-header { display: flex; justify-content: space-between; align-items: center; max-width: 850px; margin: 0 auto 15px; flex-wrap: wrap; gap: 10px; background: #fff; padding: 12px 16px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; }
        
        /* Form Box */
        .form-container { background: #ffffff; padding: 16px; border-radius: 16px; max-width: 850px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
        
        .section-box { border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
        
        /* Inputs & Upload */
        .custom-input { padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; width: 100%; transition: all 0.2s; background: #fff; box-sizing: border-box; }
        .custom-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        
        .upload-btn-wrapper { position: relative; overflow: hidden; display: inline-block; width: 100%; }
        .upload-btn-styled { border: 2px dashed #cbd5e1; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 10px; font-size: 12px; font-weight: bold; width: 100%; cursor: pointer; text-align: center; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; }
        .upload-btn-wrapper input[type=file] { font-size: 100px; position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; height: 100%; width: 100%; }

        /* Grids optimization for Mobile */
        .interactive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(95px, 1fr)); gap: 8px; margin-top: 8px; }
        .interactive-card { border: 2px solid #e2e8f0; background: #fff; padding: 10px 6px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; min-height: 65px; }
        .interactive-card:hover { border-color: #fca5a5; background: #fef2f2; }
        .interactive-card.active { border-color: #dc2626; background: #dc2626; color: #fff; box-shadow: 0 3px 10px rgba(220, 38, 38, 0.2); }
        .interactive-card.active span, .interactive-card.active svg { color: #fff !important; }
        
        .gender-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Tablet & Desktop Adjustments */
        @media (min-width: 640px) {
          .pos-page-wrapper { padding: 20px; }
          .top-header { padding: 15px 25px; margin-bottom: 25px; }
          .form-container { padding: 30px; gap: 24px; }
          .section-box { padding-bottom: 20px; }
          .interactive-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; }
          .interactive-card { padding: 14px 10px; min-height: 75px; }
          .custom-input { padding: 12px 14px; font-size: 14px; }
          .upload-btn-styled { padding: 18px; font-size: 13px; }
        }

        /* Mobile specific adjustments */
        @media (max-width: 480px) {
          .row-inputs { grid-template-columns: 1fr; }
          .top-header { flex-direction: column; align-items: stretch; text-align: center; }
          .header-badges { justify-content: center; }
        }
      `}</style>
      
      {/* الهيدر العلوي */}
      <div className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#dc2626', margin: 0, fontFamily: '"Aref Ruqaa", serif' }}>أمنية</h1>
        </div>

        <div className="header-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}><FaStore /> {posName}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#dc2626', color: '#ffffff', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}><FaUserCircle /> {adminName}</span>
            <button onClick={async () => {
               await supabase.from('system_logs').insert([{ admin_name: adminName, pos_name: posName, action_type: 'تسجيل خروج', details: `قام الموظف بتسجيل الخروج` }]);
               await supabase.auth.signOut();
               navigate('/secure-portal-access');
            }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}><FaSignOutAlt /> خروج</button>
        </div>
      </div>

      {/* نموذج الإدخال */}
      <form onSubmit={handleSubmit} className="form-container">
        
        {/* تحديد الجنس */}
        <div className="section-box">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}><FaUser /> لمن الهدية؟</label>
          <div className="gender-grid">
            <div className={`interactive-card ${formData.recipient_gender === 'female' ? 'active' : ''}`} onClick={() => setFormData({...formData, recipient_gender: 'female'})}>
               <FaVenus style={{ fontSize: '18px', color: '#db2777' }} />
               <span style={{ fontWeight: 'bold', fontSize: '12px' }}>أنثى</span>
            </div>
            <div className={`interactive-card ${formData.recipient_gender === 'male' ? 'active' : ''}`} onClick={() => setFormData({...formData, recipient_gender: 'male'})}>
               <FaMars style={{ fontSize: '18px', color: '#0284c7' }} />
               <span style={{ fontWeight: 'bold', fontSize: '12px' }}>ذكر</span>
            </div>
          </div>
        </div>

        {/* اختيار الثيم */}
        <div className="section-box">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}><FaPalette /> اختر الثيم</label>
          {filteredThemes.length === 0 ? (
            <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>لا توجد ثيمات متاحة حالياً.</p>
          ) : (
            <div className="interactive-grid">
              {filteredThemes.map(t => (
                <div 
                  key={t.id} 
                  className={`interactive-card ${formData.theme_id === t.id ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, theme_id: t.id})}
                >
                  <FaGift style={{ fontSize: '16px', color: '#94a3b8' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* اختيار المدة */}
        <div className="section-box">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}><FaClock /> مدة الرابط والسعر</label>
          <div className="interactive-grid">
            {Object.entries(DURATION_PRICES).map(([key, val]) => (
              <div 
                key={key} 
                className={`interactive-card ${formData.duration_type === key ? 'active' : ''}`}
                onClick={() => setFormData({...formData, duration_type: key as DurationType})}
                style={key === 'trial' ? { borderStyle: 'dashed' } : {}}
              >
                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{val.label}</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                  {val.price.toLocaleString()} د.ع
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* الأسماء والرسالة */}
        <div className="section-box">
          <div className="row-inputs">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}><FaPen /> اسم المُهدي</label>
              <input type="text" placeholder="مثال: علي" required onChange={e => setFormData({...formData, sender_name: e.target.value})} className="custom-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}><FaPen /> اسم المستلم</label>
              <input type="text" placeholder="مثال: نور" required onChange={e => setFormData({...formData, recipient_name: e.target.value})} className="custom-input" />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}>رسالة المفاجأة...</label>
            <textarea placeholder="اكتب هنا الرسالة للزبون..." required onChange={e => setFormData({...formData, message: e.target.value})} className="custom-input" style={{ height: '80px', resize: 'none' }} />
          </div>
        </div>

        {/* قسم الصوت */}
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#1e293b', fontSize: '13px', fontWeight: 'bold' }}>
            <FaMusic style={{ color: '#dc2626' }} /> صوت المفاجأة (اختياري)
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div className="upload-btn-wrapper">
               <div className="upload-btn-styled" style={audioFile ? { background: '#f0fdf4', borderColor: '#22c55e', color: '#16a34a' } : {}}>
                 <FaUpload style={{ fontSize: '18px' }} />
                 <span>{audioFile ? `تم اختيار: ${audioFile.name}` : 'رفع ملف MP3 (أقل من 3MB)'}</span>
               </div>
               <input type="file" accept=".mp3, audio/mpeg" disabled={!!formData.song_url} onChange={handleFileChange} />
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <hr style={{ flex: 1, border: '0', borderTop: '1px solid #cbd5e1' }} />
               <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>أو عبر رابط يوتيوب</span>
               <hr style={{ flex: 1, border: '0', borderTop: '1px solid #cbd5e1' }} />
             </div>

             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               <div style={{ flex: '1 1 180px', position: 'relative' }}>
                 <FaYoutube style={{ position: 'absolute', right: '12px', top: '12px', color: '#dc2626', fontSize: '16px' }} />
                 <input type="text" placeholder="رابط يوتيوب" disabled={!!audioFile} value={formData.song_url} onChange={e => setFormData({...formData, song_url: e.target.value})} className="custom-input" style={{ background: audioFile ? '#f1f5f9' : '#fff', paddingRight: '36px' }} />
               </div>
               <input type="number" placeholder="البدء بالثواني (مثال: 40)" onChange={e => setFormData({...formData, song_start_seconds: Number(e.target.value)})} className="custom-input" style={{ flex: '1 1 100px' }} />
             </div>
          </div>
        </div>

        {/* الفاتورة النهائية */}
        <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 'bold' }}>
              <FaMoneyBillWave style={{ color: '#10b981' }} /> المبلغ المطلوب:
            </span>
            <strong style={{ color: '#dc2626', fontSize: '20px', fontWeight: '900' }}>{currentPrice.toLocaleString()} د.ع</strong>
          </div>
        </div>

        {/* زر التوليد */}
        <button 
          type="submit" 
          disabled={isGenerating} 
          style={{
            background: isGenerating ? '#fca5a5' : '#dc2626',
            color: '#fff',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 'bold',
            border: 'none',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.25)',
            marginTop: '4px'
          }}
        >
          {isGenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FaSpinner className="spinner" /> {uploadProgress}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FaLink /> توليد الرابط النهائي
            </span>
          )}
        </button>
      </form>

      {/* مودل النجاح */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', textAlign: 'center', width: '100%', maxWidth: '360px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
            <FaCheckCircle style={{ color: '#10b981', fontSize: '48px', marginBottom: '10px' }} />
            <h3 style={{ color: '#1e293b', margin: '0 0 6px', fontWeight: '900', fontSize: '18px' }}>تم التوليد بنجاح</h3>
            <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: '13px' }}>
              {formData.duration_type === 'trial' ? 'الرابط التجريبي صالح لمدة 30 دقيقة فقط للتصوير' : 'انسخ الرابط الآن وأرسله للزبون'}
            </p>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#3b82f6', marginBottom: '16px', direction: 'ltr', overflowX: 'auto', fontSize: '13px', fontWeight: 'bold' }}>{generatedLink}</div>
            <button onClick={() => { navigator.clipboard.writeText(generatedLink); Toast.fire({ icon: 'success', title: 'تم نسخ الرابط!' }); setShowModal(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#dc2626', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', width: '100%', transition: 'all 0.2s' }}>
              <FaCopy /> نسخ الرابط للمشاركة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}