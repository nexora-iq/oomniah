import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function LinksMaster() {
  const [links, setLinks] = useState<any[]>([]);
  
  // حالة لحفظ نوع التمديد لكل رابط (الافتراضي يومي)
  const [extensions, setExtensions] = useState<Record<string, string>>({});

  const fetchLinks = async () => {
    // 🛠️ جلب البيانات مع الـ slug حتى نبني الرابط الكامل
    const { data, error } = await supabase.from('gift_links').select(`
      id, short_id, price, price_at_sale, status, created_at, expires_at,
      themes ( name, slug ),
      profiles:created_by ( fullname ),
      points_of_sale ( name )
    `).order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching links:", error);
    }

    if (data) setLinks(data);
  };

  useEffect(() => { fetchLinks(); }, []);

  // دالة الإيقاف والتفعيل العادية
  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';
    await supabase.from('gift_links').update({ status: newStatus }).eq('id', id);
    fetchLinks();
  };

  // ♻️ دالة تمديد الوقت للروابط المنتهية (مع تحديث المالية)
  const extendLink = async (id: string, shortId: string, currentPrice: number, posName: string) => {
    const durationType = extensions[id] || 'daily';
    const newExpiry = new Date();
    
    let addedPrice = 0;
    let durationLabel = '';

    // 1. تحديد السعر والمدة بناءً على اختيار التمديد
    if (durationType === 'daily') {
      newExpiry.setDate(newExpiry.getDate() + 1);
      addedPrice = 5000;
      durationLabel = 'يومي';
    } else if (durationType === 'weekly') {
      newExpiry.setDate(newExpiry.getDate() + 7);
      addedPrice = 10000;
      durationLabel = 'أسبوعي';
    } else if (durationType === 'monthly') {
      newExpiry.setDate(newExpiry.getDate() + 30);
      addedPrice = 15000;
      durationLabel = 'شهري';
    }

    const newTotal = currentPrice + addedPrice;

    // 2. تحديث قاعدة البيانات (الوقت + السعر الجديد + إرجاعه للمالية)
    const { error } = await supabase.from('gift_links').update({ 
      expires_at: newExpiry.toISOString(), 
      status: 'active',
      price_at_sale: newTotal, // 💰 تحديث السعر الكلي
      is_cleared: false // 🔴 إرجاعه كحساب غير مصفر حتى يطالب به الموظف بالمالية
    }).eq('id', id);

    if (error) {
      alert("❌ حدث خطأ أثناء التمديد!");
    } else {
      // 3. توثيق العملية في سجلات النظام لتظهر في الإحصائيات
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('system_logs').insert([{
        admin_name: 'الإدارة العليا', // يمكن جلب اسم الإدمن من البروفايل إذا مسيفه بالـ state
        pos_name: posName || 'غير معروف',
        action_type: 'تمديد رابط',
        details: `تم تمديد الرابط (${shortId}) لمدة (${durationLabel}) | المبلغ المضاف: ${addedPrice} د.ع | السعر الكلي أصبح: ${newTotal} د.ع`
      }]);

      alert(`✅ تم تمديد الرابط بنجاح وإضافة ${addedPrice.toLocaleString()} د.ع للمالية!`);
      fetchLinks(); // تحديث الجدول
    }
  };

  const exportToExcel = () => {
    const headers = ["الرابط الكامل", "الثيم", "السعر", "الفرع", "الموظف", "تاريخ الانشاء", "تاريخ الانتهاء", "الحالة الفعلية"];
    const rows = links.map(l => {
      const actualPrice = Number(l.price_at_sale || l.price || 0);
      const isExpired = new Date(l.expires_at) < new Date();
      const finalStatus = l.status === 'inactive' ? 'معطل يدوياً' : (isExpired ? 'منتهي الصلاحية' : 'فعال');
      const fullUrl = `${window.location.origin}/${l.themes?.slug || 'gift'}/${l.short_id || l.id.split('-')[0]}`;

      return [
        fullUrl, 
        l.themes?.name || '-', 
        actualPrice, 
        l.points_of_sale?.name || '-', 
        l.profiles?.fullname || 'غير معروف',
        new Date(l.created_at).toLocaleString('en-IQ'), 
        new Date(l.expires_at).toLocaleString('en-IQ'), 
        finalStatus
      ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `قائمة_الروابط_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div style={container}>
      <div style={headerSection} className="no-print">
        <div>
          <h3 style={title}>الإدارة المباشرة للروابط 🔗</h3>
          <p style={desc}>مراقبة الروابط وتفاصيلها (الموظف، السعر، مدة الصلاحية) وتصديرها.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={printBtn}>🖨️ طباعة</button>
          <button onClick={exportToExcel} style={excelBtn}>📊 تصدير إكسل</button>
        </div>
      </div>

      <div style={tableContainer}>
        <table style={table}>
          <thead style={thRow}>
            <tr>
              <th style={th}>الرابط الكامل</th>
              <th style={th}>الثيم والسعر</th>
              <th style={th}>الفرع والموظف</th>
              <th style={th}>تاريخ الانتهاء</th>
              <th style={th}>الحالة الفعلية</th>
              <th className="no-print" style={th}>إجراء طوارئ / تمديد</th>
            </tr>
          </thead>
          <tbody>
            {links.map(link => {
              const actualPrice = Number(link.price_at_sale || link.price || 0);
              const isExpired = new Date(link.expires_at) < new Date();
              const displayStatus = link.status === 'inactive' ? 'معطل' : (isExpired ? 'منتهي' : 'فعال');
              
              // بناء الرابط الكامل
              const fullUrl = `${window.location.origin}/${link.themes?.slug || 'gift'}/${link.short_id || link.id.split('-')[0]}`;

              return (
                <tr key={link.id} style={tdRow}>
                  {/* عرض الرابط الكامل */}
                  <td style={{ ...td, direction: 'ltr', textAlign: 'left', maxWidth: '200px', wordBreak: 'break-all' }}>
                    <a href={fullUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                      {fullUrl}
                    </a>
                  </td>
                  
                  <td style={td}>
                    <strong>{link.themes?.name}</strong><br/>
                    <span style={{ color: '#00cc66', fontWeight: 'bold' }}>{actualPrice.toLocaleString()} د.ع</span>
                  </td>
                  
                  <td style={td}>
                    <span style={{ color: '#111', fontWeight: 'bold' }}>{link.points_of_sale?.name}</span><br/>
                    <span style={{ fontSize: '11px', color: '#555' }}>👤 {link.profiles?.fullname || 'غير معروف'}</span>
                  </td>
                  
                  <td dir="ltr" style={{ ...td, textAlign: 'right' }}>
                    <span style={{ color: isExpired ? '#ff9800' : '#555', fontWeight: isExpired ? 'bold' : 'normal' }}>
                      {new Date(link.expires_at).toLocaleString('en-IQ')}
                    </span>
                  </td>
                  
                  <td style={td}>
                    <span style={displayStatus === 'فعال' ? badgeActive : (displayStatus === 'منتهي' ? badgeExpired : badgeInactive)}>
                      {displayStatus === 'فعال' ? '🟢 شغال' : (displayStatus === 'منتهي' ? '🟠 انتهى وقته' : '🔴 معطل يدوياً')}
                    </span>
                  </td>
                  
                  <td className="no-print" style={td}>
                    {/* إذا الرابط منتهي، نعرض خيارات التمديد */}
                    {displayStatus === 'منتهي' ? (
                      <div style={extendBox}>
                        <select 
                          value={extensions[link.id] || 'daily'} 
                          onChange={(e) => setExtensions({...extensions, [link.id]: e.target.value})}
                          style={selectStyle}
                        >
                          <option value="daily">يومي</option>
                          <option value="weekly">أسبوعي</option>
                          <option value="monthly">شهري</option>
                        </select>
                       <button 
  onClick={() => extendLink(link.id, link.short_id || link.id.split('-')[0], actualPrice, link.points_of_sale?.name)} 
  style={btnExtend}
>
  تمديد وتفعيل ♻️
</button>
                      </div>
                    ) : (
                      // إذا الرابط ما منتهي، نعرض زر التعطيل/التفعيل الطبيعي
                      <button onClick={() => toggleStatus(link.id, link.status)} style={link.status === 'active' ? btnDisable : btnEnable}>
                        {link.status === 'active' ? 'إيقاف إجباري ❌' : 'إعادة تفعيل ✅'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {links.length === 0 && <tr><td colSpan={6} style={emptyText}>لا توجد روابط مولدة.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// الستايلات
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px', direction: 'rtl' };
const headerSection: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eee' };
const title: React.CSSProperties = { margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' };
const desc: React.CSSProperties = { margin: 0, fontSize: '12px', color: '#666' };
const printBtn: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const excelBtn: React.CSSProperties = { background: '#00cc66', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const tableContainer: React.CSSProperties = { background: '#fff', borderRadius: '10px', border: '1px solid #eee', overflowX: 'auto' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thRow: React.CSSProperties = { background: '#f8f9fa', borderBottom: '1px solid #eee' };
const th: React.CSSProperties = { padding: '12px 15px', fontSize: '13px', color: '#444' };
const tdRow: React.CSSProperties = { borderBottom: '1px solid #eee' };
const td: React.CSSProperties = { padding: '12px 15px', fontSize: '13px', verticalAlign: 'middle' };

// ألوان الحالات (أخضر للفعال، برتقالي للمنتهي، أحمر للمعطل)
const badgeActive: React.CSSProperties = { color: '#00cc66', fontWeight: 'bold', background: '#e6f9f0', padding: '5px 10px', borderRadius: '6px' };
const badgeInactive: React.CSSProperties = { color: '#dc2626', fontWeight: 'bold', background: '#fef2f2', padding: '5px 10px', borderRadius: '6px' };
const badgeExpired: React.CSSProperties = { color: '#ea580c', fontWeight: 'bold', background: '#fff7ed', padding: '5px 10px', borderRadius: '6px' };

// أزرار التحكم الأساسية
const btnDisable: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const btnEnable: React.CSSProperties = { background: '#e6f9f0', border: '1px solid #00cc66', color: '#00cc66', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };

// أدوات التمديد
const extendBox: React.CSSProperties = { display: 'flex', gap: '5px', alignItems: 'center' };
const selectStyle: React.CSSProperties = { padding: '5px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px', outline: 'none' };
const btnExtend: React.CSSProperties = { background: '#fff7ed', border: '1px solid #fdba74', color: '#ea580c', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };

const linkStyle: React.CSSProperties = { color: '#2563eb', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' };
const emptyText: React.CSSProperties = { padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' };