import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function LinksMaster() {
  const [links, setLinks] = useState<any[]>([]);

  const fetchLinks = async () => {
    // 🛠️ جلب البيانات مع price_at_sale والعلاقات الصحيحة بدون أسماء معقدة
    const { data, error } = await supabase.from('gift_links').select(`
      id, price, price_at_sale, status, created_at,
      themes ( name ),
      profiles:created_by ( fullname ),
      points_of_sale ( name )
    `).order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching links:", error);
    }

    if (data) setLinks(data);
  };

  useEffect(() => { fetchLinks(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';
    await supabase.from('gift_links').update({ status: newStatus }).eq('id', id);
    fetchLinks();
  };

  const exportToExcel = () => {
    const headers = ["ID", "الثيم", "السعر", "الفرع", "الموظف", "التاريخ", "الحالة"];
    const rows = links.map(l => {
      // التأكد من جلب السعر الصحيح للرابط
      const actualPrice = Number(l.price_at_sale || l.price || 0);
      return [
        l.id.split('-')[0], 
        l.themes?.name || '-', 
        actualPrice, 
        l.points_of_sale?.name || '-', 
        l.profiles?.fullname || 'غير معروف',
        new Date(l.created_at).toLocaleString('en-IQ'), 
        l.status === 'active' ? 'فعال' : 'معطل'
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
          <p style={desc}>مراقبة الروابط وتفاصيلها (الموظف، السعر) وتصديرها.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={printBtn}>🖨️ طباعة</button>
          <button onClick={exportToExcel} style={excelBtn}>📊 تصدير إكسل</button>
        </div>
      </div>

      <div style={tableContainer}>
        <table style={table}>
          <thead style={thRow}>
            <tr><th style={th}>معرف الرابط</th><th style={th}>الثيم والسعر</th><th style={th}>الفرع والموظف</th><th style={th}>تاريخ التوليد</th><th style={th}>الحالة</th><th className="no-print" style={th}>إجراء طوارئ</th></tr>
          </thead>
          <tbody>
            {links.map(link => {
              // التأكد من عرض السعر الصحيح
              const actualPrice = Number(link.price_at_sale || link.price || 0);

              return (
                <tr key={link.id} style={tdRow}>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#888' }}>{link.id.split('-')[0]}</td>
                  <td style={td}>
                    <strong>{link.themes?.name}</strong><br/>
                    <span style={{ color: '#00cc66', fontWeight: 'bold' }}>{actualPrice.toLocaleString()} د.ع</span>
                  </td>
                  <td style={td}>
                    <span style={{ color: '#007bff', fontWeight: 'bold' }}>{link.points_of_sale?.name}</span><br/>
                    <span style={{ fontSize: '11px', color: '#555' }}>👤 {link.profiles?.fullname || 'غير معروف'}</span>
                  </td>
                  <td style={td} dir="ltr">{new Date(link.created_at).toLocaleString('en-IQ')}</td>
                  <td style={td}>
                    <span style={link.status === 'active' ? badgeActive : badgeInactive}>
                      {link.status === 'active' ? '🟢 شغال' : '🔴 معطل'}
                    </span>
                  </td>
                  <td className="no-print" style={td}>
                    <button onClick={() => toggleStatus(link.id, link.status)} style={link.status === 'active' ? btnDisable : btnEnable}>
                      {link.status === 'active' ? 'تعطيل ❌' : 'تفعيل ✅'}
                    </button>
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
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const headerSection: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eee' };
const title: React.CSSProperties = { margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' };
const desc: React.CSSProperties = { margin: 0, fontSize: '12px', color: '#666' };
const printBtn: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const excelBtn: React.CSSProperties = { background: '#00cc66', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const tableContainer: React.CSSProperties = { background: '#fff', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thRow: React.CSSProperties = { background: '#f8f9fa', borderBottom: '1px solid #eee' };
const th: React.CSSProperties = { padding: '12px 15px', fontSize: '12px', color: '#444' };
const tdRow: React.CSSProperties = { borderBottom: '1px solid #eee' };
const td: React.CSSProperties = { padding: '12px 15px', fontSize: '12px' };
const badgeActive: React.CSSProperties = { color: '#00cc66', fontWeight: 'bold' };
const badgeInactive: React.CSSProperties = { color: '#ff4d4d', fontWeight: 'bold' };
const btnDisable: React.CSSProperties = { background: '#fff0f0', border: '1px solid #ffcccc', color: '#ff4d4d', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' };
const btnEnable: React.CSSProperties = { background: '#e6f9f0', border: '1px solid #00cc66', color: '#00cc66', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' };
const emptyText: React.CSSProperties = { padding: '20px', textAlign: 'center', color: '#999', fontSize: '12px' };