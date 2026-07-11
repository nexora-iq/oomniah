import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const DURATION_PRICES = {
  daily: { label: 'يومي', price: 5000 },
  weekly: { label: 'أسبوعي', price: 10000 },
  monthly: { label: 'شهري', price: 15000 }
};

type DurationType = 'daily' | 'weekly' | 'monthly';

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
          alert("🚫 حسابك محظور من قبل الإدارة! تم تسجيل خروجك فوراً.");
          return navigate('/secure-portal-access');
        }
        setAdminName(profile.fullname);
      }

      const { data: posData } = await supabase.from('points_of_sale').select('id, name').eq('slug', slug).single();
      if (posData) {
        setPosId(posData.id);
        setPosName(posData.name);
      } else {
        alert("⚠️ خطأ أمني: رابط الفرع هذا غير مسجل في النظام.");
        return navigate('/secure-portal-access');
      }

      const { data: th } = await supabase.from('themes').select('*').eq('status', 'active');
      if (th && th.length > 0) {
        setThemes(th);
      }

      setLoading(false);
      setTimeout(() => setShowSplash(false), 2000);
    };
    init();
  }, [slug, navigate]);

  // 🎯 تصفية الثيمات ديناميكياً بناءً على الجنس المختار
  const filteredThemes = themes.filter(t => 
    !t.gender || t.gender === 'all' || t.gender === formData.recipient_gender
  );

  // ⚡ إعادة تعيين الثيم المختار تلقائياً عند تغيير الجنس لمنع الأخطاء
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
      alert("❌ نعتذر، النظام يقبل ملفات بصيغة (MP3) فقط!");
      e.target.value = ''; 
      return;
    }

    // 🚀 تم رفع الحد الأقصى إلى 3 ميغابايت (3 * 1024 * 1024)
    const MAX_SIZE = 3 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      alert("❌ حجم الملف كبير جداً! الحد الأقصى المسموح به هو 3 ميغابايت لضمان سرعة إرسال الهدية.");
      e.target.value = '';
      return;
    }

    setAudioFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return; 
    if (!posId || !formData.theme_id) { alert("خطأ: بيانات الفرع أو الثيم غير مكتملة."); return; }

    setIsGenerating(true);
    setUploadProgress('جاري تجهيز البيانات...');

    let finalSongUrl = formData.song_url.trim();

    if (audioFile) {
      setUploadProgress('جاري رفع ملف الـ MP3 للمخزن... 📤');
      const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.mp3`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('songs')
        .upload(uniqueFileName, audioFile);

      if (uploadError) {
        alert(`❌ فشل رفع ملف الصوت: ${uploadError.message}`);
        setIsGenerating(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(uniqueFileName);
      finalSongUrl = publicUrlData.publicUrl;
    }

    setUploadProgress('جاري تشفير وتوليد الرابط النهائي... 🔗');

    const selTheme = themes.find(t => t.id === formData.theme_id);
    const expiresAt = new Date();
    if (formData.duration_type === 'daily') expiresAt.setDate(expiresAt.getDate() + 1);
    else if (formData.duration_type === 'weekly') expiresAt.setDate(expiresAt.getDate() + 7);
    else expiresAt.setDate(expiresAt.getDate() + 30);

    const shortId = Math.random().toString(36).substring(2, 10);
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.from('gift_links').insert([{
      pos_id: posId, theme_id: formData.theme_id, created_by: session?.user?.id,
      sender_name: formData.sender_name.trim(), recipient_name: formData.recipient_name.trim(), recipient_gender: formData.recipient_gender,
      song_url: finalSongUrl, song_start_seconds: Number(formData.song_start_seconds) || 0,
      message: formData.message.trim(), duration_type: formData.duration_type,
      price: currentPrice, price_at_sale: currentPrice, pos_share_percentage: 0,
      status: 'active', is_cleared: false, expires_at: expiresAt.toISOString(), short_id: shortId
    }]).select('short_id').single();

    if (error) {
      alert(`حدث خطأ أثناء التوليد: ${error.message}`);
      setIsGenerating(false);
    } else if (data) {
      const themeSlug = selTheme?.slug || 'gift';
      const fullUrl = `${window.location.origin}/${themeSlug}/${data.short_id}`;

      await supabase.from('system_logs').insert([{
        admin_name: adminName, 
        pos_name: posName, 
        action_type: 'توليد رابط',
        details: `توليد ثيم (${selTheme?.name}) للزبون (${formData.sender_name}) | السعر: ${currentPrice} د.ع | معرف الرابط: ${data.short_id} | الرابط المباشر: ${fullUrl}`
      }]);
      setGeneratedLink(fullUrl);
      setShowModal(true);
      setIsGenerating(false);
      setAudioFile(null); 
    }
  };

  if (showSplash || loading) return <div style={splashContainer}><h1 style={{ color: '#333' }}>أهلاً بك، {adminName}</h1></div>;

  return (
    <div style={posPage}>
      <style>{`
        .upload-btn-wrapper { position: relative; overflow: hidden; display: inline-block; width: 100%; }
        .upload-btn-styled { border: 2px dashed #ffb3d9; color: #ff69b4; background-color: #fff5f7; padding: 15px; border-radius: 12px; font-size: 14px; font-weight: bold; width: 100%; cursor: pointer; text-align: center; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
        .upload-btn-wrapper:hover .upload-btn-styled { background-color: #ffeef2; border-color: #ff69b4; }
        .upload-btn-wrapper input[type=file] { font-size: 100px; position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; height: 100%; }
        .spinner { border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      
      <div style={topHeader}>
        <div style={badgeArea}>
            <span style={badge}>🏪 {posName}</span>
            <span style={badgeAdmin}>👤 {adminName}</span>
        </div>
        <button onClick={async () => {
           await supabase.from('system_logs').insert([{ admin_name: adminName, pos_name: posName, action_type: 'تسجيل خروج', details: `قام الموظف بتسجيل الخروج` }]);
           await supabase.auth.signOut();
           navigate('/secure-portal-access');
        }} style={logoutStyle}>تسجيل خروج</button>
      </div>

      <form onSubmit={handleSubmit} style={formStyle}>
        
        {/* الصف الأول: معلومات الحساب والمدد */}
        <div style={row}>
          <div style={group}>
            <label style={label}>جنس المستلم 👤</label>
            <select value={formData.recipient_gender} onChange={e => setFormData({...formData, recipient_gender: e.target.value})} style={input}>
              <option value="female">أنثى 🩷</option>
              <option value="male">ذكر 🩵</option>
            </select>
          </div>
          
          <div style={group}>
            <label style={label}>نوع الثيم المتاح (مفلتر تلقائياً)</label>
            <select name="theme_id" value={formData.theme_id} onChange={e => setFormData({...formData, theme_id: e.target.value})} style={input}>
              {filteredThemes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              {filteredThemes.length === 0 && <option value="">لا توجد ثيمات متاحة لهذا الجنس</option>}
            </select>
          </div>

          <div style={group}>
            <label style={label}>المدة والسعر</label>
            <select name="duration_type" value={formData.duration_type} onChange={e => setFormData({...formData, duration_type: e.target.value as DurationType})} style={input}>
              <option value="daily">يومي (5,000 د.ع)</option>
              <option value="weekly">أسبوعي (10,000 د.ع)</option>
              <option value="monthly">شهري (15,000 د.ع)</option>
            </select>
          </div>
        </div>

        {/* الصف الثاني: الأسماء */}
        <div style={row}>
          <div style={group}>
            <label style={label}>اسم المُهدي</label>
            <input type="text" placeholder="مثال: علي"  required onChange={e => setFormData({...formData, sender_name: e.target.value})} style={input} />
          </div>
          <div style={group}>
            <label style={label}>اسم المستلم</label>
            <input type="text" placeholder="مثال: نور" required onChange={e => setFormData({...formData, recipient_name: e.target.value})} style={input} />
          </div>
        </div>

        <div style={group}>
          <label style={label}>رسالة المفاجأة...</label>
          <textarea placeholder="اكتب هنا الرسالة التي ستظهر للزبون..." required onChange={e => setFormData({...formData, message: e.target.value})} style={{...input, height: '100px', resize: 'none'}} />
        </div>

        {/* 🎵 قسم الصوت */}
        <div style={{ background: '#fafafa', padding: '18px', borderRadius: '12px', border: '1px solid #ebebeb' }}>
          <label style={{ ...label, display: 'block', marginBottom: '12px', color: '#111', fontSize: '14px' }}>🎵 صوت المفاجأة (اختياري)</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <div className="upload-btn-wrapper">
               <div className="upload-btn-styled" style={audioFile ? { background: '#e6f9f0', borderColor: '#00cc66', color: '#00aa55' } : {}}>
                 <span style={{ fontSize: '24px' }}>{audioFile ? '✅' : '📤'}</span>
<span>{audioFile ? `تم تجهيز ملف: ${audioFile.name}` : 'اضغط هنا لرفع ملف بصيغة MP3 (أقل من 3MB)'}</span>
               </div>
               <input type="file" accept=".mp3, audio/mpeg" disabled={!!formData.song_url} onChange={handleFileChange} />
             </div>
             
             <div style={{ textAlign: 'center', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>أو</div>

             <input type="text" placeholder="استخدام رابط يوتيوب بدلاً من الملف" disabled={!!audioFile} value={formData.song_url} onChange={e => setFormData({...formData, song_url: e.target.value})} style={{...input, background: audioFile ? '#f0f0f0' : '#fff'}} />
             <input type="number" placeholder="ثانية بدء الأغنية (مثال: 40)" onChange={e => setFormData({...formData, song_start_seconds: Number(e.target.value)})} style={{...input, maxWidth: '200px', alignSelf: 'flex-end'}} />
          </div>
        </div>

        <div style={financeBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#555', fontSize: '16px', fontWeight: 'bold' }}>المبلغ المطلوب من الزبون:</span>
            <strong style={{ color: '#ff69b4', fontSize: '20px' }}>{currentPrice.toLocaleString()} د.ع</strong>
          </div>
        </div>

        <button type="submit" disabled={isGenerating} style={isGenerating ? submitBtnDisabled : submitBtn}>
          {isGenerating ? <><span className="spinner"></span> {uploadProgress}</> : 'توليد الرابط 🔗'}
        </button>
      </form>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ color: '#ff69b4', margin: '0 0 10px' }}>تم التوليد بنجاح ✨</h2>
            <p style={{ color: '#666', margin: '0 0 20px' }}>انسخ الرابط الآن لإرساله للزبون</p>
            <div style={urlDisplay}>{generatedLink}</div>
            <button onClick={() => { navigator.clipboard.writeText(generatedLink); alert('تم النسخ!'); setShowModal(false); }} style={copyBtn}>نسخ الرابط 📋</button>
          </div>
        </div>
      )}
    </div>
  );
}

// الستايلات الثابتة
const splashContainer: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff' };
const posPage: React.CSSProperties = { background: '#ffffff', minHeight: '100vh', padding: '20px', direction: 'rtl', fontFamily: 'sans-serif' };
const topHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto 30px', flexWrap: 'wrap', gap: '15px' };
const badgeArea: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap' };
const badge: React.CSSProperties = { background: '#ffffff', color: '#ff69b4', border: '1px solid #ffd1dc', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' };
const badgeAdmin: React.CSSProperties = { background: '#ff69b4', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' };
const formStyle: React.CSSProperties = { background: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #ffe6f0', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 25px rgba(255, 105, 180, 0.08)' };
const input: React.CSSProperties = { padding: '14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const row: React.CSSProperties = { display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' };
const group: React.CSSProperties = { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' };
const label: React.CSSProperties = { fontSize: '13px', color: '#666', fontWeight: 'bold' };
const submitBtn: React.CSSProperties = { background: '#ff69b4', color: '#fff', padding: '16px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' };
const submitBtnDisabled: React.CSSProperties = { ...submitBtn, background: '#ffb3d9', cursor: 'not-allowed' };
const logoutStyle: React.CSSProperties = { background: '#fff', color: '#d32f2f', border: '1px solid #ffcccc', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #ff69b4', textAlign: 'center', width: '90%', maxWidth: '450px' };
const urlDisplay: React.CSSProperties = { background: '#fff', padding: '18px', borderRadius: '8px', border: '1px dashed #ff69b4', color: '#ff69b4', marginBottom: '25px', direction: 'ltr', overflowX: 'auto' };
const copyBtn: React.CSSProperties = { background: '#ff69b4', color: '#fff', padding: '16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', width: '100%' };
const financeBoxStyle: React.CSSProperties = { background: '#fff5f7', padding: '15px 20px', borderRadius: '12px', border: '1px solid #ffb3d9', marginTop: '10px' };