import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Swal from 'sweetalert2';
import { 
  FaPalette, FaImage, FaPlus, FaSpinner, 
  FaMoneyBillWave, FaChartLine, FaBuilding, 
  FaTrash, FaEdit, FaStar, FaTags, FaFire, FaCrown, FaCheckCircle
} from 'react-icons/fa';

const Toast = Swal.mixin({
  toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#fff', color: '#1e293b',
  didOpen: (toast) => { toast.addEventListener('mouseenter', Swal.stopTimer); toast.addEventListener('mouseleave', Swal.resumeTimer); }
});

// الأقسام المتاحة للعرض في الموقع
const availableCategories = [
  { id: 'حب', label: 'حب ❤️' },
  { id: 'صوت', label: '🎵 إهداء صوتي' },
  { id: 'شتاء', label: '❄️ شتاء' },
  { id: 'ميلاد', label: '🎂 أعياد ميلاد' },
  { id: 'صور', label: '📸 ألبومات' },
  { id: 'أنمي', label: 'أنمي🔥' }

];

export default function ThemesControl() {
  const [themesList, setThemesList] = useState<any[]>([]);
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // حقول الإضافة الجديدة
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [extraPrice, setExtraPrice] = useState('0'); 
  const [isVip, setIsVip] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null); 
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  // نافذة التعديل (Modal)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<any>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const fetchThemesData = async () => {
    setLoading(true);
    const { data: pages } = await supabase.from('pages').select('id, name').eq('status', 'active');
    if (pages) setPagesList(pages);

    const { data: themes, error: themesError } = await supabase.from('themes').select('*').order('created_at', { ascending: false });
    if (themesError) { Toast.fire({ icon: 'error', title: 'خطأ في جلب الثيمات' }); setLoading(false); return; }

    const { data: links } = await supabase.from('gift_links').select('theme_id, price');
    if (themes) {
      const enrichedThemes = themes.map(theme => {
        const themeLinks = links?.filter((l: any) => l.theme_id === theme.id) || [];
        const salesCount = themeLinks.length;
        const totalRevenue = themeLinks.reduce((sum: number, link: any) => sum + Number(link.price || 0), 0);
        return { ...theme, salesCount, totalRevenue };
      });
      setThemesList(enrichedThemes);
    }
    setLoading(false);
  };

  useEffect(() => { fetchThemesData(); }, []);

  // دالة تحديد الفروع
  const togglePageSelection = (pageId: string, isEditing = false) => {
    if (isEditing) {
      const currentAllowed = editingTheme.allowed_pages || [];
      const updated = currentAllowed.includes(pageId) ? currentAllowed.filter((id: string) => id !== pageId) : [...currentAllowed, pageId];
      setEditingTheme({ ...editingTheme, allowed_pages: updated });
    } else {
      setSelectedPages(selectedPages.includes(pageId) ? selectedPages.filter(id => id !== pageId) : [...selectedPages, pageId]);
    }
  };

  // دالة تحديد الأقسام
  const toggleCategorySelection = (catId: string, isEditing = false) => {
    if (isEditing) {
      const currentCats = editingTheme.categories || [];
      const updated = currentCats.includes(catId) ? currentCats.filter((id: string) => id !== catId) : [...currentCats, catId];
      setEditingTheme({ ...editingTheme, categories: updated });
    } else {
      setSelectedCategories(selectedCategories.includes(catId) ? selectedCategories.filter(id => id !== catId) : [...selectedCategories, catId]);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !imageFile) { Toast.fire({ icon: 'warning', title: 'يرجى ملء جميع الحقول المطلوبة' }); return; }
    
    setLoading(true);
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    let publicImageUrl = '';

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `theme_${Date.now()}.${fileExt}`;
      const filePath = `themes/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('oomniah_media').upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('oomniah_media').getPublicUrl(filePath);
      publicImageUrl = urlData.publicUrl;

      const finalPrice = isVip ? Number(extraPrice) : 0; // حماية إضافية للسعر

      const { error: dbError } = await supabase.from('themes').insert([{ 
          name: name.trim(), 
          slug: cleanSlug, 
          description: description.trim(), 
          img_url: publicImageUrl, 
          status: 'active', 
          allowed_pages: selectedPages,
          is_vip: isVip,
          extra_price: finalPrice,
          is_trending: isTrending,
          categories: selectedCategories
      }]);

      if (dbError) {
        if (dbError.code === '23505') Toast.fire({ icon: 'error', title: 'الرابط البرمجي (Slug) مستخدم مسبقاً!' });
        else throw dbError;
      } else {
        Toast.fire({ icon: 'success', title: 'تمت إضافة الثيم بنجاح!' });
        setName(''); setSlug(''); setDescription(''); setExtraPrice('0'); 
        setIsVip(false); setIsTrending(false); setImageFile(null); 
        setSelectedPages([]); setSelectedCategories([]);
        fetchThemesData();
      }
    } catch (err: any) { Toast.fire({ icon: 'error', title: `خطأ: ${err.message}` }); }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('themes').update({ status: newStatus }).eq('id', id);
    if (!error) { Toast.fire({ icon: 'success', title: 'تم تحديث حالة الثيم' }); fetchThemesData(); }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'هل أنت متأكد؟', text: "سيتم حذف الثيم نهائياً (الروابط القديمة قد تتعطل)!",
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف!', cancelButtonText: 'إلغاء'
    });
    if (confirm.isConfirmed) {
      const { error } = await supabase.from('themes').delete().eq('id', id);
      if (error) Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء الحذف' });
      else { Toast.fire({ icon: 'success', title: 'تم الحذف بنجاح' }); fetchThemesData(); }
    }
  };

  // دالة الحفظ بعد التعديل الشامل
  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      let finalImageUrl = editingTheme.img_url;

      // إذا تم اختيار صورة جديدة، نرفعها أولاً
      if (editImageFile) {
        const fileExt = editImageFile.name.split('.').pop();
        const fileName = `theme_${Date.now()}_edit.${fileExt}`;
        const filePath = `themes/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('oomniah_media').upload(filePath, editImageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('oomniah_media').getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
      }

      const finalPrice = editingTheme.is_vip ? Number(editingTheme.extra_price) : 0;
      const cleanSlug = editingTheme.slug.trim().toLowerCase().replace(/\s+/g, '-');

      const { error } = await supabase.from('themes').update({
        name: editingTheme.name.trim(),
        slug: cleanSlug,
        description: editingTheme.description.trim(),
        img_url: finalImageUrl,
        allowed_pages: editingTheme.allowed_pages,
        categories: editingTheme.categories,
        is_vip: editingTheme.is_vip,
        extra_price: finalPrice,
        is_trending: editingTheme.is_trending
      }).eq('id', editingTheme.id);

      if (error) throw error;

      Toast.fire({ icon: 'success', title: 'تم تحديث الثيم بنجاح!' }); 
      setEditModalOpen(false); 
      setEditImageFile(null);
      fetchThemesData();
    } catch (err: any) {
      Toast.fire({ icon: 'error', title: `فشل التحديث: ${err.message}` });
    }
    setSavingEdit(false);
  };

  const openEditModal = (theme: any) => {
    setEditingTheme({ ...theme });
    setEditImageFile(null);
    setEditModalOpen(true);
  };

  return (
    <div className="fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .header-card { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .form-container { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 30px; display: flex; gap: 15px; align-items: end; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .input-style { padding: 12px 15px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; background: #f8fafc; outline: none; width: 100%; box-sizing: border-box; transition: 0.2s; }
        .input-style:focus { border-color: #dc2626; background: #fff; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .theme-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.02); position: relative; }
        .theme-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.06); border-color: #cbd5e1; }
        .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
        .custom-file-upload { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.3s; width: 100%; }
        .custom-file-upload.empty { border: 2px dashed #cbd5e1; background: #f8fafc; color: #64748b; }
        .custom-file-upload.empty:hover { border-color: #dc2626; background: #fef2f2; color: #dc2626; }
        .custom-file-upload.filled { border: 2px solid #10b981; background: #f0fdf4; color: #059669; }
        .btn-submit { display: flex; align-items: center; justify-content: center; gap: 8px; background: #dc2626; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; font-weight: bold; cursor: pointer; height: 46px; transition: 0.3s; width: 100%; margin-top: 10px; }
        .btn-submit:hover:not(:disabled) { background: #b91c1c; }
        .branch-check-btn { padding: 10px; border-radius: 8px; cursor: pointer; text-align: center; font-weight: bold; font-size: 13px; transition: 0.2s; border: 1px solid #cbd5e1; background: #fff; color: #64748b; }
        .branch-check-btn.selected { border-color: #dc2626; background: #fef2f2; color: #dc2626; box-shadow: 0 2px 8px rgba(220,38,38,0.1); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(5px); padding: 20px; }
        .modal-content { background: #fff; padding: 30px; border-radius: 20px; width: 100%; maxWidth: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
      `}</style>

      <div className="header-card">
        <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaPalette style={{ color: '#dc2626' }} /> إدارة متجر الثيمات
        </h2>
      </div>

      <form onSubmit={handleAdd} className="form-container">
        {/* الحقول الأساسية */}
        <div style={{ flex: '1 1 200px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>اسم الثيم</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-style" /></div>
        <div style={{ flex: '1 1 200px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>الرابط البرمجي (Slug)</label><input type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="input-style" dir="ltr" /></div>
        <div style={{ flex: '1 1 100%' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>وصف قصير</label><input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="input-style" /></div>
        
        {/* 🌟 تصنيف الأقسام (Categories) */}
        <div style={{ flex: '1 1 100%', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <label style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '10px', display: 'block' }}>تصنيف الثيم (يظهر في السلايدر)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {availableCategories.map(cat => (
              <div key={cat.id} onClick={() => toggleCategorySelection(cat.id)} className={`branch-check-btn ${selectedCategories.includes(cat.id) ? 'selected' : ''}`}>{cat.label}</div>
            ))}
          </div>
        </div>

        {/* 🌟 خيارات التسويق (VIP والأكثر طلباً) */}
        <div style={{ flex: '1 1 100%', display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '10px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: isTrending ? '#ef4444' : '#64748b' }}>
            <input type="checkbox" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#ef4444' }} />
            <FaFire /> الأكثر طلباً (Trending)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: isVip ? '#d97706' : '#64748b' }}>
            <input type="checkbox" checked={isVip} onChange={e => { setIsVip(e.target.checked); if (!e.target.checked) setExtraPrice('0'); }} style={{ width: '20px', height: '20px', accentColor: '#d97706' }} />
            <FaCrown /> ثيم VIP (سعر إضافي)
          </label>
        </div>

        {/* 🌟 السعر الإضافي (يظهر فقط إذا كان VIP) */}
        {isVip && (
          <div style={{ flex: '1 1 100%', background: '#fef3c7', padding: '15px', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#b45309', marginBottom: '8px', display: 'block' }}><FaTags /> السعر الإضافي للثيم (د.ع)</label>
            <input type="number" required={isVip} value={extraPrice} onChange={e => setExtraPrice(e.target.value)} className="input-style" style={{ border: '1px solid #fcd34d' }} />
            <span style={{ fontSize: '12px', color: '#d97706', marginTop: '5px', display: 'block' }}>* هذا السعر سيُدفع إضافةً إلى سعر الباقة الأصلية.</span>
          </div>
        )}

        {/* الفروع المخصصة */}
        <div style={{ flex: '1 1 100%', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '10px', display: 'block' }}><FaBuilding style={{ color: '#dc2626' }} /> تخصيص الثيم لفروع محددة</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {pagesList.map(page => (
              <div key={page.id} onClick={() => togglePageSelection(page.id)} className={`branch-check-btn ${selectedPages.includes(page.id) ? 'selected' : ''}`}>{page.name}</div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 100%', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ flex: '1 1 250px' }}>
            <input type="file" id="theme-image-upload" accept="image/*" required={!imageFile} onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} style={{ display: 'none' }} />
            <label htmlFor="theme-image-upload" className={`custom-file-upload ${imageFile ? 'filled' : 'empty'}`}>
              {imageFile ? <><FaCheckCircle /> تم اختيار الصورة</> : <><FaImage /> اختيار غلاف للثيم</>}
            </label>
          </div>
          <div style={{ flex: '1 1 250px' }}>
            <button type="submit" disabled={loading || !imageFile} className="btn-submit">{loading ? <FaSpinner className="spin" /> : <><FaPlus /> إضافة الثيم للمتجر</>}</button>
          </div>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {themesList.map(theme => (
          <div key={theme.id} className={`theme-card ${theme.status === 'inactive' ? 'inactive' : ''}`}>
            
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px', zIndex: 5 }}>
              <button onClick={() => openEditModal(theme)} style={{ background: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}><FaEdit color="#0ea5e9" /></button>
              <button onClick={() => handleDelete(theme.id)} style={{ background: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}><FaTrash color="#dc2626" /></button>
            </div>

            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <img src={theme.img_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                {theme.is_trending && <span style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}><FaFire /> الأكثر طلباً</span>}
                {theme.is_vip && <span style={{ background: 'linear-gradient(45deg, #fbbf24, #d97706)', color: '#fff', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}><FaCrown /> VIP</span>}
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#1e293b' }}>{theme.name}</h3>
              <div className="stat-row"><span style={{ color: '#64748b' }}><FaTags /> السعر الإضافي:</span><strong style={{ color: theme.is_vip ? '#d97706' : '#10b981' }}>{theme.is_vip ? `+ ${theme.extra_price?.toLocaleString()} د.ع` : 'مجاني'}</strong></div>
              <div className="stat-row"><span style={{ color: '#64748b' }}><FaChartLine /> الطلبات:</span><strong style={{ color: '#0ea5e9' }}>{theme.salesCount}</strong></div>
              
              <button onClick={() => toggleStatus(theme.id, theme.status)} style={{ width: '100%', padding: '10px', marginTop: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: theme.status === 'active' ? '#fef2f2' : '#f0fdf4', color: theme.status === 'active' ? '#dc2626' : '#16a34a' }}>
                {theme.status === 'active' ? 'إخفاء الثيم مؤقتاً' : 'إتاحة الثيم للعرض'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🌟 نافذة التعديل الشاملة (Modal) */}
      {editModalOpen && editingTheme && (
        <div className="modal-overlay">
          <div className="modal-content fade-in">
            <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}><FaEdit style={{ color: '#0ea5e9' }}/> تعديل الثيم: {editingTheme.name}</h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>الاسم</label>
                <input type="text" value={editingTheme.name} onChange={e => setEditingTheme({...editingTheme, name: e.target.value})} className="input-style" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Slug</label>
                <input type="text" value={editingTheme.slug} onChange={e => setEditingTheme({...editingTheme, slug: e.target.value})} className="input-style" dir="ltr" />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>الوصف</label>
              <input type="text" value={editingTheme.description || ''} onChange={e => setEditingTheme({...editingTheme, description: e.target.value})} className="input-style" />
            </div>

            <div style={{ marginBottom: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>الأقسام</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableCategories.map(cat => (
                  <div key={cat.id} onClick={() => toggleCategorySelection(cat.id, true)} className={`branch-check-btn ${(editingTheme.categories || []).includes(cat.id) ? 'selected' : ''}`} style={{ padding: '6px 12px' }}>{cat.label}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={editingTheme.is_trending} onChange={e => setEditingTheme({...editingTheme, is_trending: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <FaFire color="#ef4444" /> الأكثر طلباً
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={editingTheme.is_vip} onChange={e => { setEditingTheme({...editingTheme, is_vip: e.target.checked, extra_price: e.target.checked ? editingTheme.extra_price : 0}); }} style={{ width: '18px', height: '18px' }} />
                <FaCrown color="#d97706" /> ثيم VIP
              </label>
            </div>

            {editingTheme.is_vip && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#b45309' }}>السعر الإضافي (د.ع)</label>
                <input type="number" value={editingTheme.extra_price || 0} onChange={e => setEditingTheme({...editingTheme, extra_price: e.target.value})} className="input-style" />
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>تغيير صورة الثيم (اختياري)</label>
              <input type="file" id="edit-image-upload" accept="image/*" onChange={e => setEditImageFile(e.target.files ? e.target.files[0] : null)} style={{ display: 'none' }} />
              <label htmlFor="edit-image-upload" className={`custom-file-upload ${editImageFile ? 'filled' : 'empty'}`}>
                {editImageFile ? <><FaCheckCircle /> سيتم رفع الصورة الجديدة</> : <><FaImage /> اضغط لاختيار صورة بديلة</>}
              </label>
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>الفروع المسموحة</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', maxHeight: '120px', overflowY: 'auto', marginBottom: '20px' }}>
              {pagesList.map(page => (
                <div key={page.id} onClick={() => togglePageSelection(page.id, true)} className={`branch-check-btn ${(editingTheme.allowed_pages || []).includes(page.id) ? 'selected' : ''}`} style={{ padding: '6px' }}>{page.name}</div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-submit" style={{ margin: 0 }}>
                {savingEdit ? <FaSpinner className="spin" /> : 'حفظ التعديلات الشاملة'}
              </button>
              <button onClick={() => setEditModalOpen(false)} disabled={savingEdit} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}