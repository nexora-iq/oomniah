import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Toast } from '../../toast';
import Swal from 'sweetalert2'; // أضفنا Swal لرسائل التأكيد الأنيقة
import { 
  FaBullhorn, FaSave, FaMobileAlt, FaUpload, 
  FaTrash, FaShieldAlt, FaPlus, FaLink, 
  FaCreditCard, FaCheck, FaInstagram, FaTiktok, 
  FaFacebook, FaWhatsapp, FaTelegram, FaPlayCircle 
} from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

interface VerifiedPage {
  id: string;
  name: string;
  handle: string;
  bio: string;
  platforms: { platform: string; link: string }[];
  payment_methods: string[];
}

export default function SiteSettings() {
  // الشريط المتحرك
  const [marqueeAr, setMarqueeAr] = useState('');
  const [marqueeEn, setMarqueeEn] = useState('');
  const [isSavingMarquee, setIsSavingMarquee] = useState(false);

  // الستوريات
  const [stories, setStories] = useState<any[]>([]);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // 🛡️ البيجات المعتمدة (الوكلاء)
  const [verifiedPages, setVerifiedPages] = useState<VerifiedPage[]>([]);
  const [pageName, setPageName] = useState('');
  const [pageHandle, setPageHandle] = useState('');
  const [pageBio, setPageBio] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  
  // المنصات المضافة للوكيل الحالي
  const [platformsList, setPlatformsList] = useState<{ platform: string; link: string }[]>([
    { platform: 'Instagram', link: '' }
  ]);

  const availablePayments = ['زين كاش', 'ماستر كارد (Qi)', 'تحويل رصيد اسيا', 'كارتات كورك', 'تأمين مباشر'];
  const availablePlatforms = ['Instagram', 'TikTok', 'Facebook', 'WhatsApp', 'Telegram'];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <FaInstagram />;
      case 'TikTok': return <FaTiktok />;
      case 'Facebook': return <FaFacebook />;
      case 'WhatsApp': return <FaWhatsapp />;
      case 'Telegram': return <FaTelegram />;
      default: return <FaLink />;
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStories();
    fetchVerifiedPages();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('marquee_text_ar, marquee_text_en').eq('id', 1).single();
    if (data) {
      setMarqueeAr(data.marquee_text_ar || '');
      setMarqueeEn(data.marquee_text_en || '');
    }
  };

  const fetchStories = async () => {
    const { data } = await supabase.from('story_ads').select('*').order('created_at', { ascending: false });
    if (data) setStories(data);
  };

  const fetchVerifiedPages = async () => {
    const { data } = await supabase.from('verified_pages').select('*').order('created_at', { ascending: false });
    if (data) setVerifiedPages(data);
  };

  // حفظ نصوص الشريط
  const saveMarquee = async () => {
    setIsSavingMarquee(true);
    const { error } = await supabase.from('settings').upsert({ id: 1, marquee_text_ar: marqueeAr, marquee_text_en: marqueeEn });
    if (error) Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء الحفظ' });
    else Toast.fire({ icon: 'success', title: 'تم تحديث الشريط المتحرك بنجاح' });
    setIsSavingMarquee(false);
  };

  // رفع ستوري جديد للستورج
  const uploadStory = async () => {
    if (!storyFile) return;
    setIsUploadingStory(true);

    try {
      const fileExt = storyFile.name.split('.').pop();
      const fileName = `story_${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;
      
      const fileType = storyFile.type.startsWith('video/') ? 'video' : 'image';

      const { error: uploadError } = await supabase.storage.from('oomniah_media').upload(filePath, storyFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('oomniah_media').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from('story_ads').insert([{ media_url: urlData.publicUrl, type: fileType }]);
      if (dbError) throw dbError;

      Toast.fire({ icon: 'success', title: 'تم رفع الإعلان بنجاح' });
      setStoryFile(null);
      fetchStories();
    } catch (err: any) {
      Toast.fire({ icon: 'error', title: `خطأ في الرفع: ${err.message}` });
    }
    setIsUploadingStory(false);
  };

  const deleteStory = async (id: number) => {
    const result = await Swal.fire({
      title: 'حذف الإعلان؟',
      text: 'لن تتمكن من استرجاع هذا الإعلان.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      await supabase.from('story_ads').delete().eq('id', id);
      Toast.fire({ icon: 'success', title: 'تم حذف الإعلان' });
      fetchStories();
    }
  };

  // 🛡️ إداريات البيجات المعتمدة
  const handlePaymentToggle = (method: string) => {
    setSelectedPayments(prev => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const handlePlatformChange = (index: number, field: 'platform' | 'link', value: string) => {
    const updated = [...platformsList];
    updated[index][field] = value;
    setPlatformsList(updated);
  };

  const addPlatformRow = () => {
    setPlatformsList([...platformsList, { platform: 'TikTok', link: '' }]);
  };

  const removePlatformRow = (index: number) => {
    if (platformsList.length === 1) return;
    setPlatformsList(platformsList.filter((_, i) => i !== index));
  };

  const handleAddVerifiedPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageName || !pageHandle) {
      return Toast.fire({ icon: 'error', title: 'يرجى كتابة اسم البيج واليوزر' });
    }

    const cleanHandle = pageHandle.trim().replace(/^@/, '');
    
    // تصفية المنصات التي تحتوي على روابط فقط
    const validPlatforms = platformsList
      .filter(p => p.link.trim() !== '')
      .map(p => ({ platform: p.platform, link: p.link.trim() }));

    const { error } = await supabase.from('verified_pages').insert([
      {
        name: pageName.trim(),
        handle: cleanHandle,
        bio: pageBio.trim() || null,
        platforms: validPlatforms,
        payment_methods: selectedPayments
      }
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      Toast.fire({ icon: 'error', title: `خطأ: ${error.message}` });
    } else {
      Toast.fire({ icon: 'success', title: 'تمت إضافة البيج المعتمد بنجاح' });
      setPageName('');
      setPageHandle('');
      setPageBio('');
      setSelectedPayments([]);
      setPlatformsList([{ platform: 'Instagram', link: '' }]);
      fetchVerifiedPages();
    }
  };

  const handleDeletePage = async (id: string) => {
    const result = await Swal.fire({
      title: 'إلغاء الاعتماد؟',
      text: 'هل أنت متأكد من حذف هذا البيج من قائمة المعتمدين؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('verified_pages').delete().eq('id', id);
      if (!error) {
        Toast.fire({ icon: 'success', title: 'تم حذف البيج بنجاح' });
        fetchVerifiedPages();
      }
    }
  };

  return (
    <div className="fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .card { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .section-title { color: #1e293b; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 900; }
        
        .input-style { padding: 12px 15px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; background: #f8fafc; outline: none; width: 100%; box-sizing: border-box; transition: 0.3s; }
        .input-style:focus { border-color: #dc2626; background: #fff; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        
        .btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; background: #dc2626; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.3s; }
        .btn-primary:hover:not(:disabled) { background: #b91c1c; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.2); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        
        /* زر رفع الستوريات الأنيق */
        .upload-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 20px; border: 2px dashed #cbd5e1; border-radius: 16px; cursor: pointer; transition: all 0.3s; background: #f8fafc; text-align: center; }
        .upload-box:hover { border-color: #dc2626; background: #fef2f2; }
        .upload-box.filled { border-style: solid; border-color: #10b981; background: #f0fdf4; color: #059669; }
        
        .story-card { position: relative; min-width: 120px; height: 200px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: 0.3s; }
        .story-card:hover { transform: translateY(-3px); }
        .story-delete-btn { position: absolute; top: 8px; right: 8px; background: rgba(220, 38, 38, 0.9); color: #fff; border: none; borderRadius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); transition: 0.2s; border-radius: 50%; }
        .story-delete-btn:hover { background: #b91c1c; transform: scale(1.1); }

        /* Chips للتحديد */
        .chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 20px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: bold; cursor: pointer; transition: 0.2s; background: #fff; color: #475569; user-select: none; }
        .chip.active { background: #dcfce7; border-color: #16a34a; color: #15803d; }
        
        .data-table { width: 100%; border-collapse: collapse; text-align: right; }
        .data-table th { background: #f8fafc; padding: 15px; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
        .data-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; vertical-align: middle; }
        .data-table tr:hover td { background: #fef2f2; }
      `}</style>

      {/* قسم الشريط المتحرك */}
      <div className="card">
        <h3 className="section-title"><FaBullhorn style={{ color: '#dc2626' }} /> إعدادات الشريط المتحرك الإعلاني</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>النص باللغة العربية</label>
            <input type="text" value={marqueeAr} onChange={(e) => setMarqueeAr(e.target.value)} className="input-style" placeholder="أدخل النص العربي (اتركه فارغاً للإخفاء)" />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>النص باللغة الإنجليزية</label>
            <input type="text" value={marqueeEn} onChange={(e) => setMarqueeEn(e.target.value)} className="input-style" placeholder="Enter English text" dir="ltr" />
          </div>
        </div>
        <button onClick={saveMarquee} disabled={isSavingMarquee} className="btn-primary">
          <FaSave /> {isSavingMarquee ? 'جاري الحفظ...' : 'حفظ الشريط'}
        </button>
      </div>

      {/* قسم إدارة الستوريات الإعلانية */}
      <div className="card">
        <h3 className="section-title"><FaMobileAlt style={{ color: '#dc2626' }} /> إدارة الستوريات الإعلانية</h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
          
          {/* زر الرفع المطور */}
          <div style={{ flex: '1 1 300px' }}>
            <input type="file" id="story-upload" accept="image/*,video/*" onChange={(e) => setStoryFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            <label htmlFor="story-upload" className={`upload-box ${storyFile ? 'filled' : ''}`}>
              {storyFile ? (
                <>
                  <FaCheck style={{ fontSize: '24px', marginBottom: '10px' }} />
                  <span style={{ fontWeight: 'bold' }}>تم تحديد الملف:</span>
                  <span style={{ fontSize: '12px', marginTop: '5px' }} dir="ltr">{storyFile.name}</span>
                </>
              ) : (
                <>
                  <FaUpload style={{ fontSize: '28px', color: '#94a3b8', marginBottom: '10px' }} />
                  <span style={{ fontWeight: 'bold', color: '#475569' }}>اضغط هنا لاختيار صورة أو فيديو للستوري</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>يدعم صيغ الصور والفيديو القياسية</span>
                </>
              )}
            </label>
          </div>

          <button onClick={uploadStory} disabled={isUploadingStory || !storyFile} className="btn-primary" style={{ height: '50px', flex: '0 1 200px' }}>
            <FaUpload /> {isUploadingStory ? 'جاري الرفع...' : 'بدء الرفع'}
          </button>
        </div>

        {/* عرض الستوريات المرفوعة */}
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
          {stories.map((s) => (
            <div key={s.id} className="story-card">
              {s.type === 'video' ? (
                <>
                  <video src={s.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <FaPlayCircle style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.7)', fontSize: '30px', pointerEvents: 'none' }} />
                </>
              ) : (
                <img src={s.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <button onClick={() => deleteStory(s.id)} className="story-delete-btn" title="حذف الإعلان">
                <FaTrash style={{ fontSize: '12px' }} />
              </button>
            </div>
          ))}
          {stories.length === 0 && <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '20px 0' }}>لا توجد إعلانات مرفوعة حالياً.</div>}
        </div>
      </div>

      {/* 🛡️ قسم إدارة البيجات المعتمدة (الوكلاء) */}
      <div className="card">
        <h3 className="section-title"><FaShieldAlt style={{ color: '#dc2626' }} /> إدارة البيجات المعتمدة والوكلاء</h3>

        <form onSubmit={handleAddVerifiedPage} style={{ background: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>اسم البيج / الوكيل</label>
              <input type="text" placeholder="مثال: أمنية ستور" value={pageName} onChange={(e) => setPageName(e.target.value)} className="input-style" required />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>اليوزر (بدون @)</label>
              <input type="text" placeholder="مثال: oomnia.1" value={pageHandle} onChange={(e) => setPageHandle(e.target.value)} className="input-style" style={{ direction: 'ltr' }} required />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>وصف قصير عن الوكيل</label>
            <input type="text" placeholder="مثال: الوكيل الرسمي في بغداد لخدمات السريع والدفع المباشر" value={pageBio} onChange={(e) => setPageBio(e.target.value)} className="input-style" />
          </div>

          {/* المنصات والروابط */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>
              <FaLink style={{ color: '#0ea5e9' }} /> المنصات والروابط المباشرة
            </label>
            {platformsList.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <select value={item.platform} onChange={(e) => handlePlatformChange(index, 'platform', e.target.value)} className="input-style" style={{ flex: '1 1 120px' }}>
                  {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="url" placeholder="الرابط المباشر (https://...)" value={item.link} onChange={(e) => handlePlatformChange(index, 'link', e.target.value)} className="input-style" style={{ flex: '3 1 200px', direction: 'ltr' }} />
                {platformsList.length > 1 && (
                  <button type="button" onClick={() => removePlatformRow(index)} style={{ flex: '0 0 50px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addPlatformRow} style={{ background: '#f0f9ff', color: '#0284c7', border: '1px dashed #bae6fd', padding: '10px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
              <FaPlus /> إضافة منصة أخرى
            </button>
          </div>

          {/* طرق الدفع */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>
              <FaCreditCard style={{ color: '#10b981' }} /> طرق الدفع المتوفرة عند الوكيل
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {availablePayments.map(method => {
                const isActive = selectedPayments.includes(method);
                return (
                  <div key={method} onClick={() => handlePaymentToggle(method)} className={`chip ${isActive ? 'active' : ''}`}>
                    {isActive ? <FaCheck /> : <FaPlus style={{ fontSize: '10px', opacity: 0.5 }} />} {method}
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', height: '50px', fontSize: '16px' }}>
            <FaShieldAlt /> اعتماد وكيل جديد
          </button>
        </form>

        {/* جدول إظهار البيجات الحالية */}
        <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>البيج / اليوزر</th>
                <th>المنصات المربوطة</th>
                <th>طرق الدفع المدعومة</th>
                <th style={{ textAlign: 'center' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {verifiedPages.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>{p.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: '4px' }}>@{p.handle}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.platforms?.map((pl, idx) => (
                        <a key={idx} href={pl.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
                          {getPlatformIcon(pl.platform)} {pl.platform}
                        </a>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.payment_methods?.map((pm, idx) => (
                        <span key={idx} style={{ display: 'inline-block', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                          {pm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => handleDeletePage(p.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: '0.2s' }}>
                      <FaTrash /> إزالة
                    </button>
                  </td>
                </tr>
              ))}
              {verifiedPages.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>لا يوجد وكلاء أو بيجات معتمدة حالياً.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}