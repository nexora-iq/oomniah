import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function AdminsControl() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [posList, setPosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all'); // all, hour, day, week, month, year

  // حالة فورم الإضافة
  const [editId, setEditId] = useState<string | null>(null);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPos, setSelectedPos] = useState('');

  const fetchData = async () => {
    // 1. جلب الموظفين مع فروعهم وكل الروابط التي قاموا بتوليدها من البداية
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        *,
        points_of_sale ( name ),
        gift_links!gift_links_created_by_fkey ( id, price, is_cleared, created_at )
      `)
      .eq('role', 'pos_admin')
      .order('created_at', { ascending: false });

    // حساب نطاق الفلترة الزمنية للبحث الحالي
    const now = new Date();
    const filterDate = new Date();
    if (timeFilter === 'hour') filterDate.setHours(now.getHours() - 1);
    if (timeFilter === 'day') filterDate.setDate(now.getDate() - 1);
    if (timeFilter === 'week') filterDate.setDate(now.getDate() - 7);
    if (timeFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
    if (timeFilter === 'year') filterDate.setFullYear(now.getFullYear() - 1);

    if (profiles) {
      const enrichedAdmins = profiles.map(p => {
        const allLinks = p.gift_links || [];
        
        // أ) حسابات تراكمية أزلية (لا تتأثر بالتصفير)
        const allTimeLinksCount = allLinks.length;
        const allTimeTotalRevenue = allLinks.reduce((sum: number, l: any) => sum + Number(l.price || 0), 0);
        const allTimeClearedRevenue = allLinks.filter((l: any) => l.is_cleared === true).reduce((sum: number, l: any) => sum + Number(l.price || 0), 0);

        // ب) حسابات جارية خاضعة للفلاتر والبحث الزمني والتصفية
        const filteredLinks = allLinks.filter((l: any) => {
          const linkDate = new Date(l.created_at);
          return timeFilter === 'all' ? true : linkDate >= filterDate;
        });

        const currentPendingLinksCount = filteredLinks.filter((l: any) => l.is_cleared === false).length;
        const currentPendingRevenue = filteredLinks.filter((l: any) => l.is_cleared === false).reduce((sum: number, l: any) => sum + Number(l.price || 0), 0);

        return {
          ...p,
          posName: p.points_of_sale?.name || 'غير مرتبط',
          allTimeLinksCount,
          allTimeTotalRevenue,
          allTimeClearedRevenue, // الأرباح المستلمة كلياً من البداية
          currentPendingLinksCount,
          currentPendingRevenue // الأرباح الحالية قيد التصفية بناء على البحث
        };
      });
      setAdmins(enrichedAdmins);
    }

    // 2. جلب الفروع للفورم
    const { data: pos } = await supabase.from('points_of_sale').select('id, name');
    if (pos) setPosList(pos);
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editId) {
      // تعديل بيانات الموظف
      const { error } = await supabase
        .from('profiles')
        .update({ fullname, email, pos_id: selectedPos })
        .eq('id', editId);
      
      if (error) alert(`خطأ: ${error.message}`);
      else resetForm();
    } else {
      // إضافة موظف جديد بـ Auth
      const { data, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        alert(`خطأ في الإنشاء: ${authError.message}`);
      } else if (data.user) {
        await supabase.from('profiles').update({
          fullname, pos_id: selectedPos, role: 'pos_admin', email
        }).eq('id', data.user.id);
        resetForm();
      }
    }
    fetchData();
    setLoading(false);
  };

  // تصفية أرباح موظف معين وتصفير حسابه الجاري
  const handleAdminClearance = async (adminId: string, adminName: string, amount: number) => {
    if (amount === 0) return alert('الحساب الجاري للموظف مصفر بالفعل ضمن نطاق البحث هذا.');

    const confirm = window.confirm(`هل أنت متأكد من تصفية حساب الموظف "${adminName}" واستلام مبلغ (${amount.toLocaleString()} د.ع)؟\n\nملاحظة: هذا سيصفر حسابه الحالي فقط ولن يمس عداد أرباحه الأزلي الكلي.`);
    if (confirm) {
      await supabase
        .from('gift_links')
        .update({ is_cleared: true })
        .eq('created_by', adminId)
        .eq('is_cleared', false);

      // تسجيل العملية في السجل العام للرقابة
      await supabase.from('system_logs').insert([{
        admin_name: 'المدير العام',
        pos_name: 'النظام المركزي',
        action_type: 'تصفية موظف',
        details: `تمت تصفية الحساب الجاري للموظف ${adminName} بمبلغ ${amount.toLocaleString()} د.ع`
      }]);

      fetchData();
    }
  };

  const handleEditClick = (admin: any) => {
    setEditId(admin.id);
    setFullname(admin.fullname || '');
    setEmail(admin.email || '');
    setSelectedPos(admin.pos_id || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`هل تريد حذف الموظف "${name}" نهائياً من السيستم؟`);
    if (confirm) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) alert('لا يمكن حذف الموظف لوجود مبيعات مرتبطة باسمه تجنباً لتخريب الإحصائيات الماليّة.');
      else fetchData();
    }
  };

  const toggleBlock = async (id: string, currentStatus: boolean) => {
    await supabase.from('profiles').update({ is_blocked: !currentStatus }).eq('id', id);
    fetchData();
  };

  const resetForm = () => {
    setEditId(null); setFullname(''); setEmail(''); setPassword(''); setSelectedPos('');
  };

  return (
    <div style={container}>
      <div style={headerSection}>
        <div>
          <h3 style={title}>إدارة الموظفين والرقابة الماليّة 👥</h3>
          <p style={desc}>مراقبة مبيعات الموظفين، تصفية حساباتهم الجارية، وتتبع مستحقاتهم الأزلية.</p>
        </div>
        
        {/* شريط البحث والفلترة الزمني */}
        <div style={filterRibbon}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>نطاق البحث المالي الحالي:</span>
          <button type="button" onClick={() => setTimeFilter('all')} style={timeFilter === 'all' ? activeFilterBtn : filterBtn}>كل الأوقات</button>
          <button type="button" onClick={() => setTimeFilter('year')} style={timeFilter === 'year' ? activeFilterBtn : filterBtn}>هذه السنة</button>
          <button type="button" onClick={() => setTimeFilter('month')} style={timeFilter === 'month' ? activeFilterBtn : filterBtn}>هذا الشهر</button>
          <button type="button" onClick={() => setTimeFilter('week')} style={timeFilter === 'week' ? activeFilterBtn : filterBtn}>هذا الأسبوع</button>
          <button type="button" onClick={() => setTimeFilter('day')} style={timeFilter === 'day' ? activeFilterBtn : filterBtn}>اليوم</button>
        </div>
      </div>

      {/* فورم الإضافة والتعديل */}
      <form onSubmit={handleSubmit} style={editId ? editFormStyle : addFormStyle}>
        {editId && <div style={editBadge}>جاري تعديل بيانات الموظف المختار...</div>}
        <div style={inputGroup}>
          <label style={label}>الاسم الثلاثي</label>
          <input type="text" required value={fullname} onChange={e => setFullname(e.target.value)} style={input} />
        </div>
        <div style={inputGroup}>
          <label style={label}>البريد الإلكتروني</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={input} />
        </div>
        {!editId && (
          <div style={inputGroup}>
            <label style={label}>كلمة المرور</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={input} placeholder="******" />
          </div>
        )}
        <div style={inputGroup}>
          <label style={label}>تثبيته داخل فرع</label>
          <select required value={selectedPos} onChange={e => setSelectedPos(e.target.value)} style={input}>
            <option value="">اختر الفرع...</option>
            {posList.map(pos => (
              <option key={pos.id} value={pos.id}>{pos.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" disabled={loading} style={editId ? updateBtn : addBtn}>
            {loading ? '...' : (editId ? 'حفظ' : '+ إضافة')}
          </button>
          {editId && <button type="button" onClick={resetForm} style={cancelBtn}>إلغاء</button>}
        </div>
      </form>

      {/* عرض الموظفين كبطاقات تفصيلية مدمجة ومعزولة تماماً */}
      <div style={cardsGrid}>
        {admins.map((admin) => (
          <div key={admin.id} style={adminCard}>
            
            {/* رأس البطاقة */}
            <div style={cardHeader}>
              <div>
                <h4 style={adminNameText}>{admin.fullname}</h4>
                <span style={adminEmailText}>✉️ {admin.email}</span>
              </div>
              <span style={branchBadge}>{admin.posName}</span>
            </div>

            {/* بوكس البحث الزمني الحالي (خاضع للتصفير والفلترة) */}
            <div style={currentStatsBox}>
              <div style={boxTitle}>📊 نتائج البحث والفلترة الحالي:</div>
              <div style={statLine}>
                <span>الروابط غير المصفاة:</span>
                <strong>{admin.currentPendingLinksCount} رابط</strong>
              </div>
              <div style={statLine}>
                <span>الأرباح قيد التحصيل:</span>
                <strong style={{ color: '#00cc66' }}>{admin.currentPendingRevenue.toLocaleString()} د.ع</strong>
              </div>
              <button 
                type="button" 
                onClick={() => handleAdminClearance(admin.id, admin.fullname, admin.currentPendingRevenue)} 
                style={clearanceBtn}
              >
                💸 استلام وتصفية حساب الموظف
              </button>
            </div>

            {/* بوكس الحساب الكلي الشامل (أزلي لا يتأثر بالتصفير ابداً) */}
            <div style={allTimeStatsBox}>
              <div style={boxTitle}>🔒 العداد التراكمي الشامل (من البداية):</div>
              <div style={statLine}>
                <span>إجمالي مبيعاته الكلية:</span>
                <span>{admin.allTimeLinksCount} رابط</span>
              </div>
              <div style={statLine}>
                <span>إجمالي الأرباح المستلمة كلياً:</span>
                <span style={{ color: '#ff4d4d', fontWeight: '900' }}>{admin.allTimeClearedRevenue.toLocaleString()} د.ع</span>
              </div>
            </div>

            {/* أزرار الإجراءات السريعة لحظر وتعديل الموظف */}
            <div style={cardActions}>
              <button type="button" onClick={() => handleEditClick(admin)} style={actionBtnEdit}>✏️ تعديل البيانات</button>
              <button 
                type="button" 
                onClick={() => toggleBlock(admin.id, admin.is_blocked)} 
                style={admin.is_blocked ? btnUnblock : btnBlock}
              >
                {admin.is_blocked ? '🔓 فك الحظر' : '🚫 حظر وطرد'}
              </button>
              <button type="button" onClick={() => handleDeleteClick(admin.id, admin.fullname)} style={actionBtnDelete}>🗑️ حذف</button>
            </div>

          </div>
        ))}
        {admins.length === 0 && <p style={{ textAlign: 'center', width: '100%', color: '#999' }}>لا يوجد موظفين مضافين حالياً.</p>}
      </div>
    </div>
  );
}

// الستايلات الاحترافية والمصغرة البارزة بالكامل عن الخلفية
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const headerSection: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 25px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const title: React.CSSProperties = { margin: 0, fontSize: '18px', color: '#111', fontWeight: '900' };
const desc: React.CSSProperties = { margin: '4px 0 0 0', fontSize: '12px', color: '#666' };

const filterRibbon: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
const filterBtn: React.CSSProperties = { background: '#f5f5f5', border: '1px solid #ddd', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#555' };
const activeFilterBtn: React.CSSProperties = { ...filterBtn, background: '#111', color: '#fff', border: '1px solid #111' };

const addFormStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end', background: '#fff', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e0e0e0' };
const editFormStyle: React.CSSProperties = { ...addFormStyle, border: '2px solid #00cc66', background: '#f2fdf7', position: 'relative' };
const editBadge: React.CSSProperties = { position: 'absolute', top: '-10px', right: '15px', background: '#00cc66', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };

const inputGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' };
const label: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#444' };
const input: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '12px', background: '#fff', outline: 'none' };

const addBtn: React.CSSProperties = { background: '#111', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', height: '36px' };
const updateBtn: React.CSSProperties = { ...addBtn, background: '#00cc66' };
const cancelBtn: React.CSSProperties = { background: '#ddd', color: '#333', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', height: '36px' };

// حاوية بطاقات الموظفين الخارقة
const cardsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' };

// البطاقة الاحترافية البارزة والمعزولة تماماً بظل حقيقي قوي
const adminCard: React.CSSProperties = { 
  background: '#ffffff', 
  padding: '22px', 
  borderRadius: '16px', 
  border: '1px solid #dcdcdc', 
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.07)', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '15px' 
};

const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const adminNameText: React.CSSProperties = { margin: 0, fontSize: '16px', fontWeight: '900', color: '#111' };
const adminEmailText: React.CSSProperties = { fontSize: '11px', color: '#777', marginTop: '2px', display: 'block' };
const branchBadge: React.CSSProperties = { background: '#f0f7ff', color: '#007bff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #cce5ff' };

const currentStatsBox: React.CSSProperties = { background: '#f8fdfa', padding: '14px', borderRadius: '12px', border: '1px solid #e1f7ec' };
const allTimeStatsBox: React.CSSProperties = { background: '#fffcfc', padding: '14px', borderRadius: '12px', border: '1px solid #ffebeb' };
const boxTitle: React.CSSProperties = { margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#222' };
const statLine: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#444', marginBottom: '6px' };

const clearanceBtn: React.CSSProperties = { width: '100%', background: '#111', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', marginTop: '8px' };

const cardActions: React.CSSProperties = { display: 'flex', gap: '6px', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '5px' };
const actionBtnEdit: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: '#555', flex: 1 };
const actionBtnDelete: React.CSSProperties = { background: '#fff', border: '1px solid #ffcccc', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#ff4d4d', fontWeight: 'bold' };
const btnBlock: React.CSSProperties = { background: '#fff0f0', border: '1px solid #ffcccc', color: '#ff4d4d', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flex: 1 };
const btnUnblock: React.CSSProperties = { background: '#00cc66', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flex: 1 };