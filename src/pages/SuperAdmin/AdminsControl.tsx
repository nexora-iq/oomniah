import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Swal from 'sweetalert2';
import { 
  FaUsers, FaUserPlus, FaBuilding, FaUserShield, 
  FaBan, FaCheckCircle, FaInfoCircle, FaSpinner, 
  FaUserLock, FaUnlock, FaUserTie 
} from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

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

export default function StaffManager() {
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // البيانات المطلوبة للربط فقط
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    
    // جلب الفروع لقائمة الاختيار
    const { data: pagesData } = await supabase.from('pages').select('id, name').eq('status', 'active');
    if (pagesData) {
      setBranches(pagesData);
      if (pagesData.length > 0) setSelectedPageId(pagesData[0].id);
    }

    // جلب الموظفين الحاليين
    const { data: staffData } = await supabase.from('profiles')
      .select('id, fullname, role, is_blocked, pages(name)')
      .eq('role', 'page_admin');
      
    if (staffData) setStaff(staffData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPageId) {
      return Toast.fire({ icon: 'warning', title: 'يجب إضافة فرع واحد على الأقل أولاً!' });
    }
    
    setLoading(true);
    
    // استخدام الدالة الذكية اللي زرعناها بالـ SQL للبحث عن الإيميل والربط
    const { error: rpcError } = await supabase.rpc('link_staff_profile', {
      p_email: email,
      p_fullname: fullname,
      p_page_id: selectedPageId
    });

    if (rpcError) {
      Toast.fire({ icon: 'error', title: `خطأ: ${rpcError.message}` });
    } else {
      Toast.fire({ icon: 'success', title: 'تم ربط الموظف بالفرع بنجاح!' });
      setFullname(''); setEmail('');
      fetchData();
    }
    
    setLoading(false);
  };

  const toggleBlock = async (id: string, isBlocked: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !isBlocked }).eq('id', id);
    if (error) {
      Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء تغيير حالة الموظف.' });
    } else {
      Toast.fire({ icon: 'success', title: isBlocked ? 'تم رفع الحظر عن الموظف.' : 'تم حظر الموظف بنجاح.' });
      fetchData();
    }
  };

  return (
    <div className="fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .card { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .input-style { padding: 12px 15px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; width: 100%; box-sizing: border-box; background: #f8fafc; font-size: 14px; transition: 0.3s; }
        .input-style:focus { border-color: #dc2626; background: #fff; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        
        .staff-table { width: 100%; border-collapse: collapse; text-align: right; }
        .staff-table th { background: #f8fafc; padding: 15px 12px; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
        .staff-table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; vertical-align: middle; transition: 0.2s; }
        .table-row:hover td { background: #fef2f2; }
        
        .btn-submit { display: flex; align-items: center; justify-content: center; gap: 8px; background: #dc2626; color: #fff; padding: 12px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; height: 43px; transition: 0.3s; }
        .btn-submit:hover:not(:disabled) { background: #b91c1c; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; }
        .badge-role { background: #f1f5f9; color: #475569; }
        .badge-active { background: #dcfce7; color: #16a34a; }
        .badge-blocked { background: #fee2e2; color: #dc2626; }
        
        .action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; font-size: 12px; transition: 0.2s; }
        .btn-block { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .btn-block:hover { background: #fee2e2; }
        .btn-unblock { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .btn-unblock:hover { background: #dcfce7; }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="card">
        <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: '900' }}>
          <FaUsers style={{ color: '#dc2626' }} /> إدارة فريق العمل
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <FaInfoCircle style={{ color: '#0ea5e9', fontSize: '16px' }} />
          <strong>ملاحظة هامة:</strong> قم بإضافة (الإيميل وكلمة المرور) للموظف من لوحة Supabase (Authentication) أولاً، ثم اكتب الإيميل هنا لربطه بالفرع.
        </p>
      </div>

      <form onSubmit={handleAddStaff} className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>اسم الموظف</label>
          <input type="text" required value={fullname} onChange={e => setFullname(e.target.value)} className="input-style" placeholder="مثال: أحمد العراقي" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>البريد الإلكتروني (المسجل في Supabase)</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-style" placeholder="ahmed@oomniah.com" dir="ltr" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>تخصيص لفرع</label>
          <select required value={selectedPageId} onChange={e => setSelectedPageId(e.target.value)} className="input-style">
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading || branches.length === 0} className="btn-submit">
          {loading ? <FaSpinner className="spin" style={{ fontSize: '18px' }} /> : <><FaUserPlus /> ربط الموظف</>}
        </button>
      </form>

      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table className="staff-table">
          <thead>
            <tr>
              <th>الاسم والموظف</th>
              <th>الفرع المخصص</th>
              <th>الصلاحية</th>
              <th>الحالة</th>
              <th>إجراء التحكم</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id} className="table-row" style={{ opacity: member.is_blocked ? 0.6 : 1, filter: member.is_blocked ? 'grayscale(0.5)' : 'none' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#1e293b' }}>
                    <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '50%', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaUserTie />
                    </div>
                    {member.fullname || 'بدون اسم'}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 'bold' }}>
                    <FaBuilding style={{ color: '#94a3b8' }} /> {member.pages?.name || 'غير محدد'}
                  </div>
                </td>
                <td>
                  <span className="badge badge-role">
                    <FaUserShield style={{ color: '#64748b' }} /> مدير فرع
                  </span>
                </td>
                <td>
                  <span className={`badge ${member.is_blocked ? 'badge-blocked' : 'badge-active'}`}>
                    {member.is_blocked ? <><FaBan /> محظور</> : <><FaCheckCircle /> نشط</>}
                  </span>
                </td>
                <td>
                  <button onClick={() => toggleBlock(member.id, member.is_blocked)} className={`action-btn ${member.is_blocked ? 'btn-unblock' : 'btn-block'}`}>
                    {member.is_blocked ? <><FaUnlock /> رفع الحظر</> : <><FaUserLock /> حظر الموظف</>}
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && !loading && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>لا يوجد موظفين مسجلين حالياً.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}