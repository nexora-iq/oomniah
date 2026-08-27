import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';
import { Toast } from '../toast';
import { QRCodeSVG } from 'qrcode.react'; 
import { 
  FaStore, FaUserCircle, FaSignOutAlt, FaVenus, FaMars, 
  FaPalette, FaClock, FaUser, FaGift, FaPen, FaMusic, 
  FaUpload, FaYoutube, FaMoneyBillWave, FaLink, 
  FaCheckCircle, FaCopy, FaSpinner, FaQrcode, FaDownload, 
  FaSave, FaFolderOpen, FaChartPie, FaCalendarDay, FaTicketAlt 
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
  const [platformPercentage, setPlatformPercentage] = useState<number>(50); 
  
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(''); 

  const [audioFile, setAudioFile] = useState<File | null>(null);

  // 🌟 حالات ميزة الباركود
  const [withBarcode, setWithBarcode] = useState(false);
  const [barcodeColor, setBarcodeColor] = useState('#000000');
  const [barcodeIcon, setBarcodeIcon] = useState(''); 

  // 🌟 حالات الإحصائيات الخاصة بالموظف
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [employeeStats, setEmployeeStats] = useState({ totalSales: 0, todaySales: 0, linksCount: 0, barcodeCount: 0 });

  // 🌟 حالات الكوبون
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

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
          Toast.fire({ icon: 'error', title: 'حسابك محظور من قبل الإدارة!' });
          return navigate('/secure-portal-access');
        }
        setAdminName(profile.fullname);
      }

      let currentBranchId = null;
      const { data: posData } = await supabase.from('pages').select('id, name, owner_percentage').eq('slug', slug).single();
      if (posData) {
        setPosId(posData.id);
        currentBranchId = posData.id; 
        setPosName(posData.name);
        setPlatformPercentage(Number(posData.owner_percentage) || 50); 
      } else {
        Toast.fire({ icon: 'error', title: 'خطأ أمني: رابط الفرع غير صالح.' });
        return navigate('/secure-portal-access');
      }

      const { data: th } = await supabase.from('themes').select('*').eq('status', 'active');
      if (th && th.length > 0) {
        const branchThemes = th.filter(theme => {
          const allowed = theme.allowed_pages;
          return !allowed || !Array.isArray(allowed) || allowed.length === 0 || allowed.includes(currentBranchId);
        });
        setThemes(branchThemes);
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

  // 🌟 دوال المسودة (Drafts)
  const saveDraft = () => {
    if (!formData.sender_name && !formData.message && !formData.song_url) {
      return Toast.fire({ icon: 'warning', title: 'لا توجد معلومات مهمة لحفظها كمسودة.' });
    }
    const draft = {
      sender_name: formData.sender_name,
      message: formData.message,
      song_url: formData.song_url,
      song_start_seconds: formData.song_start_seconds
    };
    localStorage.setItem('oomniah_pos_draft', JSON.stringify(draft));
    Toast.fire({ icon: 'success', title: 'تم حفظ المعلومات الحالية لتكرارها لاحقاً!' });
  };

  const loadDraft = () => {
    const draftStr = localStorage.getItem('oomniah_pos_draft');
    if (!draftStr) {
      return Toast.fire({ icon: 'info', title: 'لا توجد مسودة محفوظة مسبقاً.' });
    }
    const draft = JSON.parse(draftStr);
    setFormData(prev => ({
      ...prev,
      sender_name: draft.sender_name || prev.sender_name,
      message: draft.message || prev.message,
      song_url: draft.song_url || prev.song_url,
      song_start_seconds: draft.song_start_seconds || prev.song_start_seconds
    }));
    Toast.fire({ icon: 'success', title: 'تم استرجاع المعلومات بنجاح!' });
  };

  // 🌟 جلب إحصائيات الموظف
  const fetchEmployeeStats = async () => {
    setLoadingStats(true);
    setShowStatsModal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.from('gift_links').select('price, is_barcode, created_at').eq('creator_id', session.user.id);
      let totalSales = 0, todaySales = 0, barcodeCount = 0, linksCount = data?.length || 0;
      
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      data?.forEach(link => {
         const linkPrice = Number(link.price || 0);
         totalSales += linkPrice;
         if (link.is_barcode) barcodeCount++;
         if (link.created_at && link.created_at.startsWith(todayString)) todaySales += linkPrice;
      });

      setEmployeeStats({ totalSales, todaySales, barcodeCount, linksCount });
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'فشل جلب الإحصائيات' });
    }
    setLoadingStats(false);
  };

  // 🌟 دالة تطبيق الكوبون
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return Toast.fire({ icon: 'warning', title: 'الرجاء إدخال كود الخصم أولاً.' });
    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase.from('coupons').select('*').eq('code', couponInput.trim()).eq('status', 'active').single();
      
      if (error || !data) {
        Toast.fire({ icon: 'error', title: 'الكوبون غير صحيح أو غير فعال.' });
        setAppliedCoupon(null);
      } else {
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          Toast.fire({ icon: 'error', title: 'عذراً، هذا الكوبون منتهي الصلاحية.' });
          setAppliedCoupon(null);
        } else if (data.max_uses && data.used_count >= data.max_uses) {
          Toast.fire({ icon: 'error', title: 'تم تجاوز الحد الأقصى لاستخدام هذا الكوبون.' });
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(data);
          Toast.fire({ icon: 'success', title: 'تم تطبيق الخصم بنجاح! 🎉' });
        }
      }
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء فحص الكوبون.' });
    }
    setValidatingCoupon(false);
  };

  // 🌟 حساب الأسعار النهائية (شاملة الباركود والخصم)
  const originalBasePrice = DURATION_PRICES[formData.duration_type].price;
  const originalBarcodePrice = withBarcode && formData.duration_type !== 'trial' ? 3000 : 0;
  const originalTotalPrice = originalBasePrice + originalBarcodePrice;

  let discountAmount = 0;
  if (appliedCoupon && formData.duration_type !== 'trial') {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = originalTotalPrice * (appliedCoupon.discount_value / 100);
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
    if (discountAmount > originalTotalPrice) discountAmount = originalTotalPrice;
  }

  const finalPrice = originalTotalPrice - discountAmount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAudioFile(null);
      return;
    }
    if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith('.mp3')) {
      Toast.fire({ icon: 'error', title: 'يقبل ملفات (MP3) فقط!' });
      e.target.value = ''; 
      return;
    }
    const MAX_SIZE = 3 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      Toast.fire({ icon: 'error', title: 'حجم الملف كبير جداً! الأقصى 3 ميغا.' });
      e.target.value = '';
      return;
    }
    setAudioFile(file);
  };

  const handleLogout = async () => {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      try {
          await supabase.from('system_logs').insert([{ admin_name: adminName, pos_name: posName, action_type: 'تسجيل خروج', details: `قام الموظف بتسجيل الخروج` }]);
          await supabase.auth.signOut();
          navigate('/secure-portal-access');
      } catch (error) {
          Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء تسجيل الخروج.' });
          setIsLoggingOut(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return; 
    if (!posId || !formData.theme_id) { 
      Toast.fire({ icon: 'warning', title: 'يرجى اختيار الثيم.' }); 
      return; 
    }

    const { data: { session } } = await supabase.auth.getSession();

    setIsGenerating(true);
    setUploadProgress('جاري التجهيز...');

    let finalSongUrl = formData.song_url.trim();

    if (audioFile) {
      setUploadProgress('جاري الرفع...');
      const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.mp3`;

      const { error: uploadError } = await supabase.storage.from('songs').upload(uniqueFileName, audioFile);

      if (uploadError) {
        Toast.fire({ icon: 'error', title: 'فشل رفع الصوت.' });
        setIsGenerating(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(uniqueFileName);
      finalSongUrl = publicUrlData.publicUrl;
    }

    setUploadProgress('جاري التشفير...');

    const selTheme = themes.find(t => t.id === formData.theme_id);
    const expiresAt = new Date();
    
    if (formData.duration_type === 'trial') expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    else if (formData.duration_type === 'daily') expiresAt.setDate(expiresAt.getDate() + 1);
    else if (formData.duration_type === 'weekly') expiresAt.setDate(expiresAt.getDate() + 7);
    else if (formData.duration_type === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (formData.duration_type === 'two_months') expiresAt.setMonth(expiresAt.getMonth() + 2);
    else if (formData.duration_type === 'three_months') expiresAt.setMonth(expiresAt.getMonth() + 3);
    else if (formData.duration_type === 'permanent') expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    const shortId = Math.random().toString(36).substring(2, 10);
    const isCleared = formData.duration_type === 'trial'; 

    const platformRatio = platformPercentage / 100;
    const branchRatio = (100 - platformPercentage) / 100;

    const ownerCut = finalPrice * platformRatio; 
    const pageCut = finalPrice * branchRatio;  

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
      price: finalPrice, 
      price_at_sale: originalTotalPrice, 
      coupon_code: appliedCoupon ? appliedCoupon.code : null, 
      discount_amount: discountAmount,
      pos_share_percentage: platformPercentage, 
      owner_cut: ownerCut,
      page_cut: pageCut,
      status: 'active', 
      is_cleared: isCleared, 
      expires_at: expiresAt.toISOString(), 
      short_id: shortId,
      is_barcode: withBarcode 
    }]).select('short_id').single();

    if (error) {
      Toast.fire({ icon: 'error', title: `خطأ بالتوليد: ${error.message}` });
      setIsGenerating(false);
    } else if (data) {
      const themeSlug = selTheme?.slug || 'gift';
      const fullUrl = `${window.location.origin}/${themeSlug}/${data.short_id}`;

      const actionText = formData.duration_type === 'trial' ? 'توليد رابط تجريبي (تصوير)' : 'توليد رابط';
      let barcodeLog = withBarcode ? ' (+ باقة الباركود المميز)' : '';
      let couponLog = appliedCoupon ? ` (بخصم كوبون: ${appliedCoupon.code})` : '';
      
      await supabase.from('system_logs').insert([{
        admin_name: adminName, pos_name: posName, action_type: actionText,
        details: `توليد ثيم (${selTheme?.name})${barcodeLog}${couponLog} | السعر بعد الخصم: ${finalPrice} | حصة المنصة: ${ownerCut} | الرابط: ${fullUrl}`
      }]);
      
      if (appliedCoupon) {
        await supabase.from('coupons').update({ used_count: appliedCoupon.used_count + 1 }).eq('id', appliedCoupon.id);
      }

      setGeneratedLink(fullUrl);
      setShowModal(true);
      setIsGenerating(false);
      setAudioFile(null); 
    }
  };

  const generateTextIcon = (text: string, color: string) => {
    if (!text || text.trim() === '') return ''; 
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(60, 60, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '70px Arial'; 
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 60, 65);
    return canvas.toDataURL('image/png');
  };

  const downloadQRCode = () => {
    const svgElement = document.getElementById('barcode-to-download');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = 400;
    canvas.height = 400;
    img.onload = () => {
      if(ctx) {
         ctx.fillStyle = '#ffffff';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.strokeStyle = '#f1f5f9';
         ctx.lineWidth = 10;
         ctx.strokeRect(5, 5, 390, 390);
         ctx.drawImage(img, 50, 50, 300, 300);
         ctx.font = 'bold 24px Tajawal, Arial, sans-serif';
         ctx.fillStyle = '#1e293b';
         ctx.textAlign = 'center';
         ctx.fillText('امسح الباركود لفتح هديتك 🎁', 200, 370);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Oomniah-Gift-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      Toast.fire({ icon: 'success', title: 'تم تحميل بطاقة الهدية بنجاح!' });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (showSplash || loading) return (
    <div className="splash-container" onClick={() => setShowSplash(false)}>
      <style>{`
        .splash-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; cursor: pointer; overflow: hidden; animation: splashOut 0.8s cubic-bezier(0.16, 1, 0.3, 1) 3.5s forwards; }
        .splash-logo-wrapper { position: relative; margin-bottom: 20px; }
        .splash-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150%; height: 150%; background: radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%); z-index: -1; animation: pulseGlow 3s infinite alternate; }
        .splash-logo { width: 90px; height: 90px; object-fit: contain; animation: cinematicScale 2s cubic-bezier(0.16, 1, 0.3, 1) forwards; filter: drop-shadow(0 15px 30px rgba(220, 38, 38, 0.15)); }
        .splash-brand { color: #dc2626; font-size: 32px; font-weight: 900; font-family: "Aref Ruqaa", serif; margin: 0 0 10px 0; opacity: 0; transform: translateY(20px); letter-spacing: 2px; animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards; }
        .splash-welcome { color: #1e293b; font-size: 20px; font-weight: 800; opacity: 0; transform: translateY(20px); animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards; }
        .splash-hint { position: absolute; bottom: 30px; color: #94a3b8; font-size: 13px; font-weight: bold; letter-spacing: 1px; opacity: 0; animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 1.5s forwards, pulseHint 2s infinite 2.5s; }
        @keyframes cinematicScale { 0% { transform: scale(0.7); opacity: 0; filter: blur(10px); } 100% { transform: scale(1); opacity: 1; filter: blur(0); } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes pulseGlow { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; } 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } }
        @keyframes pulseHint { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        @keyframes splashOut { 0% { opacity: 1; pointer-events: auto; } 100% { opacity: 0; pointer-events: none; visibility: hidden; } }
      `}</style>
      <div className="splash-logo-wrapper"><div className="splash-glow"></div><img src="/oomniah-logo.png" alt="أمنية" className="splash-logo" onError={(e) => { e.currentTarget.style.display = 'none' }} /></div>
      <h1 className="splash-brand">أُمنيــــة</h1>
      <h2 className="splash-welcome">أهلاً بك، <span style={{ color: '#dc2626' }}>{adminName || 'جاري التحميل...'}</span></h2>
      <div className="splash-hint">اضغط للتخطي</div>
    </div>
  );

  return (
    <div className="pos-page-wrapper">
      <style>{`
        body { background-color: #f8fafc; margin: 0; padding: 0; }
        .pos-page-wrapper { min-height: 100vh; padding: 12px; direction: rtl; font-family: 'Tajawal', system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        button, a, .interactive-card, input, select, textarea { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
        .top-header { display: flex; justify-content: space-between; align-items: center; max-width: 850px; margin: 0 auto 15px; flex-wrap: wrap; gap: 10px; background: #fff; padding: 12px 16px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; }
        .form-container { background: #ffffff; padding: 16px; border-radius: 16px; max-width: 850px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
        .section-box { border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
        .custom-input { padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; width: 100%; transition: all 0.2s; background: #fff; box-sizing: border-box; }
        .custom-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .upload-btn-wrapper { position: relative; overflow: hidden; display: inline-block; width: 100%; }
        .upload-btn-styled { border: 2px dashed #cbd5e1; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 10px; font-size: 12px; font-weight: bold; width: 100%; cursor: pointer; text-align: center; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; }
        .upload-btn-wrapper input[type=file] { font-size: 100px; position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; height: 100%; width: 100%; }
        .interactive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 10px; margin-top: 8px; }
        .interactive-card { border: 2px solid #e2e8f0; background: #fff; padding: 12px 6px; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 6px; min-height: 80px; }
        .interactive-card:hover { border-color: #fca5a5; background: #fef2f2; }
        .interactive-card.active { border-color: #dc2626; background: #dc2626; color: #fff; box-shadow: 0 3px 10px rgba(220, 38, 38, 0.2); }
        .interactive-card.active span, .interactive-card.active svg { color: #fff !important; }
        .gender-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .spinner { animation: spin 0.8s linear infinite; }
        
        .barcode-toggle { display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: #fff; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 12px; font-weight: bold; font-size: 14px; color: #1e293b; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); margin-top: 5px; }
        .barcode-toggle.active { border-color: #dc2626; background: #fef2f2; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .barcode-settings { background: #fff8f8; border: 1px solid #fecaca; padding: 16px; border-radius: 12px; margin-top: 10px; }

        .draft-btn { display: flex; align-items: center; gap: 5px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .draft-btn:hover { background: #e2e8f0; color: #1e293b; }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (min-width: 640px) { .pos-page-wrapper { padding: 20px; } .top-header { padding: 15px 25px; margin-bottom: 25px; } .form-container { padding: 30px; gap: 24px; } .interactive-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; } .interactive-card { padding: 14px 10px; min-height: 90px; } .custom-input { padding: 12px 14px; font-size: 14px; } .upload-btn-styled { padding: 18px; font-size: 13px; } }
        @media (max-width: 480px) { .row-inputs { grid-template-columns: 1fr; } .top-header { flex-direction: column; align-items: stretch; text-align: center; } .header-badges { justify-content: center; } }
      `}</style>
      
      <div className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#dc2626', margin: 0, fontFamily: '"Aref Ruqaa", serif' }}>أمنية</h1>
        </div>
        <div className="header-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={fetchEmployeeStats} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', transition: 'all 0.2s' }}>
                <FaChartPie /> إحصائياتي
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}><FaStore /> {posName}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#dc2626', color: '#ffffff', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}><FaUserCircle /> {adminName}</span>
            <button onClick={handleLogout} disabled={isLoggingOut} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isLoggingOut ? '#f1f5f9' : '#fff', color: isLoggingOut ? '#94a3b8' : '#64748b', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', cursor: isLoggingOut ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '11px', transition: 'all 0.2s' }}>
                {isLoggingOut ? <FaSpinner className="spinner" /> : <FaSignOutAlt />}
                {isLoggingOut ? 'جاري الخروج...' : 'خروج'}
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '-10px' }}>
          <button type="button" onClick={saveDraft} className="draft-btn" title="حفظ الرسالة واسم المرسل والأغنية لاستخدامها في روابط أخرى">
            <FaSave style={{ color: '#10b981' }} /> حفظ كمسودة
          </button>
          <button type="button" onClick={loadDraft} className="draft-btn" title="استرجاع آخر معلومات قمت بحفظها">
            <FaFolderOpen style={{ color: '#0ea5e9' }} /> تعبئة من المسودة
          </button>
        </div>

        <div className="section-box">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}><FaUser /> لمن الهدية؟</label>
          <div className="gender-grid">
            <div className={`interactive-card ${formData.recipient_gender === 'female' ? 'active' : ''}`} onClick={() => setFormData({...formData, recipient_gender: 'female'})}>
               <FaVenus style={{ fontSize: '18px', color: '#db2777' }} /><span style={{ fontWeight: 'bold', fontSize: '12px' }}>أنثى</span>
            </div>
            <div className={`interactive-card ${formData.recipient_gender === 'male' ? 'active' : ''}`} onClick={() => setFormData({...formData, recipient_gender: 'male'})}>
               <FaMars style={{ fontSize: '18px', color: '#0284c7' }} /><span style={{ fontWeight: 'bold', fontSize: '12px' }}>ذكر</span>
            </div>
          </div>
        </div>

        <div className="section-box">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}><FaPalette /> اختر الثيم</label>
          {filteredThemes.length === 0 ? (
            <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>لا توجد ثيمات متاحة.</p>
          ) : (
            <div className="interactive-grid">
              {filteredThemes.map(t => (
                <div key={t.id} className={`interactive-card ${formData.theme_id === t.id ? 'active' : ''}`} onClick={() => setFormData({...formData, theme_id: t.id})}>
                  {t.img_url ? (
                    <img src={t.img_url} alt={t.name} style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                  ) : (
                    <FaGift style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '4px' }} />
                  )}
                  <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-box">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}><FaClock /> مدة الرابط والسعر</label>
          <div className="interactive-grid">
            {Object.entries(DURATION_PRICES).map(([key, val]) => (
              <div key={key} className={`interactive-card ${formData.duration_type === key ? 'active' : ''}`} onClick={() => setFormData({...formData, duration_type: key as DurationType})} style={key === 'trial' ? { borderStyle: 'dashed' } : {}}>
                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{val.label}</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>{val.price.toLocaleString()} د.ع</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-box">
          <div className="row-inputs">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}><FaPen /> اسم المُهدي</label>
              <input type="text" placeholder="مثال: علي" value={formData.sender_name} required onChange={e => setFormData({...formData, sender_name: e.target.value})} className="custom-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}><FaPen /> اسم المستلم</label>
              <input type="text" placeholder="مثال: نور" value={formData.recipient_name} required onChange={e => setFormData({...formData, recipient_name: e.target.value})} className="custom-input" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}>رسالة المفاجأة...</label>
            <textarea placeholder="الرسالة..." value={formData.message} required onChange={e => setFormData({...formData, message: e.target.value})} className="custom-input" style={{ height: '80px', resize: 'none' }} />
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#1e293b', fontSize: '13px', fontWeight: 'bold' }}>
            <FaMusic style={{ color: '#dc2626' }} /> صوت المفاجأة (اختياري)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div className="upload-btn-wrapper">
               <div className="upload-btn-styled" style={audioFile ? { background: '#f0fdf4', borderColor: '#22c55e', color: '#16a34a' } : {}}>
                 <FaUpload style={{ fontSize: '18px' }} /><span>{audioFile ? `تم: ${audioFile.name}` : 'رفع ملف MP3'}</span>
               </div>
               <input type="file" accept=".mp3, audio/mpeg" disabled={!!formData.song_url} onChange={handleFileChange} />
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <hr style={{ flex: 1, border: '0', borderTop: '1px solid #cbd5e1' }} />
               <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>أو يوتيوب</span>
               <hr style={{ flex: 1, border: '0', borderTop: '1px solid #cbd5e1' }} />
             </div>
             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               <div style={{ flex: '1 1 180px', position: 'relative' }}>
                 <FaYoutube style={{ position: 'absolute', right: '12px', top: '12px', color: '#dc2626', fontSize: '16px' }} />
                 <input type="text" placeholder="رابط يوتيوب" disabled={!!audioFile} value={formData.song_url} onChange={e => setFormData({...formData, song_url: e.target.value})} className="custom-input" style={{ background: audioFile ? '#f1f5f9' : '#fff', paddingRight: '36px' }} />
               </div>
               <input type="number" placeholder="الثواني" value={formData.song_start_seconds} onChange={e => setFormData({...formData, song_start_seconds: Number(e.target.value)})} className="custom-input" style={{ flex: '1 1 100px' }} />
             </div>
          </div>
        </div>

        <div>
          <div className={`barcode-toggle ${withBarcode ? 'active' : ''}`} onClick={() => setWithBarcode(!withBarcode)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaQrcode style={{ fontSize: '18px', color: withBarcode ? '#dc2626' : '#64748b' }} />
              <span>إضافة باقة الباركود المميز</span>
            </div>
            <div style={{ color: '#dc2626' }}>+ 3,000 د.ع</div>
          </div>

          {withBarcode && (
            <div className="barcode-settings">
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>تخصيص لون وشكل الباركود:</p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>لون الباركود</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <input type="color" value={barcodeColor} onChange={(e) => setBarcodeColor(e.target.value)} style={{ width: '28px', height: '28px', border: 'none', padding: 0, background: 'none', cursor: 'pointer' }} />
                    <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{barcodeColor}</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>إيموجي / حرف</label>
                  <input 
                    type="text" 
                    className="custom-input" 
                    placeholder="مثال: 🤍 أو O" 
                    maxLength={2} 
                    value={barcodeIcon} 
                    onChange={(e) => setBarcodeIcon(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '18px', padding: '8px' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🌟 نظام الكوبونات المفقود تم إرجاعه هنا */}
        {formData.duration_type !== 'trial' && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaTicketAlt style={{ color: '#0ea5e9' }} /> هل تملك كود خصم؟
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input 
                type="text" 
                placeholder="أدخل الكوبون هنا..." 
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                className="custom-input" 
                disabled={!!appliedCoupon}
                style={{ background: appliedCoupon ? '#f0fdf4' : '#fff' }}
              />
              {!appliedCoupon ? (
                <button type="button" onClick={handleApplyCoupon} disabled={validatingCoupon} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}>
                  {validatingCoupon ? <FaSpinner className="spinner" /> : 'تطبيق'}
                </button>
              ) : (
                <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                  إلغاء
                </button>
              )}
            </div>
            {appliedCoupon && (
              <p style={{ color: '#16a34a', fontSize: '12px', margin: '8px 0 0 0', fontWeight: 'bold' }}>
                🎉 تم خصم ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `${appliedCoupon.discount_value} د.ع`}) من السعر الكلي!
              </p>
            )}
          </div>
        )}

        <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bbf7d0', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 'bold' }}>
              <FaMoneyBillWave style={{ color: '#10b981' }} /> الإجمالي:
            </span>
            <div style={{ textAlign: 'left' }}>
              {appliedCoupon && formData.duration_type !== 'trial' ? (
                <>
                  <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '2px' }}>{originalTotalPrice.toLocaleString()} د.ع</div>
                  <strong style={{ color: '#16a34a', fontSize: '20px', fontWeight: '900' }}>{finalPrice.toLocaleString()} د.ع</strong>
                </>
              ) : (
                <>
                  {withBarcode && <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold', marginBottom: '2px' }}>الباقة + الباركود</div>}
                  <strong style={{ color: '#dc2626', fontSize: '20px', fontWeight: '900' }}>{finalPrice.toLocaleString()} د.ع</strong>
                </>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={isGenerating} style={{ background: isGenerating ? '#fca5a5' : '#dc2626', color: '#fff', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.25)', marginTop: '4px' }}>
          {isGenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaSpinner className="spinner" /> {uploadProgress}</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaLink /> {withBarcode ? 'توليد الرابط والباركود' : 'توليد الرابط'}</span>
          )}
        </button>
      </form>

      {showStatsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }}>
            <button onClick={() => setShowStatsModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaChartPie style={{ color: '#0ea5e9' }}/> إحصائياتي
            </h3>
            
            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                <FaSpinner className="spinner" style={{ fontSize: '30px', color: '#0ea5e9', marginBottom: '10px' }} />
                <div>جاري حساب المبيعات...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><FaMoneyBillWave/> إجمالي المبيعات الكلية:</span>
                  <span style={{ color: '#15803d', fontWeight: '900', fontSize: '18px' }}>{employeeStats.totalSales.toLocaleString()} د.ع</span>
                </div>
                
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0369a1', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><FaCalendarDay/> مبيعاتي لليوم:</span>
                  <span style={{ color: '#0284c7', fontWeight: '900', fontSize: '18px' }}>{employeeStats.todaySales.toLocaleString()} د.ع</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>روابط مولدة</div>
                    <div style={{ color: '#1e293b', fontSize: '20px', fontWeight: '900' }}>{employeeStats.linksCount}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>باقات باركود</div>
                    <div style={{ color: '#1e293b', fontSize: '20px', fontWeight: '900' }}>{employeeStats.barcodeCount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', textAlign: 'center', width: '100%', maxWidth: '360px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <FaCheckCircle style={{ color: '#10b981', fontSize: '48px', margin: '0 auto 10px', display: 'block' }} />
            <h3 style={{ color: '#1e293b', margin: '0 0 16px', fontWeight: '900', fontSize: '18px' }}>تم التوليد بنجاح</h3>
            
            {withBarcode ? (
              <>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
                  <QRCodeSVG 
                    id="barcode-to-download"
                    value={generatedLink} 
                    size={200} 
                    level="H" 
                    fgColor={barcodeColor} 
                    bgColor="#f8fafc"
                    style={{ margin: '0 auto', display: 'block' }}
                    imageSettings={barcodeIcon.trim() !== '' ? { 
                      src: generateTextIcon(barcodeIcon, barcodeColor), height: 45, width: 45, excavate: true 
                    } : undefined}
                  />
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '15px 0 0', fontWeight: 'bold' }}>امسح الباركود لفتح الهدية 🎁</p>
                  <button onClick={downloadQRCode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#1e293b', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', width: '100%', marginTop: '15px', transition: '0.2s' }}>
                    <FaDownload /> تحميل كبطاقة إهداء (صورة)
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: '13px' }}>{formData.duration_type === 'trial' ? 'الرابط التجريبي صالح 5 دقائق' : 'انسخ الرابط الآن'}</p>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#3b82f6', marginBottom: '16px', direction: 'ltr', overflowX: 'auto', fontSize: '13px', fontWeight: 'bold' }}>{generatedLink}</div>
                <button onClick={() => { navigator.clipboard.writeText(generatedLink); Toast.fire({ icon: 'success', title: 'تم نسخ الرابط!' }); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#dc2626', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', width: '100%', transition: 'all 0.2s', marginBottom: '10px' }}>
                  <FaCopy /> نسخ الرابط النصي
                </button>
              </>
            )}

            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: '#64748b', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', width: '100%', padding: '10px' }}>
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}