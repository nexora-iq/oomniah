import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { 
  FaShieldAlt, FaSearch, FaSyncAlt, FaSignInAlt, 
  FaSignOutAlt, FaTrashAlt, FaEdit, FaPlusCircle, 
  FaClipboardList, FaUserTie, FaBuilding, FaSpinner, 
  FaExclamationCircle 
} from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

export default function SystemLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  
  // حالات الفلترة والبحث
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      if (data) setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ فلترة آمنة وذكية
  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      ((log.admin_name || '').toLowerCase().includes(searchLower)) ||
      ((log.details || '').toLowerCase().includes(searchLower)) ||
      ((log.pos_name || '').toLowerCase().includes(searchLower));
      
    const matchesFilter = filterType === 'all' || (log.action_type || '').includes(filterType);
    
    return matchesSearch && matchesFilter;
  });

  // 🛡️ ألوان وأيقونات الحركات (تم استبدال الإيموجيز بأيقونات FontAwesome)
  const getActionStyle = (type?: string | null) => {
    if (!type) return { bg: '#f3f4f6', color: '#4b5563', icon: <FaClipboardList />, border: '#e2e8f0' };
    
    if (type.includes('دخول')) return { bg: '#dcfce7', color: '#16a34a', icon: <FaSignInAlt />, border: '#bbf7d0' };
    if (type.includes('خروج')) return { bg: '#f1f5f9', color: '#64748b', icon: <FaSignOutAlt />, border: '#e2e8f0' };
    if (type.includes('حذف') || type.includes('خطأ')) return { bg: '#fee2e2', color: '#dc2626', icon: <FaTrashAlt />, border: '#fecaca' };
    if (type.includes('تعديل') || type.includes('تحديث') || type.includes('تصفية')) return { bg: '#fef3c7', color: '#d97706', icon: <FaEdit />, border: '#fde68a' };
    if (type.includes('إنشاء') || type.includes('توليد') || type.includes('إضافة') || type.includes('مبيعات')) return { bg: '#dbeafe', color: '#2563eb', icon: <FaPlusCircle />, border: '#bfdbfe' };
    
    return { bg: '#f3f4f6', color: '#4b5563', icon: <FaClipboardList />, border: '#e2e8f0' };
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'تاريخ غير متوفر';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('ar-IQ', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }).format(date);
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  return (
    <div className="fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .search-wrapper { flex: 1; display: flex; align-items: center; gap: 10px; background: #fff; padding: 0 15px; border-radius: 12px; border: 1px solid #cbd5e1; transition: 0.3s; }
        .search-wrapper:focus-within { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .search-input { flex: 1; padding: 14px 0; border: none; font-size: 15px; outline: none; background: transparent; }
        
        .filter-select { padding: 14px; border-radius: 12px; border: 1px solid #cbd5e1; outline: none; font-weight: bold; color: #475569; background: #fff; cursor: pointer; min-width: 180px; }
        
        .log-card { background: #fff; padding: 18px 20px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: flex-start; gap: 15px; margin-bottom: 12px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .log-card:hover { border-color: #cbd5e1; box-shadow: 0 6px 15px rgba(0,0,0,0.05); transform: translateY(-2px); }
        
        .spin-icon { animation: spin 1s linear infinite; font-size: 24px; color: #dc2626; margin-bottom: 10px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .controls-container { flex-direction: column; }
          .log-card { flex-direction: column; gap: 12px; }
          .log-time { align-self: flex-start !important; }
        }
      `}</style>

      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ color: '#1e293b', margin: '0 0 5px 0', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaShieldAlt style={{ color: '#dc2626' }} /> سجل الرقابة الأمني
        </h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>مراقبة حية لجميع تحركات الموظفين والعمليات داخل منصة أمنية بدقة عالية.</p>
      </div>

      <div className="controls-container" style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <div className="search-wrapper">
          <FaSearch style={{ color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="ابحث عن اسم الموظف، الفرع، أو تفاصيل الحركة..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input"
          />
        </div>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)} 
          className="filter-select"
        >
          <option value="all">جميع الحركات</option>
          <option value="دخول">تسجيل الدخول</option>
          <option value="خروج">تسجيل الخروج</option>
          <option value="توليد">توليد الروابط</option>
          <option value="تصفية">تصفية مالية</option>
          <option value="إضافة">إضافة بيانات</option>
        </select>
        <button 
          onClick={fetchLogs} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#1e293b', border: 'none', padding: '0 25px', minHeight: '50px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#fff', transition: '0.2s' }}
          title="تحديث السجل"
        >
          <FaSyncAlt /> تحديث
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 'bold', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FaSpinner className="spin-icon" />
          جاري سحب السجلات الأمنية...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <FaExclamationCircle style={{ fontSize: '24px', color: '#cbd5e1' }} />
          لا توجد حركات تطابق عملية البحث
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredLogs.map((log) => {
            const style = getActionStyle(log.action_type);
            return (
              <div key={log.id || Math.random()} className="log-card">
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: style.bg, border: `1px solid ${style.border}`, color: style.color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {style.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '17px', color: '#1e293b', fontWeight: '800' }}>
                      <FaUserTie style={{ color: '#94a3b8', fontSize: '14px' }} /> 
                      {log.admin_name && log.admin_name !== 'موظف' ? log.admin_name : 'مستخدم غير معروف'}
                    </h3>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', color: '#475569', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>
                      <FaBuilding style={{ color: '#cbd5e1' }} /> {log.pos_name || 'النظام المركزي'}
                    </span>
                    <span style={{ fontSize: '12px', color: style.color, fontWeight: 'bold', background: style.bg, padding: '4px 10px', borderRadius: '8px' }}>
                      {log.action_type || 'نشاط عام'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', lineHeight: '1.6', fontWeight: '500' }}>
                    {log.details || 'لا توجد تفاصيل إضافية'}
                  </p>
                </div>
                
                <div className="log-time" style={{ alignSelf: 'center', textAlign: 'left', minWidth: '130px' }}>
                  <div style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 'bold', direction: 'ltr', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    {formatDateTime(log.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}