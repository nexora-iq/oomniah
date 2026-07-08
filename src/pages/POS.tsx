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
  const [sharePercentage, setSharePercentage] = useState<number>(0); 
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const [formData, setFormData] = useState({
    theme_id: '', sender_name: '', recipient_name: '', recipient_gender: 'female',
    song_url: '', song_start_seconds: 0, message: '', duration_type: 'daily' as DurationType
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/secure-portal-access');

      const { data: profile } = await supabase
        .from('profiles')
        .select('fullname, is_blocked')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        if (profile.is_blocked) {
          await supabase.auth.signOut();
          alert("🚫 حسابك محظور من قبل الإدارة! تم تسجيل خروجك فوراً.");
          return navigate('/secure-portal-access');
        }
        setAdminName(profile.fullname);
      }

      const { data: posData } = await supabase
        .from('points_of_sale')
        .select('id, name, share_percentage')
        .eq('slug', slug)
        .single();
        
      if (posData) {
        setPosId(posData.id);
        setPosName(posData.name);
        setSharePercentage(posData.share_percentage || 0);
      } else {
        setPosName(slug || 'نقطة بيع غير معروفة');
      }

      const { data: th } = await supabase
        .from('themes')
        .select('*')
        .eq('status', 'active');
        
      if (th) {
        setThemes(th);
        if (th.length > 0) setFormData(p => ({ ...p, theme_id: th[0].id }));
      }

      setLoading(false);
      setTimeout(() => setShowSplash(false), 3000);
    };
    init();
  }, [slug, navigate]);

  const currentPrice = DURATION_PRICES[formData.duration_type].price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selTheme = themes.find(t => t.id === formData.theme_id);
    const expiresAt = new Date();
    if (formData.duration_type === 'daily') expiresAt.setDate(expiresAt.getDate() + 1);
    else if (formData.duration_type === 'weekly') expiresAt.setDate(expiresAt.getDate() + 7);
    else expiresAt.setDate(expiresAt.getDate() + 30);

    const shortId = Math.random().toString(36).substring(2, 10);
    const { data: { session } } = await supabase.auth.getSession();
// 💰 إضافة البيانات المالية والأمنية الكاملة للرابط
    const { data, error } = await supabase.from('gift_links').insert([{
      pos_id: posId, 
      theme_id: formData.theme_id, 
      created_by: session?.user?.id,
      sender_name: formData.sender_name,
      recipient_name: formData.recipient_name, 
      recipient_gender: formData.recipient_gender,
      song_url: formData.song_url, 
      song_start_seconds: formData.song_start_seconds,
      message: formData.message, 
      duration_type: formData.duration_type,
      price: currentPrice,           // السعر اللي نستخدمه في الحسابات
      price_at_sale: currentPrice,   // <--- هذا هو العمود اللي مسبب المشكلة، ضفناه!
      pos_share_percentage: sharePercentage, 
      status: 'active', 
      is_cleared: false, 
      expires_at: expiresAt.toISOString(), 
      short_id: shortId
    }]).select('short_id').single();
    if (error) {
      alert(`حدث خطأ أثناء التوليد: ${error.message}`);
    } else if (data) {
      await supabase.from('system_logs').insert([{
        admin_name: adminName,
        pos_name: posName,
        action_type: 'توليد رابط',
        details: `توليد ثيم (${selTheme?.name}) للزبون ${formData.sender_name} | السعر: ${currentPrice} د.ع`
      }]);

      const themeSlug = selTheme?.slug || 'gift';
      setGeneratedLink(`${window.location.origin}/${themeSlug}/${data.short_id}`);
      setShowModal(true);
    }
  };

  if (showSplash || loading) return (
    <div style={splashContainer}>
      <style>{`
        @keyframes lineLoad { 0% { width: 0%; opacity: 0; } 20% { opacity: 1; } 80% { width: 250px; opacity: 1; } 100% { width: 100vw; opacity: 0; } }
        @keyframes textFade { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .luxury-line { height: 3px; background: #ff69b4; box-shadow: 0 0 15px rgba(255,105,180,0.6); animation: lineLoad 3s cubic-bezier(0.77, 0, 0.175, 1) forwards; margin: 30px auto 0; }
        .fade-in { opacity: 0; animation: textFade 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .delay-1 { animation-delay: 0.3s; }
        .delay-2 { animation-delay: 0.6s; }
      `}</style>
      <div style={{ textAlign: 'center' }}>
        <p className="fade-in" style={{ color: '#ff69b4', fontSize: '14px', letterSpacing: '4px', margin: '0 0 10px', textTransform: 'uppercase', fontWeight: 'bold' }}>System Access</p>
        <h1 className="fade-in delay-1" style={{ color: '#333', fontSize: '32px', margin: '0 0 10px' }}>أهلاً بك، {adminName}</h1>
        <p className="fade-in delay-2" style={{ color: '#888', fontSize: '18px', margin: 0 }}>جاري تهيئة النظام :<span style={{ color: '#ff69b4', fontWeight: 'bold' }}>{posName}</span></p>
        <div className="luxury-line"></div>
      </div>
    </div>
  );

  return (
    <div style={posPage}>
      <div style={topHeader}>
        <div style={badgeArea}>
            <span style={badge}>🏪 {posName}</span>
            <span style={badgeAdmin}>👤 {adminName}</span>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => navigate('/secure-portal-access'))} style={logoutStyle}>تسجيل خروج</button>
      </div>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={row}>
          <div style={group}>
            <label style={label}>نوع الثيم</label>
            <select name="theme_id" value={formData.theme_id} onChange={e => setFormData({...formData, theme_id: e.target.value})} style={input}>
              {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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

        <div style={row}>
           <input type="text" placeholder="اسم المُهدي" required onChange={e => setFormData({...formData, sender_name: e.target.value})} style={input} />
           <input type="text" placeholder="اسم المستلم" required onChange={e => setFormData({...formData, recipient_name: e.target.value})} style={input} />
        </div>

        <textarea placeholder="رسالة المفاجأة..." required onChange={e => setFormData({...formData, message: e.target.value})} style={{...input, height: '100px', resize: 'none'}} />

        <div style={row}>
           <input type="text" placeholder="رابط الأغنية" required onChange={e => setFormData({...formData, song_url: e.target.value})} style={{...input, flex: 2}} />
           <input type="number" placeholder="البدء (ث)" onChange={e => setFormData({...formData, song_start_seconds: Number(e.target.value)})} style={{...input, flex: 1}} />
        </div>

        {/* 📊 عرض السعر المطلوب من الزبون فقط */}
        <div style={financeBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#555', fontSize: '16px', fontWeight: 'bold' }}>المبلغ المطلوب من الزبون:</span>
            <strong style={{ color: '#ff69b4', fontSize: '20px' }}>{currentPrice.toLocaleString()} د.ع</strong>
          </div>
        </div>

        <button type="submit" style={submitBtn}>توليد الرابط 🔗</button>
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

// الستايلات الفاخرة
const splashContainer: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#ffffff', direction: 'rtl', fontFamily: 'sans-serif', zIndex: 9999 };
const posPage: React.CSSProperties = { background: '#ffffff', minHeight: '100vh', padding: '20px', direction: 'rtl', fontFamily: 'sans-serif' };
const topHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto 30px', flexWrap: 'wrap', gap: '15px' };
const badgeArea: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap' };
const badge: React.CSSProperties = { background: '#ffffff', color: '#ff69b4', border: '1px solid #ffd1dc', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' };
const badgeAdmin: React.CSSProperties = { background: '#ff69b4', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' };
const formStyle: React.CSSProperties = { background: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #ffe6f0', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 25px rgba(255, 105, 180, 0.08)' };
const input: React.CSSProperties = { padding: '14px', borderRadius: '8px', border: '1px solid #ffd1dc', fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#333', background: '#fff' };
const row: React.CSSProperties = { display: 'flex', gap: '15px', flexWrap: 'wrap' };
const group: React.CSSProperties = { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' };
const label: React.CSSProperties = { fontSize: '14px', color: '#666', fontWeight: 'bold' };
const submitBtn: React.CSSProperties = { background: '#ff69b4', color: '#fff', padding: '16px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px', transition: '0.3s' };
const logoutStyle: React.CSSProperties = { background: '#fff', color: '#d32f2f', border: '1px solid #ffcccc', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' };
const modalContent: React.CSSProperties = { background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #ff69b4', textAlign: 'center', width: '100%', maxWidth: '450px', boxShadow: '0 15px 40px rgba(255, 105, 180, 0.15)' };
const urlDisplay: React.CSSProperties = { background: '#fff', padding: '18px', borderRadius: '8px', border: '1px dashed #ff69b4', color: '#ff69b4', marginBottom: '25px', direction: 'ltr', overflowX: 'auto', fontSize: '16px' };
const copyBtn: React.CSSProperties = { background: '#ff69b4', color: '#fff', padding: '16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px', width: '100%' };
const financeBoxStyle: React.CSSProperties = { background: '#fff5f7', padding: '15px 20px', borderRadius: '12px', border: '1px solid #ffb3d9', marginTop: '10px' };