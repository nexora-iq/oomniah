import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Swal from 'sweetalert2';
import { 
  FaLink, FaChartBar, FaPrint, FaSearch, FaGift, 
  FaPalette, FaBuilding, FaUserTie, FaClock, 
  FaCheckCircle, FaExclamationCircle, FaTimesCircle, 
  FaBan, FaCheck, FaSyncAlt, FaCalendarAlt, FaQrcode, FaTicketAlt 
} from 'react-icons/fa';

// إعداد الإشعارات الجانبية (Toasts) الأنيقة
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

export default function LinksMaster() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationFilter, setDurationFilter] = useState('all');
  
  const [extensions, setExtensions] = useState<Record<string, string>>({});

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data: linksData, error: linksError } = await supabase.from('gift_links').select('*').order('created_at', { ascending: false });
      if (linksError) throw linksError;

      const { data: themesData } = await supabase.from('themes').select('id, name, slug');
      const { data: pagesData } = await supabase.from('pages').select('id, name');
      const { data: profilesData } = await supabase.from('profiles').select('id, fullname');

      const mappedLinks = (linksData || []).map(link => {
        const theme = themesData?.find(t => t.id === link.theme_id);
        const page = pagesData?.find(p => p.id === link.page_id || p.id === link.pos_id);
        const profile = profilesData?.find(p => p.id === link.creator_id || p.id === link.created_by);

        return {
          ...link,
          theme_name: theme?.name || 'ثيم غير محدد',
          theme_slug: theme?.slug || 'gift',
          page_name: page?.name || 'غير معروف',
          creator_name: profile?.fullname || 'موظف محذوف'
        };
      });

      setLinks(mappedLinks);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'disabled' : 'active';
    const isDeactivating = current === 'active';
    
    const result = await Swal.fire({
      title: isDeactivating ? 'إيقاف الرابط؟' : 'إعادة تفعيل الرابط؟',
      text: isDeactivating ? 'لن يتمكن المستلم من فتح الهدية!' : 'سيتمكن المستلم من فتح الهدية مجدداً!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isDeactivating ? '#dc2626' : '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: isDeactivating ? 'نعم، أوقف الرابط' : 'نعم، فعّل الرابط',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      setLinks(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      const { error } = await supabase.from('gift_links').update({ status: newStatus }).eq('id', id);
      if (error) {
        Swal.fire('خطأ!', `حدث خطأ في قاعدة البيانات: ${error.message}`, 'error');
        setLinks(prev => prev.map(l => l.id === id ? { ...l, status: current } : l));
      } else {
        Swal.fire('تم!', 'تم تغيير حالة الرابط بنجاح.', 'success');
      }
    }
  };

  const extendLink = async (link: any) => {
    const durationType = extensions[link.id] || 'daily';
    const isExpired = new Date(link.expires_at) < new Date();
    const baseDate = isExpired ? new Date() : new Date(link.expires_at);
    const newExpiry = new Date(baseDate);
    
    let addedPrice = 0;
    let durationLabel = '';

    if (durationType === 'hour') { newExpiry.setHours(newExpiry.getHours() + 1); addedPrice = 0; durationLabel = 'ساعة'; }
    else if (durationType === 'daily') { newExpiry.setDate(newExpiry.getDate() + 1); addedPrice = 5000; durationLabel = 'يومي'; } 
    else if (durationType === 'weekly') { newExpiry.setDate(newExpiry.getDate() + 7); addedPrice = 10000; durationLabel = 'أسبوعي'; } 
    else if (durationType === 'monthly') { newExpiry.setMonth(newExpiry.getMonth() + 1); addedPrice = 15000; durationLabel = 'شهري'; }
    else if (durationType === 'two_months') { newExpiry.setMonth(newExpiry.getMonth() + 2); addedPrice = 19000; durationLabel = 'شهرين'; }
    else if (durationType === 'permanent') { newExpiry.setFullYear(newExpiry.getFullYear() + 100); addedPrice = 50000; durationLabel = 'دائمي'; }

    const newTotal = Number(link.price || 0) + addedPrice;
    const newOwnerCut = Number(link.owner_cut || 0) + (addedPrice / 2);
    const newPageCut = Number(link.page_cut || 0) + (addedPrice / 2);

    const confirmMessage = addedPrice > 0 
      ? `هل تريد تأكيد تمديد الرابط لمدة (${durationLabel})؟ <br/> <b style="color:red">سيتم إضافة ${addedPrice.toLocaleString()} د.ع وتقسيمها 50/50</b>`
      : `تأكيد تمديد الرابط لمدة (${durationLabel}) مجاناً؟`;

    const result = await Swal.fire({
      title: 'تمديد الرابط',
      html: confirmMessage,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'تأكيد التمديد',
      cancelButtonText: 'إلغاء'
    });
    
    if (result.isConfirmed) {
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, expires_at: newExpiry.toISOString(), status: 'active', price: newTotal, owner_cut: newOwnerCut, page_cut: newPageCut } : l));

      const { error } = await supabase.from('gift_links').update({ 
        expires_at: newExpiry.toISOString(), 
        status: 'active', 
        price: newTotal, 
        owner_cut: newOwnerCut, 
        page_cut: newPageCut, 
        is_cleared: false 
      }).eq('id', link.id);

      if (error) {
        Swal.fire('خطأ!', error.message, 'error');
        fetchLinks(); 
      } else {
        await supabase.from('system_logs').insert([{
          admin_name: 'المدير العام', pos_name: link.page_name, action_type: 'تمديد رابط',
          details: `تم تمديد الرابط (${link.short_id}) لمدة (${durationLabel}) ${addedPrice > 0 ? `بمبلغ إضافي ${addedPrice} د.ع` : 'مجاناً'}`
        }]);
        Swal.fire('تم بنجاح!', 'تم تمديد صلاحية الرابط وتوزيع أرباح التمديد.', 'success');
      }
    }
  };
  
  const exportToExcel = () => { /* يمكن إضافة كود التصدير هنا */ };

  const filteredLinks = links.filter(link => {
    let isMatch = true;

    const search = searchTerm.toLowerCase();
    if (search && !(link.short_id || '').toLowerCase().includes(search) && !(link.page_name || '').toLowerCase().includes(search) && !(link.creator_name || '').toLowerCase().includes(search) && !(link.sender_name || '').toLowerCase().includes(search) && !(link.recipient_name || '').toLowerCase().includes(search)) {
      isMatch = false;
    }

    const linkDate = new Date(link.created_at);
    if (startDate) { const start = new Date(startDate); start.setHours(0, 0, 0, 0); if (linkDate < start) isMatch = false; }
    if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); if (linkDate > end) isMatch = false; }

    if (durationFilter !== 'all') {
      const diffTime = Math.abs(new Date(link.expires_at).getTime() - new Date(link.created_at).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let linkDurationType = 'custom';
      if (diffDays <= 2) linkDurationType = 'daily';
      else if (diffDays > 2 && diffDays <= 8) linkDurationType = 'weekly';
      else if (diffDays > 8 && diffDays <= 32) linkDurationType = 'monthly';
      else if (diffDays > 32) linkDurationType = 'permanent';

      if (durationFilter !== linkDurationType) isMatch = false;
    }

    return isMatch;
  });

  const formatDateFull = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-IQ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  return (
    <div className="fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .header-card { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .action-btn { padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: bold; transition: all 0.2s; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .action-btn.export { background: #10b981; color: #fff; }
        .action-btn.export:hover { background: #059669; }
        .action-btn.print { background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; }
        
        .filters-container { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; background: #fff; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .search-wrapper { flex: 1; min-width: 250px; display: flex; align-items: center; gap: 10px; background: #fff; padding: 0 15px; border-radius: 10px; border: 1px solid #cbd5e1; transition: 0.3s; }
        .search-wrapper:focus-within { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .search-input { flex: 1; padding: 10px 0; border: none; font-size: 13px; outline: none; background: transparent; }
        
        .filter-select, .date-filter { padding: 10px 15px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; color: #475569; background: #fff; cursor: pointer; }
        
        .stats-badge { background: #dc2626; color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; }

        /* ستايلات الجدول للحاسبة والبطاقات للموبايل */
        .desktop-table-container { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow-x: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .data-table { width: 100%; border-collapse: collapse; min-width: 1050px; }
        .data-table th { background: #f8fafc; padding: 15px; text-align: right; font-size: 13px; color: #64748b; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
        .data-table td { padding: 15px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .data-table tr:hover td { background: #fef2f2; }
        
        .mobile-card-list { display: none; flex-direction: column; gap: 15px; }
        .mobile-link-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); position: relative; }
        
        @media (max-width: 768px) {
          .desktop-table-container { display: none; }
          .mobile-card-list { display: flex; }
          .header-card { flex-direction: column; align-items: stretch; text-align: center; }
          .stats-badge { justify-content: center; }
        }

        .badge { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; }
        .badge.active { background: #dcfce7; color: #16a34a; }
        .badge.expired { background: #fef3c7; color: #d97706; }
        .badge.inactive { background: #fee2e2; color: #dc2626; }
        
        .control-btn { padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; border: 1px solid; transition: 0.2s; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
        .control-btn.disable { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        .control-btn.enable { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
        .control-btn.extend { background: #fffbeb; border-color: #fef08a; color: #d97706; width: 100%; justify-content: center; }
        .open-link-btn { background: #2563eb; color: #fff; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; transition: 0.2s; justify-content: center; }
        .open-link-btn:hover { background: #1d4ed8; }
        
        .spinner { width: 50px; height: 50px; border: 5px solid #f8fafc; border-top: 5px solid #dc2626; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="header-card no-print">
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaLink style={{ color: '#dc2626' }} /> سجل الروابط الشامل
          </h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>إدارة ومراقبة الروابط، وتمديد الصلاحيات والفلاتر المتقدمة.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="stats-badge">
            <FaChartBar /> إجمالي الروابط: {filteredLinks.length}
          </div>
          <button onClick={() => window.print()} className="action-btn print"><FaPrint /> طباعة</button>
          <button onClick={exportToExcel} className="action-btn export"><FaChartBar /> تصدير إكسل</button>
        </div>
      </div>

      <div className="filters-container no-print">
        <div className="search-wrapper">
          <FaSearch style={{ color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث (كود، فرع، موظف، مرسل، مستلم)..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <select className="filter-select" value={durationFilter} onChange={e => setDurationFilter(e.target.value)}>
          <option value="all">كل الباقات (المدة)</option>
          <option value="daily">باقات يومية (24 ساعة)</option>
          <option value="weekly">باقات أسبوعية</option>
          <option value="monthly">باقات شهرية</option>
          <option value="permanent">باقات دائمية</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>من:</span>
          <input type="date" className="date-filter" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>إلى:</span>
          <input type="date" className="date-filter" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '15px', color: '#dc2626', fontWeight: 'bold', fontSize: '15px' }}>جاري تحميل الروابط والبيانات...</p>
        </div>
      ) : (
        <>
          {/* 🌟 العرض الخاص بالحاسبة (جدول) */}
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>فتح الرابط</th>
                  <th>التفاصيل والمحتوى</th>
                  <th>الفرع والمالية</th>
                  <th>الصلاحية والتاريخ</th>
                  <th>الحالة</th>
                  <th className="no-print">التحكم والتمديد</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map(link => {
                  const actualPrice = Number(link.price || 0);
                  const isExpired = new Date(link.expires_at) < new Date();
                  const displayStatus = (link.status === 'inactive' || link.status === 'disabled') ? 'معطل' : (isExpired ? 'منتهي' : 'فعال');
                  const linkCode = link.short_id || link.id.split('-')[0];

                  return (
                    <tr key={link.id}>
                      <td>
                        <a href={`/${link.theme_slug}/${linkCode}`} target="_blank" rel="noreferrer" className="open-link-btn">
                          <FaGift /> افتح الهدية
                        </a>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>#{linkCode}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                          <FaPalette style={{ color: '#8b5cf6' }} /> {link.theme_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>من: <strong>{link.sender_name || 'مجهول'}</strong></div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>إلى: <strong>{link.recipient_name || 'مجهول'}</strong></div>
                        
                        {/* عرض معلومات الباركود والكوبون */}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {link.is_barcode && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 'bold' }}>
                              <FaQrcode /> باركود
                            </span>
                          )}
                          {link.coupon_code && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#0ea5e9', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 'bold' }}>
                              <FaTicketAlt /> كود: {link.coupon_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#1e293b' }}>
                          <FaBuilding style={{ color: '#94a3b8' }} /> {link.page_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          <FaUserTie style={{ color: '#cbd5e1' }} /> {link.creator_name}
                        </div>
                        <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>
                          المبلغ: {actualPrice.toLocaleString()} د.ع
                          {link.discount_amount > 0 && <span style={{ color: '#10b981', fontSize: '10px', display: 'block' }}>شمل خصم: {link.discount_amount} د.ع</span>}
                        </div>
                      </td>
                      <td dir="ltr" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: isExpired ? '#ea580c' : '#1e293b', fontWeight: isExpired ? 'bold' : 'normal', fontSize: '12px' }}>
                          الانتهاء: {formatDateFull(link.expires_at)} <FaClock /> 
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                          الإنشاء: {formatDateFull(link.created_at)} <FaCalendarAlt />
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${displayStatus === 'فعال' ? 'active' : (displayStatus === 'منتهي' ? 'expired' : 'inactive')}`}>
                          {displayStatus === 'فعال' ? <><FaCheckCircle /> فعال</> : (displayStatus === 'منتهي' ? <><FaExclamationCircle /> منتهي</> : <><FaTimesCircle /> معطل</>)}
                        </span>
                      </td>
                      <td className="no-print">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => toggleStatus(link.id, link.status)} className={`control-btn ${link.status === 'active' ? 'disable' : 'enable'}`}>
                            {link.status === 'active' ? <><FaBan /> إيقاف</> : <><FaCheck /> تفعيل</>}
                          </button>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: '#f8fafc', padding: '4px', borderRadius: '10px' }}>
                            <select value={extensions[link.id] || 'daily'} onChange={(e) => setExtensions({...extensions, [link.id]: e.target.value})} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', backgroundColor: '#fff' }}>
                              <option value="hour">ساعة (مجاناً)</option>
                              <option value="daily">يومي (+5,000)</option>
                              <option value="weekly">أسبوعي (+10,000)</option>
                              <option value="monthly">شهري (+15,000)</option>
                              <option value="two_months">شهرين (+19,000)</option>
                              <option value="permanent">دائمي (+50,000)</option>
                            </select>
                            <button onClick={() => extendLink(link)} className="control-btn extend">
                              <FaSyncAlt /> تمديد
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLinks.length === 0 && !loading && (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>لا توجد روابط تطابق خيارات الفرز.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 🌟 العرض الخاص بالموبايل (بطاقات) */}
          <div className="mobile-card-list">
            {filteredLinks.map(link => {
              const actualPrice = Number(link.price || 0);
              const isExpired = new Date(link.expires_at) < new Date();
              const displayStatus = (link.status === 'inactive' || link.status === 'disabled') ? 'معطل' : (isExpired ? 'منتهي' : 'فعال');
              const linkCode = link.short_id || link.id.split('-')[0];

              return (
                <div key={link.id} className="mobile-link-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                    <span className={`badge ${displayStatus === 'فعال' ? 'active' : (displayStatus === 'منتهي' ? 'expired' : 'inactive')}`}>
                      {displayStatus === 'فعال' ? <FaCheckCircle /> : (displayStatus === 'منتهي' ? <FaExclamationCircle /> : <FaTimesCircle />)} {displayStatus}
                    </span>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>#{linkCode}</div>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPalette style={{ color: '#8b5cf6' }} /> {link.theme_name}
                  </h3>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                    <span>من: <strong>{link.sender_name || 'مجهول'}</strong></span>
                    <span>إلى: <strong>{link.recipient_name || 'مجهول'}</strong></span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span><FaBuilding style={{ color: '#94a3b8' }}/> {link.page_name}</span>
                      <span><FaUserTie style={{ color: '#cbd5e1' }}/> {link.creator_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '5px', marginTop: '5px' }}>
                      <strong>السعر:</strong>
                      <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{actualPrice.toLocaleString()} د.ع</span>
                    </div>
                    
                    {/* عرض معلومات الباركود والكوبون للموبايل */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {link.is_barcode && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 'bold' }}>
                          <FaQrcode /> باركود
                        </span>
                      )}
                      {link.coupon_code && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#0ea5e9', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 'bold' }}>
                          <FaTicketAlt /> كود: {link.coupon_code} (-{link.discount_amount} د.ع)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px', direction: 'ltr', textAlign: 'right' }}>
                    <span style={{ color: isExpired ? '#ea580c' : '#1e293b', fontWeight: isExpired ? 'bold' : 'normal' }}>
                      Exp: {formatDateFull(link.expires_at)} <FaClock />
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a href={`/${link.theme_slug}/${linkCode}`} target="_blank" rel="noreferrer" className="open-link-btn" style={{ flex: 1 }}>
                        <FaGift /> افتح الهدية
                      </a>
                      <button onClick={() => toggleStatus(link.id, link.status)} className={`control-btn ${link.status === 'active' ? 'disable' : 'enable'}`} style={{ flex: 1, justifyContent: 'center' }}>
                        {link.status === 'active' ? <><FaBan /> إيقاف</> : <><FaCheck /> تفعيل</>}
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <select value={extensions[link.id] || 'daily'} onChange={(e) => setExtensions({...extensions, [link.id]: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', backgroundColor: '#fff' }}>
                        <option value="hour">ساعة (مجاناً)</option>
                        <option value="daily">يومي (+5k)</option>
                        <option value="weekly">أسبوعي (+10k)</option>
                        <option value="monthly">شهري (+15k)</option>
                        <option value="two_months">شهرين (+19k)</option>
                        <option value="permanent">دائمي (+50k)</option>
                      </select>
                      <button onClick={() => extendLink(link)} className="control-btn extend" style={{ flex: 1 }}>
                        <FaSyncAlt /> تمديد
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredLinks.length === 0 && !loading && (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>لا توجد روابط تطابق خيارات الفرز.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}