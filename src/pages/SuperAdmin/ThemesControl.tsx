import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function ThemesControl() {
  const [themesList, setThemesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // فورم الإضافة
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');

  const fetchThemesData = async () => {
    // 🛠️ جلب الـ price_at_sale الخاص بالرابط حتى نحسب أرباح الثيم بدقة
    const { data: themes, error } = await supabase
      .from('themes')
      .select(`
        id,
        name,
        slug,
        price_iqd,
        status,
        created_at,
        gift_links ( id, price_at_sale, price )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في جلب الثيمات:', error);
      return;
    }

    if (themes) {
      const enrichedThemes = themes.map(theme => {
        const salesCount = theme.gift_links?.length || 0;
        const totalRevenue = theme.gift_links?.reduce((sum: number, link: any) => {
            const actualPrice = Number(link.price_at_sale || link.price || 0);
            return sum + actualPrice;
        }, 0) || 0;
        
        return { 
          ...theme, 
          salesCount, 
          totalRevenue,
          price_iqd: theme.price_iqd || 0 
        };
      });
      setThemesList(enrichedThemes);
    }
  };

  useEffect(() => {
    fetchThemesData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('themes').insert([
      { name, slug, price_iqd: Number(price), status: 'active' }
    ]);

    if (error) {
      alert(`خطأ في الإضافة: ${error.message}`);
    } else {
      // تسجيل الحركة في النظام
      await supabase.from('system_logs').insert([{
        admin_name: 'السوبر أدمن',
        pos_name: 'لوحة التحكم',
        action_type: 'إضافة ثيم',
        details: `تمت إضافة ثيم جديد باسم (${name}) بسعر ${price} د.ع`
      }]);

      setName(''); setSlug(''); setPrice('');
      fetchThemesData();
    }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: string, themeName: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await supabase.from('themes').update({ status: newStatus }).eq('id', id);
    
    // تسجيل تغيير حالة الثيم
    await supabase.from('system_logs').insert([{
        admin_name: 'السوبر أدمن',
        pos_name: 'لوحة التحكم',
        action_type: newStatus === 'active' ? 'تفعيل ثيم' : 'تعطيل ثيم',
        details: `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} ثيم (${themeName})`
    }]);

    fetchThemesData();
  };

  return (
    <div style={container}>
      <div style={headerSection}>
        <h3 style={title}>متجر الثيمات 🎨</h3>
        <p style={desc}>إدارة قوالب الهدايا، تحديد الأسعار، ومراقبة أداء كل ثيم.</p>
      </div>

      <form onSubmit={handleAdd} style={addForm}>
        <div style={inputGroup}>
          <label style={label}>اسم الثيم</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} style={input} placeholder="مثال: هيلو كيتي" />
        </div>
        <div style={inputGroup}>
          <label style={label}>رابط الثيم (Slug)</label>
          <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} style={input} placeholder="hello-kitty" />
        </div>
        <div style={inputGroup}>
          <label style={label}>السعر (د.ع)</label>
          <input type="number" required value={price} onChange={e => setPrice(e.target.value)} style={input} placeholder="5000" />
        </div>
        <button type="submit" disabled={loading} style={addBtn}>
          {loading ? '...' : '+ رفع ثيم'}
        </button>
      </form>

      <div style={tableContainer}>
        <table style={table}>
          <thead>
            <tr style={thRow}>
              <th style={th}>الثيم</th>
              <th style={th}>الرابط</th>
              <th style={th}>السعر</th>
              <th style={th}>المبيعات</th>
              <th style={th}>إجمالي الأرباح المجلوبة</th>
              <th style={th}>الحالة</th>
              <th style={th}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {themesList.map((theme) => (
              <tr key={theme.id} style={tdRow}>
                <td style={td}><strong>{theme.name}</strong></td>
                <td style={td}><span style={badgeSlug}>{theme.slug}</span></td>
                <td style={td}><span style={priceTag}>{theme.price_iqd.toLocaleString()}</span></td>
                <td style={td}>{theme.salesCount}</td>
                <td style={{ ...td, color: '#00cc66', fontWeight: 'bold' }}>{theme.totalRevenue.toLocaleString()}</td>
                <td style={td}>
                  <span style={theme.status === 'active' ? badgeActive : badgeInactive}>
                    {theme.status === 'active' ? 'فعال' : 'معطل'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={() => toggleStatus(theme.id, theme.status, theme.name)} style={theme.status === 'active' ? btnDisable : btnEnable}>
                    {theme.status === 'active' ? 'تعطيل' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
            {themesList.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>لا توجد ثيمات مضافة.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// الستايلات
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px', direction: 'rtl', fontFamily: 'sans-serif' };
const headerSection: React.CSSProperties = { background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eee' };
const title: React.CSSProperties = { margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold' };
const desc: React.CSSProperties = { margin: 0, fontSize: '12px', color: '#666' };
const addForm: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end', background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eee' };
const inputGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const label: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#333' };
const input: React.CSSProperties = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' };
const addBtn: React.CSSProperties = { background: '#ff4d4d', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const tableContainer: React.CSSProperties = { background: '#fff', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thRow: React.CSSProperties = { background: '#f8f9fa', borderBottom: '1px solid #eee' };
const th: React.CSSProperties = { padding: '12px 15px', fontSize: '11px', color: '#444' };
const tdRow: React.CSSProperties = { borderBottom: '1px solid #eee' };
const td: React.CSSProperties = { padding: '12px 15px', fontSize: '12px', color: '#222' };
const badgeSlug: React.CSSProperties = { background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' };
const priceTag: React.CSSProperties = { background: '#fff5f7', color: '#ff4d4d', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
const badgeActive: React.CSSProperties = { color: '#00cc66', fontWeight: 'bold' };
const badgeInactive: React.CSSProperties = { color: '#ff4d4d', fontWeight: 'bold' };
const btnDisable: React.CSSProperties = { background: 'none', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' };
const btnEnable: React.CSSProperties = { background: 'none', border: '1px solid #00cc66', color: '#00cc66', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' };