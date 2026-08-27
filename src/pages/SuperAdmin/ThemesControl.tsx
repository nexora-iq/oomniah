import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Swal from 'sweetalert2';
import { 
  FaPalette, FaImage, FaLink, FaAlignLeft, 
  FaPlus, FaSpinner, FaEyeSlash, FaEye, 
  FaCheckCircle, FaMoneyBillWave, FaChartLine, FaQrcode, FaBuilding 
} from 'react-icons/fa';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#fff',
  color: '#1e293b',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export default function ThemesControl() {
  const [themesList, setThemesList] = useState<any[]>([]);
  const [pagesList, setPagesList] = useState<any[]>([]); // 🌟 قائمة الفروع
  const [loading, setLoading] = useState(false);

  // حقول الإضافة الجديدة
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState(''); 
  const [imageFile, setImageFile] = useState<File | null>(null); 
  const [selectedPages, setSelectedPages] = useState<string[]>([]); // 🌟 الفروع المحددة للثيم

  const fetchThemesData = async () => {
    setLoading(true);
    
    // سحب الفروع (Pages)
    const { data: pages } = await supabase.from('pages').select('id, name').eq('status', 'active');
    if (pages) setPagesList(pages);

    // سحب الثيمات
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('*')
      .order('created_at', { ascending: false });

    if (themesError) {
      Toast.fire({ icon: 'error', title: 'خطأ في جلب الثيمات' });
      setLoading(false); return;
    }

    const { data: links } = await supabase.from('gift_links').select('theme_id, price, is_barcode');

    if (themes) {
      const enrichedThemes = themes.map(theme => {
        const themeLinks = links?.filter((l: any) => l.theme_id === theme.id) || [];
        const salesCount = themeLinks.length;
        const totalRevenue = themeLinks.reduce((sum: number, link: any) => sum + Number(link.price || 0), 0);
        const barcodeLinks = themeLinks.filter((l: any) => l.is_barcode);
        const barcodeSalesCount = barcodeLinks.length;
        const barcodeRevenue = barcodeSalesCount * 3000; 

        return { ...theme, salesCount, totalRevenue, barcodeSalesCount, barcodeRevenue };
      });
      setThemesList(enrichedThemes);
    }
    setLoading(false);
  };

  useEffect(() => { fetchThemesData(); }, []);

  // 🌟 دالة اختيار أو إلغاء اختيار الفرع
  const togglePageSelection = (pageId: string) => {
    if (selectedPages.includes(pageId)) {
      setSelectedPages(selectedPages.filter(id => id !== pageId));
    } else {
      setSelectedPages([...selectedPages, pageId]);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !imageFile) {
      Toast.fire({ icon: 'warning', title: 'يرجى ملء جميع الحقول واختيار صورة للثيم' });
      return;
    }
    
    setLoading(true);
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    let publicImageUrl = '';

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `theme_${Date.now()}.${fileExt}`;
      const filePath = `themes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('oomniah_media')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('oomniah_media')
        .getPublicUrl(filePath);
        
      publicImageUrl = urlData.publicUrl;

      // 🌟 حفظ الثيم مع مصفوفة الفروع المسموحة (إذا فارغة يعني للكل)
      const { error: dbError } = await supabase.from('themes').insert([
        { 
          name: name.trim(), 
          slug: cleanSlug, 
          description: description.trim(), 
          img_url: publicImageUrl, 
          status: 'active',
          allowed_pages: selectedPages // 👈 الحقل الجديد
        }
      ]);

      if (dbError) {
        if (dbError.code === '23505') Toast.fire({ icon: 'error', title: 'الرابط البرمجي (Slug) مستخدم مسبقاً! الرجاء تغييره' });
        else throw dbError;
      } else {
        Toast.fire({ icon: 'success', title: 'تمت إضافة الثيم بنجاح!' });
        setName(''); setSlug(''); setDescription(''); setImageFile(null); setSelectedPages([]);
        fetchThemesData();
      }
    } catch (err: any) {
      Toast.fire({ icon: 'error', title: `حدث خطأ: ${err.message}` });
    }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('themes').update({ status: newStatus }).eq('id', id);
    if (!error) {
      Toast.fire({ icon: 'success', title: newStatus === 'active' ? 'تم تفعيل الثيم' : 'تم إخفاء الثيم' });
      fetchThemesData();
    }
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
        
        .theme-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .theme-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.06); border-color: #cbd5e1; }
        .theme-card.inactive { opacity: 0.7; filter: grayscale(50%); }
        .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
        
        .custom-file-upload { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.3s ease; text-align: center; width: 100%; box-sizing: border-box; }
        .custom-file-upload.empty { border: 2px dashed #cbd5e1; background: #f8fafc; color: #64748b; }
        .custom-file-upload.empty:hover { border-color: #dc2626; background: #fef2f2; color: #dc2626; }
        .custom-file-upload.filled { border: 2px solid #10b981; background: #f0fdf4; color: #059669; }
        
        .btn-submit { display: flex; align-items: center; justify-content: center; gap: 8px; background: #dc2626; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; font-weight: bold; cursor: pointer; height: 46px; white-space: nowrap; transition: 0.3s; width: 100%; margin-top: 10px; }
        .btn-submit:hover:not(:disabled) { background: #b91c1c; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .action-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 15px; padding: 12px; border-radius: 10px; cursor: pointer; border: none; font-weight: bold; transition: all 0.2s; }
        .action-btn.hide { background: #fef2f2; color: #dc2626; }
        .action-btn.hide:hover { background: #fecaca; }
        .action-btn.show { background: #f0fdf4; color: #16a34a; }
        .action-btn.show:hover { background: #bbf7d0; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        /* 🌟 ستايل أزرار تحديد الفروع */
        .branch-check-btn { padding: 10px; border-radius: 8px; cursor: pointer; text-align: center; font-weight: bold; font-size: 13px; transition: 0.2s; user-select: none; border: 1px solid #cbd5e1; background: #fff; color: #64748b; }
        .branch-check-btn.selected { border-color: #dc2626; background: #fef2f2; color: #dc2626; box-shadow: 0 2px 8px rgba(220,38,38,0.1); }
      `}</style>

      <div className="header-card">
        <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaPalette style={{ color: '#dc2626' }} /> إدارة متجر الثيمات
        </h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#64748b' }}>أضف ثيمات وخصص ظهورها لفروع معينة أو اجعلها متاحة للجميع.</p>
      </div>

      <form onSubmit={handleAdd} className="form-container">
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
            <FaPalette style={{ color: '#94a3b8' }} /> اسم الثيم 
          </label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-style" placeholder="مثال: عيد ميلاد سعيد" />
        </div>
        
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
            <FaLink style={{ color: '#94a3b8' }} /> الرابط البرمجي (Slug)
          </label>
          <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="input-style" placeholder="مثال: happy-birthday-1" dir="ltr" />
        </div>

        <div style={{ flex: '1 1 100%' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
            <FaAlignLeft style={{ color: '#94a3b8' }} /> وصف الثيم 
          </label>
          <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="input-style" placeholder="اكتب وصفاً جذاباً للثيم..." />
        </div>

        {/* 🌟 قسم تخصيص الفروع */}
        <div style={{ flex: '1 1 100%', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>
            <FaBuilding style={{ color: '#dc2626' }} /> تخصيص الثيم لفروع محددة (اختياري)
          </label>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px', marginTop: 0 }}>
            اذا لم تختر أي فرع، سيظهر الثيم <strong>لجميع الفروع تلقائياً</strong>. اضغط على الفرع لتحديده:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {pagesList.map(page => (
              <div 
                key={page.id} 
                onClick={() => togglePageSelection(page.id)}
                className={`branch-check-btn ${selectedPages.includes(page.id) ? 'selected' : ''}`}
              >
                {page.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 100%', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px' }}>
            <input type="file" id="theme-image-upload" accept="image/*" required={!imageFile} onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} style={{ display: 'none' }} />
            <label htmlFor="theme-image-upload" className={`custom-file-upload ${imageFile ? 'filled' : 'empty'}`}>
              {imageFile ? <><FaCheckCircle /> تم اختيار الصورة بنجاح</> : <><FaImage /> اضغط هنا لاختيار غلاف للثيم</>}
            </label>
          </div>
          
          <div style={{ flex: '1 1 250px' }}>
            <button type="submit" disabled={loading || !imageFile} className="btn-submit" style={{ margin: 0, height: '44px' }}>
              {loading ? <><FaSpinner className="spin" /> جاري الرفع والحفظ...</> : <><FaPlus /> إضافة الثيم للمتجر</>}
            </button>
          </div>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {themesList.map(theme => (
          <div key={theme.id} className={`theme-card ${theme.status === 'inactive' ? 'inactive' : ''}`}>
            <div style={{ width: '100%', height: '180px', background: '#f1f5f9', position: 'relative' }}>
              {theme.img_url ? (
                <img src={theme.img_url} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#94a3b8' }}><FaImage style={{ fontSize: '30px' }} /><span>لا توجد صورة</span></div>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'absolute', top: '10px', right: '10px', background: theme.status === 'active' ? '#16a34a' : '#dc2626', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                {theme.status === 'active' ? <><FaEye /> متاح للبيع</> : <><FaEyeSlash /> مخفي</>}
              </span>
            </div>

            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>{theme.name}</h3>
              
              {/* 🌟 عرض حالة التخصيص */}
              <div style={{ fontSize: '12px', marginBottom: '15px', color: (!theme.allowed_pages || theme.allowed_pages.length === 0) ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                {(!theme.allowed_pages || theme.allowed_pages.length === 0) 
                  ? '🌍 متاح لجميع الفروع' 
                  : `🔒 مخصص لـ (${theme.allowed_pages.length}) فرع`}
              </div>

              <div className="stat-row">
                <span style={{ color: '#64748b' }}><FaLink /> الرابط:</span>
                <strong dir="ltr" style={{ color: '#334155' }}>/{theme.slug}</strong>
              </div>
              <div className="stat-row">
                <span style={{ color: '#64748b' }}><FaChartLine /> الطلبات:</span>
                <strong style={{ color: '#0ea5e9' }}>{theme.salesCount} طلب</strong>
              </div>
              <div className="stat-row" style={{ border: 'none' }}>
                <span style={{ color: '#64748b' }}><FaMoneyBillWave /> الأرباح الكلية:</span>
                <strong style={{ color: '#dc2626' }}>{theme.totalRevenue.toLocaleString()} د.ع</strong>
              </div>

              <button 
                onClick={() => toggleStatus(theme.id, theme.status)} 
                className={`action-btn ${theme.status === 'active' ? 'hide' : 'show'}`}
              >
                {theme.status === 'active' ? <><FaEyeSlash /> إخفاء الثيم</> : <><FaEye /> إتاحة الثيم للبيع</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}