import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Swal from 'sweetalert2';
import { 
  FaBuilding, FaPlus, FaStore, FaHandshake, 
  FaUserTie, FaBan, FaCheckCircle 
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

export default function BranchesManager() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // بيانات الإضافة
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('owned');
  const [ownerPercentage, setOwnerPercentage] = useState('100');

  const fetchBranchesAndEmployees = async () => {
    setDataLoading(true);
    try {
      // 1. جلب الفروع
      const { data: pagesData, error: pagesError } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
      if (pagesError) throw pagesError;

      // 2. جلب الموظفين
      const { data: profilesData, error: profilesError } = await supabase.from('profiles')
        .select('id, fullname, role, page_id, is_blocked')
        .neq('role', 'super_admin');
        
      if (profilesError) throw profilesError;

      // 3. دمج الموظفين بداخل الفروع بالاعتماد على page_id
      const branchesWithEmployees = (pagesData || []).map(branch => {
        const branchEmployees = (profilesData || []).filter(emp => emp.page_id === branch.id);
        return {
          ...branch,
          employees: branchEmployees
        };
      });

      setBranches(branchesWithEmployees);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء جلب بيانات الفروع والموظفين.' });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchBranchesAndEmployees(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    
    const { error } = await supabase.from('pages').insert([
      { name, slug: cleanSlug, type, owner_percentage: Number(ownerPercentage), status: 'active' }
    ]);

    setLoading(false);

    if (error) {
      Toast.fire({ icon: 'error', title: `فشل الإضافة: ${error.message}` });
    } else {
      Toast.fire({ icon: 'success', title: `تمت إضافة فرع "${name}" بنجاح!` });
      setName(''); setSlug(''); setType('owned'); setOwnerPercentage('100');
      fetchBranchesAndEmployees();
    }
  };

  const toggleStatus = async (id: string, current: string, branchName: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';

    setBranches(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    
    const { error } = await supabase.from('pages').update({ status: newStatus }).eq('id', id);
    
    if (error) {
      Toast.fire({ icon: 'error', title: error.message });
      fetchBranchesAndEmployees(); 
    } else {
      Toast.fire({ 
        icon: 'success', 
        title: newStatus === 'active' ? `تم تفعيل ${branchName}` : `تم إيقاف ${branchName}` 
      });
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
        
        .branch-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .branch-card:hover { border-color: #fca5a5; transform: translateY(-3px); box-shadow: 0 8px 25px rgba(220, 38, 38, 0.08); }
        
        .emp-chip { background: #fef2f2; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: bold; color: #dc2626; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #fecaca; }
        
        .spinner { width: 40px; height: 40px; border: 4px solid #f8fafc; border-top: 4px solid #dc2626; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBuilding style={{ color: '#dc2626' }} /> إدارة الفروع (SaaS)
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>أضف فروعاً جديدة وتابع فريق العمل الخاص بكل فرع بمرونة تامة.</p>
        </div>
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' }}>
          إجمالي الفروع: {branches.length}
        </div>
      </div>

      <form onSubmit={handleAdd} className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>اسم الفرع</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-style" placeholder="مثال: فرع المنصور" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>رابط الفرع (Slug)</label>
          <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="input-style" placeholder="mansour" dir="ltr" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>نوع التعاقد</label>
          <select value={type} onChange={e => { setType(e.target.value); setOwnerPercentage(e.target.value === 'owned' ? '100' : '50'); }} className="input-style">
            <option value="owned">فرع مملوك لأمنية (100%)</option>
            <option value="contract">فرع متعاقد (نسبة مئوية)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>حصة المنصة (%)</label>
          <input type="number" required value={ownerPercentage} onChange={e => setOwnerPercentage(e.target.value)} className="input-style" disabled={type === 'owned'} />
        </div>
        <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#dc2626', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', height: '43px', transition: '0.3s' }}>
          {loading ? 'جاري الإضافة...' : <><FaPlus /> تسجيل الفرع</>}
        </button>
      </form>

      {dataLoading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '15px', color: '#dc2626', fontWeight: 'bold' }}>جاري تحميل بيانات الفروع والموظفين...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {branches.map(b => (
            <div key={b.id} className="branch-card" style={{ opacity: b.status === 'active' ? 1 : 0.7, filter: b.status === 'active' ? 'none' : 'grayscale(0.5)' }}>
              
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '18px' }}>{b.name}</h3>
                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {b.type === 'owned' ? <><FaStore style={{ color: '#0ea5e9' }} /> مملوك بالكامل لأمنية</> : <><FaHandshake style={{ color: '#f59e0b' }} /> متعاقد (حصة أمنية {b.owner_percentage}%)</>}
                    </div>
                  </div>
                  <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #e2e8f0', direction: 'ltr' }}>
                    /{b.slug}
                  </span>
                </div>
              </div>

              <div style={{ padding: '20px', background: '#fcfcfc', flexGrow: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>
                  فريق العمل ({b.employees?.length || 0}):
                </div>
                
                {b.employees && b.employees.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {b.employees.map((emp: any) => (
                      <span key={emp.id} className="emp-chip" style={{ opacity: emp.is_blocked ? 0.5 : 1 }}>
                        <FaUserTie style={{ color: '#dc2626' }} /> {emp.fullname || 'بدون اسم'} {emp.is_blocked && ' (محظور)'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>لا يوجد موظفين مرتبطين بهذا الفرع.</div>
                )}
              </div>

              <div style={{ padding: '15px 20px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  onClick={() => toggleStatus(b.id, b.status, b.name)} 
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', padding: '10px', borderRadius: '10px', border: 'none', 
                    background: b.status === 'active' ? '#fef2f2' : '#f0fdf4', 
                    color: b.status === 'active' ? '#dc2626' : '#16a34a', 
                    fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' 
                  }}
                >
                  {b.status === 'active' ? <><FaBan /> إيقاف عمل الفرع</> : <><FaCheckCircle /> إعادة تفعيل الفرع</>}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}