import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function POSManagement() {
  const [posList, setPosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // حالة الفورم (لإضافة أو تعديل)
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [instaUrl, setInstaUrl] = useState('');

  const fetchPOSData = async () => {
    // 🛠️ جلب الفروع مع الروابط والموظفين بالطريقة الصحيحة لـ Supabase
    const { data: branches, error } = await supabase
      .from('points_of_sale')
      .select(`
        *,
        profiles:profiles!pos_id ( id, fullname, email ),
        gift_links ( id, themes ( name ) )
      `)
      .order('created_at', { ascending: true }); // ترتيب من الأقدم للأحدث

    if (error) {
      console.error("Error fetching POS data:", error);
    }

    if (branches) {
      const enrichedBranches = branches.map(branch => {
        const salesMap: Record<string, number> = {};
        if (branch.gift_links) {
          branch.gift_links.forEach((link: any) => {
            // التحقق من وجود الثيم
            const themeName = link.themes?.name || 'ثيم غير معروف';
            salesMap[themeName] = (salesMap[themeName] || 0) + 1;
          });
        }
        const themeSales = Object.keys(salesMap).map(key => ({ themeName: key, count: salesMap[key] }));
        return { ...branch, themeSales };
      });
      setPosList(enrichedBranches);
    }
  };

  useEffect(() => {
    fetchPOSData();
  }, []);

  // دالة الحفظ (تشتغل إضافة أو تعديل حسب الحالة)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (editId) {
      // 🛠️ عملية التعديل
      const { error } = await supabase.from('points_of_sale')
        .update({ name, slug, instagram_url: instaUrl })
        .eq('id', editId);
        
      if (error) alert(`خطأ في التعديل: ${error.message}`);
      else resetForm();
    } else {
      // ➕ عملية الإضافة
      const { error } = await supabase.from('points_of_sale')
        .insert([{ name, slug, instagram_url: instaUrl }]);
        
      if (error) alert(`خطأ: ${error.message} (تأكد أن الرابط غير مكرر)`);
      else resetForm();
    }
    
    fetchPOSData();
    setLoading(false);
  };

  // تجهيز الفورم للتعديل
  const handleEditClick = (pos: any) => {
    setEditId(pos.id);
    setName(pos.name);
    setSlug(pos.slug);
    setInstaUrl(pos.instagram_url || '');
    // التمرير لأعلى الصفحة حتى تشوف الفورم
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // دالة الحذف
  const handleDeleteClick = async (id: string, branchName: string) => {
    const confirmDelete = window.confirm(`هل أنت متأكد أنك تريد حذف فرع "${branchName}"؟ \n\nملاحظة: لا يمكن حذف الفرع إذا كان يحتوي على موظفين أو روابط مباعة مرتبطة به.`);
    if (confirmDelete) {
      const { error } = await supabase.from('points_of_sale').delete().eq('id', id);
      if (error) {
        alert('لا يمكن حذف هذا الفرع لوجود موظفين أو بيانات مرتبطة به. يرجى حذف الموظفين والروابط أولاً.');
      } else {
        fetchPOSData();
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setName('');
    setSlug('');
    setInstaUrl('');
  };

  return (
    <div style={container}>
      <div style={headerSection}>
        <h2 style={title}>إدارة نقاط البيع 🏪</h2>
        <p style={desc}>التحكم الكامل ومراقبة الفروع، الموظفين، ومبيعات الثيمات الحقيقية.</p>
      </div>

      <form onSubmit={handleSubmit} style={editId ? editFormStyle : addFormStyle}>
        {editId && <div style={editBadge}>جاري تعديل بيانات الفرع...</div>}
        <div style={inputGroup}>
          <label style={label}>اسم النقطة (الفرع)</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} style={input} />
        </div>
        <div style={inputGroup}>
          <label style={label}>الرابط المختصر (Slug)</label>
          <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} style={input} />
        </div>
        <div style={inputGroup}>
          <label style={label}>رابط الانستغرام (اختياري)</label>
          <input type="url" value={instaUrl} onChange={e => setInstaUrl(e.target.value)} style={input} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <button type="submit" disabled={loading} style={editId ? updateBtn : addBtn}>
            {loading ? 'جاري المعالجة...' : (editId ? 'حفظ التعديلات ✔️' : '+ إضافة فرع')}
          </button>
          {editId && (
            <button type="button" onClick={resetForm} style={cancelBtn}>إلغاء</button>
          )}
        </div>
      </form>

      <div style={cardsContainer}>
        {posList.map((pos) => (
          <div key={pos.id} style={posCard}>
            
            <div style={cardHeader}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#111', fontSize: '18px', fontWeight: '900' }}>{pos.name}</h3>
                <span style={badgeSlug}>/{pos.slug}</span>
              </div>
              
              {/* أزرار التعديل والحذف الجديدة */}
              <div style={actionButtons}>
                <button onClick={() => handleEditClick(pos)} style={actionBtnEdit}>✏️ تعديل</button>
                <button onClick={() => handleDeleteClick(pos.id, pos.name)} style={actionBtnDelete}>🗑️ حذف</button>
              </div>
            </div>

            {pos.instagram_url && (
              <a href={pos.instagram_url} target="_blank" rel="noreferrer" style={instaBtn}>📸 زيارة الانستغرام</a>
            )}

            <div style={sectionBox}>
              <h4 style={subTitle}>👥 الموظفين المربوطين:</h4>
              {pos.profiles && pos.profiles.length > 0 ? (
                <div style={staffList}>
                  {pos.profiles.map((staff: any) => (
                    <span key={staff.id} style={staffTag}>
                      <span style={activeDot}></span> {staff.fullname || staff.email}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={emptyText}>لا يوجد موظفين مربوطين حالياً.</p>
              )}
            </div>

            <div style={sectionBox}>
              <h4 style={subTitle}>📊 مبيعات الثيمات:</h4>
              {pos.themeSales && pos.themeSales.length > 0 ? (
                <table style={miniTable}>
                  <tbody>
                    {pos.themeSales.map((sale: any, index: number) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e8e8e8' }}>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#333', fontWeight: 'bold' }}>{sale.themeName}</td>
                        <td style={{ padding: '8px 0', fontSize: '13px', fontWeight: 'bold', color: '#00cc66', textAlign: 'left' }}>
                          {sale.count} رابط
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={emptyText}>لا توجد مبيعات مسجلة لهذا الفرع حتى الآن.</p>
              )}
            </div>

          </div>
        ))}
        {posList.length === 0 && <p style={{ textAlign: 'center', width: '100%', color: '#999', marginTop: '20px' }}>لا توجد نقاط بيع مضافة حالياً.</p>}
      </div>
    </div>
  );
}

// الستايلات
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const headerSection: React.CSSProperties = { background: '#fff', padding: '20px 25px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };
const title: React.CSSProperties = { margin: '0 0 5px 0', fontSize: '20px', color: '#111', fontWeight: '900' };
const desc: React.CSSProperties = { margin: 0, fontSize: '13px', color: '#666' };

const addFormStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end', background: '#fff', padding: '20px 25px', borderRadius: '12px', border: '1px solid #e0e0e0', transition: '0.3s' };
const editFormStyle: React.CSSProperties = { ...addFormStyle, border: '2px solid #00cc66', background: '#f2fdf7', position: 'relative' };
const editBadge: React.CSSProperties = { position: 'absolute', top: '-12px', right: '20px', background: '#00cc66', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };

const inputGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' };
const label: React.CSSProperties = { fontSize: '12px', fontWeight: 'bold', color: '#333' };
const input: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '13px', outline: 'none', background: '#fff' };

const addBtn: React.CSSProperties = { background: '#ff4d4d', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', height: '42px', width: '100%' };
const updateBtn: React.CSSProperties = { background: '#00cc66', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', height: '42px', width: '100%' };
const cancelBtn: React.CSSProperties = { background: '#eee', color: '#555', border: 'none', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', height: '42px' };

const cardsContainer: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px', paddingTop: '10px' };
const posCard: React.CSSProperties = { background: '#ffffff', padding: '25px', borderRadius: '16px', border: '1px solid #dcdcdc', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' };
const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const badgeSlug: React.CSSProperties = { background: '#f0f0f0', color: '#555', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' };

const actionButtons: React.CSSProperties = { display: 'flex', gap: '8px' };
const actionBtnEdit: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#555', fontWeight: 'bold' };
const actionBtnDelete: React.CSSProperties = { background: '#fff', border: '1px solid #ffcccc', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#ff4d4d', fontWeight: 'bold' };

const instaBtn: React.CSSProperties = { background: '#fff0f3', color: '#ff4d4d', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ffd6e0', alignSelf: 'flex-start' };

const sectionBox: React.CSSProperties = { background: '#f8f9fa', padding: '18px', borderRadius: '12px', border: '1px solid #ebebeb' };
const subTitle: React.CSSProperties = { margin: '0 0 12px 0', fontSize: '14px', color: '#222', fontWeight: 'bold' };
const staffList: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
const staffTag: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' };
const activeDot: React.CSSProperties = { width: '8px', height: '8px', background: '#00cc66', borderRadius: '50%' };
const miniTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const emptyText: React.CSSProperties = { margin: 0, fontSize: '13px', color: '#888', fontStyle: 'italic' };