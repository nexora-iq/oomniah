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
} from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

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
      // إعطاء وقت كافي للأنيميشن السينمائي (4 ثواني) إلا إذا ضغط المستخدم للتخطي
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

  // ✨ شاشة الدخول السينمائية الفخمة (Cinematic Splash Screen)
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
        .splash-logo-wrapper {
          position: relative; margin-bottom: 25px;
        }
        .splash-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 150%; height: 150%; 
          background: radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%);
          z-index: -1; animation: pulseGlow 3s infinite alternate;
        }
        .splash-logo {
          width: 110px; height: 110px; object-fit: contain;
          animation: cinematicScale 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          filter: drop-shadow(0 15px 30px rgba(220, 38, 38, 0.15));
        }
        .splash-brand {
          color: #dc2626; font-size: 42px; font-weight: 900; font-family: "Aref Ruqaa", serif;
          margin: 0 0 10px 0; opacity: 0; transform: translateY(20px); letter-spacing: 2px;
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }
        .splash-welcome {
          color: #1e293b; font-size: 26px; font-weight: 800; opacity: 0; transform: translateY(20px);
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }
        .splash-hint {
          position: absolute; bottom: 40px; color: #94a3b8; font-size: 14px; font-weight: bold; letter-spacing: 1px;
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
    <div style={posPage}>
      <style>{`
        body { background-color: #f8fafc; }
        .upload-btn-wrapper { position: relative; overflow: hidden; display: inline-block; width: 100%; }
        .upload-btn-styled { border: 2px dashed #cbd5e1; color: #64748b; background-color: #f8fafc; padding: 20px; border-radius: 12px; font-size: 14px; font-weight: bold; width: 100%; cursor: pointer; text-align: center; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
        .upload-btn-wrapper:hover .upload-btn-styled { background-color: #f1f5f9; border-color: #94a3b8; }
        .upload-btn-wrapper input[type=file] { font-size: 100px; position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; height: 100%; }
        
        .custom-input { padding: 14px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; width: 100%; transition: all 0.3s; background: #fff; box-sizing: border-box; }
        .custom-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        
        .interactive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; margin-top: 10px; }
        .interactive-card { border: 2px solid #e2e8f0; background: #fff; padding: 15px 10px; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; min-height: 80px; }
        .interactive-card:hover { border-color: #fca5a5; background: #fef2f2; transform: translateY(-2px); }
        .interactive-card.active { border-color: #dc2626; background: #dc2626; color: #fff; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.25); transform: translateY(-2px); }
        .interactive-card.active span, .interactive-card.active svg { color: #fff !important; }
        
        .gender-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }
        
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      
      <div style={topHeader}>
        <div style={logoArea}>
          <img src="/oomniah-logo.png" alt="أمنية" style={logoImage} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <h1 style={logoText}>أمنية</h1>
        </div>

        <div style={badgeArea}>
            <span style={badge}><FaStore /> {posName}</span>
            <span style={badgeAdmin}><FaUserCircle /> {adminName}</span>
            <button onClick={async () => {
               await supabase.from('system_logs').insert([{ admin_name: adminName, pos_name: posName, action_type: 'تسجيل خروج', details: `قام الموظف بتسجيل الخروج` }]);
               await supabase.auth.signOut();
               navigate('/secure-portal-access');
            }} style={logoutStyle}><FaSignOutAlt /> تسجيل خروج</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={formStyle}>
        
        {/* تحديد الجنس */}
        <div style={sectionBox}>
          <label style={label}><FaUser /> لمن الهدية؟ (جنس المستلم)</label>
          <div className="gender-grid">
            <div className={`interactive-card ${formData.recipient_gender === 'female' ? 'active' : ''}`} onClick={() => setFormData({...formData, recipient_gender: 'female'})}>
               <FaVenus style={{ fontSize: '24px', color: '#db2777' }} />
               <span style={{ fontWeight: 'bold' }}>أنثى</span>
            </div>
            <div className={`interactive-card ${formData.recipient_gender === 'male' ? 'active' : ''}`} onClick={() => setFormData({...formData, recipient_gender: 'male'})}>
               <FaMars style={{ fontSize: '24px', color: '#0284c7' }} />
               <span style={{ fontWeight: 'bold' }}>ذكر</span>
            </div>
          </div>
        </div>

        {/* اختيار الثيم */}
        <div style={sectionBox}>
          <label style={label}><FaPalette /> اختر الثيم المناسب</label>
          {filteredThemes.length === 0 ? (
            <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>لا توجد ثيمات متاحة حالياً.</p>
          ) : (
            <div className="interactive-grid">
              {filteredThemes.map(t => (
                <div 
                  key={t.id} 
                  className={`interactive-card ${formData.theme_id === t.id ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, theme_id: t.id})}
                >
                  <FaGift style={{ fontSize: '20px', color: '#94a3b8' }} className="theme-icon" />
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* اختيار المدة */}
        <div style={sectionBox}>
          <label style={label}><FaClock /> مدة الرابط والسعر</label>
          <div className="interactive-grid">
            {Object.entries(DURATION_PRICES).map(([key, val]) => (
              <div 
                key={key} 
                className={`interactive-card ${formData.duration_type === key ? 'active' : ''}`}
                onClick={() => setFormData({...formData, duration_type: key as DurationType})}
                style={key === 'trial' ? { borderStyle: 'dashed' } : {}}
              >
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{val.label}</span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>
                  {val.price.toLocaleString()} د.ع
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* الأسماء والرسالة */}
        <div style={sectionBox}>
          <div style={row}>
            <div style={group}>
              <label style={label}><FaPen /> اسم المُهدي</label>
              <input type="text" placeholder="مثال: علي" required onChange={e => setFormData({...formData, sender_name: e.target.value})} className="custom-input" />
            </div>
            <div style={group}>
              <label style={label}><FaPen /> اسم المستلم</label>
              <input type="text" placeholder="مثال: نور" required onChange={e => setFormData({...formData, recipient_name: e.target.value})} className="custom-input" />
            </div>
          </div>
          
          <div style={{ ...group, marginTop: '15px' }}>
            <label style={label}>رسالة المفاجأة...</label>
            <textarea placeholder="اكتب هنا الرسالة التي ستظهر للزبون..." required onChange={e => setFormData({...formData, message: e.target.value})} className="custom-input" style={{ height: '110px', resize: 'none' }} />
          </div>
        </div>

        {/* قسم الصوت */}
        <div style={audioBoxStyle}>
          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#1e293b' }}>
            <FaMusic style={{ color: '#dc2626' }} /> صوت المفاجأة (اختياري)
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <div className="upload-btn-wrapper">
               <div className="upload-btn-styled" style={audioFile ? { background: '#f0fdf4', borderColor: '#22c55e', color: '#16a34a' } : {}}>
                 <FaUpload style={{ fontSize: '24px' }} />
                 <span style={{ fontSize: '14px' }}>{audioFile ? `تم تجهيز ملف: ${audioFile.name}` : 'اضغط هنا لرفع ملف بصيغة MP3 (أقل من 3MB)'}</span>
               </div>
               <input type="file" accept=".mp3, audio/mpeg" disabled={!!formData.song_url} onChange={handleFileChange} />
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <hr style={{ flex: 1, border: '0', borderTop: '1px solid #cbd5e1' }} />
               <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>أو عبر رابط يوتيوب</span>
               <hr style={{ flex: 1, border: '0', borderTop: '1px solid #cbd5e1' }} />
             </div>

             <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
               <div style={{ flex: '1 1 200px', position: 'relative' }}>
                 <FaYoutube style={{ position: 'absolute', right: '15px', top: '15px', color: '#dc2626', fontSize: '18px' }} />
                 <input type="text" placeholder="رابط يوتيوب بدلاً من الملف" disabled={!!audioFile} value={formData.song_url} onChange={e => setFormData({...formData, song_url: e.target.value})} className="custom-input" style={{ background: audioFile ? '#f1f5f9' : '#fff', paddingRight: '45px' }} />
               </div>
               <input type="number" placeholder="ثانية البدء (مثال: 40)" onChange={e => setFormData({...formData, song_start_seconds: Number(e.target.value)})} className="custom-input" style={{ flex: '0 1 150px' }} />
             </div>
          </div>
        </div>

        {/* الفاتورة النهائية */}
        <div style={financeBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '16px', fontWeight: 'bold' }}>
              <FaMoneyBillWave style={{ color: '#10b981' }} /> المبلغ المطلوب من الزبون:
            </span>
            <strong style={{ color: '#dc2626', fontSize: '26px', fontWeight: '900' }}>{currentPrice.toLocaleString()} د.ع</strong>
          </div>
        </div>

        <button type="submit" disabled={isGenerating} style={isGenerating ? submitBtnDisabled : submitBtn}>
          {isGenerating ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><FaSpinner className="spinner" /> {uploadProgress}</span> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><FaLink /> توليد الرابط النهائي</span>}
        </button>
      </form>

      {/* مودل النجاح */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <FaCheckCircle style={{ color: '#10b981', fontSize: '60px', marginBottom: '15px' }} />
            <h2 style={{ color: '#1e293b', margin: '0 0 10px', fontWeight: '900' }}>تم التوليد بنجاح</h2>
            <p style={{ color: '#64748b', margin: '0 0 25px', fontSize: '15px' }}>
              {formData.duration_type === 'trial' ? 'الرابط التجريبي صالح لمدة 30 دقيقة فقط للتصوير' : 'انسخ الرابط الآن وأرسله للزبون'}
            </p>
            <div style={urlDisplay}>{generatedLink}</div>
            <button onClick={() => { navigator.clipboard.writeText(generatedLink); Toast.fire({ icon: 'success', title: 'تم نسخ الرابط!' }); setShowModal(false); }} style={copyBtn}>
              <FaCopy /> نسخ الرابط للمشاركة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// الستايلات المحدثة
const posPage: React.CSSProperties = { minHeight: '100vh', padding: '20px', direction: 'rtl', fontFamily: 'Tajawal, system-ui, -apple-system, sans-serif' };

const topHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '850px', margin: '0 auto 30px', flexWrap: 'wrap', gap: '15px', background: '#fff', padding: '15px 25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' };
const logoArea: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const logoImage: React.CSSProperties = { width: '40px', height: '40px', objectFit: 'contain' };
const logoText: React.CSSProperties = { fontSize: '24px', fontWeight: '900', color: '#dc2626', margin: 0, fontFamily: '"Aref Ruqaa", serif' };

const badgeArea: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' };
const badge: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' };
const badgeAdmin: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: '#ffffff', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' };
const logoutStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' };

const formStyle: React.CSSProperties = { background: '#ffffff', padding: '35px', borderRadius: '20px', maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '25px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0' };
const sectionBox: React.CSSProperties = { borderBottom: '1px solid #f1f5f9', paddingBottom: '25px' };
const row: React.CSSProperties = { display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' };
const group: React.CSSProperties = { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' };
const label: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#1e293b', fontWeight: '900', marginBottom: '5px' };

const audioBoxStyle: React.CSSProperties = { background: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const financeBoxStyle: React.CSSProperties = { background: '#f0fdf4', padding: '25px', borderRadius: '16px', border: '1px solid #bbf7d0' };

const submitBtn: React.CSSProperties = { background: '#dc2626', color: '#fff', padding: '18px', borderRadius: '14px', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)', marginTop: '10px' };
const submitBtnDisabled: React.CSSProperties = { ...submitBtn, background: '#fca5a5', cursor: 'not-allowed', boxShadow: 'none' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#fff', padding: '40px', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' };
const urlDisplay: React.CSSProperties = { background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#3b82f6', marginBottom: '25px', direction: 'ltr', overflowX: 'auto', fontSize: '15px', fontWeight: 'bold' };
const copyBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#dc2626', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', width: '100%', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' };