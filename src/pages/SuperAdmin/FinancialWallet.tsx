import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Swal from 'sweetalert2';
import { 
  FaBook, FaExclamationCircle, FaCheckCircle, 
  FaHandHoldingUsd, FaReceipt, FaPrint, 
  FaFileExcel, FaLink, FaClock, FaBuilding, 
  FaUserTie, FaMoneyBillWave 
} from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#fff',
  color: '#1e293b'
});

export default function FinancialWallet() {
  const [branchesData, setBranchesData] = useState<any[]>([]);
  
  const [totalUnclearedGross, setTotalUnclearedGross] = useState(0); 
  const [totalUnclearedPlatform, setTotalUnclearedPlatform] = useState(0); 
  
  const [timeFilter, setTimeFilter] = useState('all');
  const [finLogs, setFinLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. جلب الفروع
      const { data: pagesData, error: pagesError } = await supabase.from('pages')
        .select('id, name, type, owner_percentage')
        .eq('status', 'active');
        
      if (pagesError) throw pagesError;

      // 2. جلب الروابط
      const { data: linksData, error: linksError } = await supabase.from('gift_links')
        .select('id, price, owner_cut, is_cleared, created_at, expires_at, status, page_id, creator_id, created_by, theme_id');
        
      if (linksError) throw linksError;

      // 3. جلب الثيمات، الموظفين، وسجلات التصفية
      const { data: themesData } = await supabase.from('themes').select('id, name');
      const { data: profilesData } = await supabase.from('profiles').select('id, fullname, full_name');
      const { data: sysLogs } = await supabase.from('system_logs')
        .select('*')
        .eq('action_type', 'تصفية مالية')
        .order('created_at', { ascending: false });

      // حساب الوقت للفلترة
      const now = new Date();
      const filterDate = new Date();
      if (timeFilter === 'hour') filterDate.setHours(now.getHours() - 1);
      if (timeFilter === 'day') filterDate.setDate(now.getDate() - 1);
      if (timeFilter === 'week') filterDate.setDate(now.getDate() - 7);
      if (timeFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
      if (timeFilter === 'year') filterDate.setFullYear(now.getFullYear() - 1);

      let grandTotalGross = 0;
      let grandTotalPlatform = 0;
      let allFinancialEvents: any[] = [];

      if (pagesData) {
        const calculatedBranches = pagesData.map(branch => {
          const branchLinks = (linksData || []).filter(link => link.page_id === branch.id);

          const validLinks = branchLinks.filter((l: any) => {
            const linkDate = new Date(l.created_at);
            const isWithinTime = timeFilter === 'all' ? true : linkDate >= filterDate;
            
            const actualPrice = Number(l.price || 0);
            const platformCut = Number(l.owner_cut || 0);
            const themeName = themesData?.find(t => t.id === l.theme_id)?.name || 'ثيم غير محدد';
            
            const creator = profilesData?.find(p => p.id === l.creator_id || p.id === l.created_by);
            const empName = creator?.fullname || creator?.full_name || 'موظف غير معروف';

            if (isWithinTime) {
              const isExpired = l.expires_at ? new Date(l.expires_at) < new Date() : false;
              allFinancialEvents.push({
                id: l.id,
                type: 'sale',
                desc: `مبيعات (${themeName})`,
                branchName: branch.name,
                employeeName: empName,
                amount: actualPrice,
                platform_amount: platformCut,
                date: l.created_at,
                is_cleared: l.is_cleared,
                status: l.status,
                isExpired
              });
            }
            return l.is_cleared === false && isWithinTime;
          });

          const totalGross = validLinks.reduce((sum: number, l: any) => sum + Number(l.price || 0), 0); 
          const totalPlatformShare = validLinks.reduce((sum: number, l: any) => sum + Number(l.owner_cut || 0), 0); 
          
          const linkIdsToClear = validLinks.map((l: any) => l.id);

          grandTotalGross += totalGross;
          grandTotalPlatform += totalPlatformShare;
          
          return { ...branch, totalGross, totalPlatformShare, pendingLinksCount: validLinks.length, linkIdsToClear };
        });
        
        setBranchesData(calculatedBranches);
        setTotalUnclearedGross(grandTotalGross);
        setTotalUnclearedPlatform(grandTotalPlatform);
      }

      if (sysLogs) {
        sysLogs.forEach(log => {
          const logDate = new Date(log.created_at);
          if (timeFilter === 'all' || logDate >= filterDate) {
            allFinancialEvents.push({
              id: log.id,
              type: 'clearance',
              desc: log.details,
              branchName: log.pos_name || 'المنصة',
              employeeName: 'الإدارة العامة',
              amount: 0,
              date: log.created_at
            });
          }
        });
      }

      allFinancialEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFinLogs(allFinancialEvents);
      
    } catch (err: any) {
      console.error("General error in FinancialWallet:", err);
      Toast.fire({ icon: 'error', title: 'فشل جلب الحسابات: ' + err.message });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [timeFilter]);

  const handleClearance = async (branchId: string, branchName: string, totalPlatformShare: number, linkIds: string[]) => {
    if(linkIds.length === 0 || totalPlatformShare === 0) return Toast.fire({ icon: 'info', title: 'الحساب مصفر مسبقاً.' });
    
    const result = await Swal.fire({
      title: 'تصفية الحساب',
      text: `هل تؤكد استلام مبلغ (${totalPlatformShare.toLocaleString()} د.ع) من فرع "${branchName}"؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، تم الاستلام',
      cancelButtonText: 'إلغاء'
    });
    
    if (result.isConfirmed) {
      const { error } = await supabase.from('gift_links').update({ is_cleared: true }).in('id', linkIds);
      
      if (error) {
        Toast.fire({ icon: 'error', title: error.message });
        return;
      }
      
      await supabase.from('system_logs').insert([{ 
        admin_name: 'المدير العام', 
        pos_name: branchName, 
        action_type: 'تصفية مالية', 
        details: `تصفية مالية واستلام مبلغ ${totalPlatformShare.toLocaleString()} د.ع من فرع ${branchName}` 
      }]);
      
      Toast.fire({ icon: 'success', title: 'تم تصفير الحساب بنجاح!' });
      fetchData();
    }
  };

  const exportFinToExcel = () => {
    const headers = ["النوع", "التفاصيل", "الفرع", "الموظف", "مبلغ المبيعات الكلي", "حصة المنصة", "التاريخ"];
    const rows = finLogs.map(log => [
      log.type === 'sale' ? 'مبيعات' : 'تصفية',
      log.desc,
      log.branchName,
      log.employeeName,
      log.type === 'sale' ? log.amount : 0,
      log.type === 'sale' ? log.platform_amount : 0,
      new Date(log.date).toLocaleString('en-IQ')
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `سجل_أمنية_المالي_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  if (loading) return (
    <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #fecaca', borderTop: '4px solid #dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '15px' }}>جاري فتح الخزينة...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media print { .no-print { display: none !important; } }
        
        .filter-btn { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: bold; color: #64748b; transition: all 0.2s; white-space: nowrap; }
        .filter-btn:hover { background: #f1f5f9; }
        .filter-btn.active { background: #dc2626; color: #fff; border-color: #dc2626; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.2); }
        
        .branch-card { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: all 0.3s; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .branch-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.06); border-color: #fca5a5; }
        
        .clear-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: #10b981; color: #fff; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.2s; margin-top: auto; }
        .clear-btn:hover { background: #059669; }
        .clear-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
        
        .table-row { border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
        .table-row:hover { background: #f8fafc; }
        .td-cell { padding: 14px 12px; font-size: 13px; color: #1e293b; }

        .action-btn { padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: bold; transition: all 0.2s; border: none; display: flex; align-items: center; gap: 6px; }
        .action-btn.export { background: #10b981; color: #fff; }
        .action-btn.export:hover { background: #059669; }
        .action-btn.print { background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; }
      `}</style>

      {/* الهيدر والفلاتر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }} className="no-print">
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBook style={{ color: '#dc2626' }} /> الدفتر المالي وتصفية الديون
          </h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>إدارة الحسابات المعلقة واستلام حصة المنصة من الفروع.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
          {['all', 'year', 'month', 'week', 'day', 'hour'].map(tf => {
            const labels: any = { all: 'الكل', year: 'هذا العام', month: 'هذا الشهر', week: 'هذا الأسبوع', day: 'اليوم', hour: 'آخر ساعة' };
            return (
              <button key={tf} onClick={() => setTimeFilter(tf)} className={`filter-btn ${timeFilter === tf ? 'active' : ''}`}>
                {labels[tf]}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* صندوق الإجماليات */}
      <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)', padding: '30px', borderRadius: '20px', border: '1px solid #fecaca', textAlign: 'center', marginBottom: '25px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>إجمالي المبيعات الكلية بالسوق</div>
          <div style={{ fontSize: '28px', color: '#1e293b', fontWeight: '900' }}>{totalUnclearedGross.toLocaleString()} د.ع</div>
        </div>
        <div style={{ borderRight: '2px solid #fecaca', paddingRight: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', color: '#dc2626', fontWeight: 'bold' }}>
            حصة أمنية الصافية (المطلوب استلامه) <FaExclamationCircle />
          </div>
          <div style={{ fontSize: '38px', color: '#dc2626', fontWeight: '900' }}>{totalUnclearedPlatform.toLocaleString()} د.ع</div>
        </div>
      </div>

      {/* بطاقات الفروع */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }} className="no-print">
        {branchesData.map(branch => (
          <div key={branch.id} className="branch-card">
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: branch.type === 'owned' ? '#dcfce7' : '#fef3c7', color: branch.type === 'owned' ? '#16a34a' : '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
              {branch.type === 'owned' ? 'مملوك (100%)' : `تعاقد (${branch.owner_percentage}%)`}
            </div>
            
            <h4 style={{ margin: '15px 0 10px 0', fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>{branch.name}</h4>
            
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>إجمالي مبيعات الفرع:</span>
                <strong style={{ color: '#1e293b' }}>{branch.totalGross.toLocaleString()} د.ع</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#0f172a', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontWeight: 'bold' }}>
                <span>حصة المنصة المطلوبة:</span>
                <strong style={{ color: '#dc2626', fontSize: '16px' }}>{branch.totalPlatformShare.toLocaleString()} د.ع</strong>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
              عدد الروابط غير المصفاة: <span style={{ fontWeight: 'bold', color: branch.pendingLinksCount > 0 ? '#dc2626' : '#10b981' }}>{branch.pendingLinksCount}</span>
            </div>

            <button 
              onClick={() => handleClearance(branch.id, branch.name, branch.totalPlatformShare, branch.linkIdsToClear)} 
              className="clear-btn"
              disabled={branch.totalPlatformShare === 0}
            >
              {branch.totalPlatformShare === 0 ? <><FaCheckCircle /> الحساب مصفر</> : <><FaHandHoldingUsd /> استلام وتصفير الحساب</>}
            </button>
          </div>
        ))}
        {branchesData.length === 0 && <p style={{ color: '#94a3b8', fontSize: '14px', gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>لا توجد فروع مسجلة لتصفيتها.</p>}
      </div>

      {/* سجل الحركات المالي المفصل */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaReceipt style={{ color: '#94a3b8' }} /> سجل المعاملات الدقيق (مع تفاصيل الموظفين والفروع)
          </h4>
          <div style={{ display: 'flex', gap: '8px' }} className="no-print">
            <button onClick={() => window.print()} className="action-btn print"><FaPrint /> طباعة</button>
            <button onClick={exportFinToExcel} className="action-btn export"><FaFileExcel /> تحميل إكسل</button>
          </div>
        </div>
        
        <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>النوع</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>التفاصيل والثيم</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>الفرع والموظف</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>المبلغ / الحصة</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {finLogs.map((log, index) => (
                <tr key={index} className="table-row">
                  <td className="td-cell" style={{ width: '50px', textAlign: 'center', fontSize: '18px' }}>
                    {log.type === 'clearance' ? <FaHandHoldingUsd style={{ color: '#10b981' }} /> : <FaLink style={{ color: '#3b82f6' }} />}
                  </td>
                  <td className="td-cell">
                    <strong style={{ color: log.type === 'clearance' ? '#10b981' : '#1e293b' }}>{log.desc}</strong>
                    {log.type === 'sale' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: log.is_cleared ? '#10b981' : '#dc2626', fontWeight: 'bold' }}>
                          {log.is_cleared ? <><FaCheckCircle /> مُصفى ومستلم</> : <><FaClock /> دين قيد التحصيل</>}
                        </span>
                        <span style={{ fontSize: '11px', background: log.isExpired ? '#fef2f2' : '#f0fdf4', color: log.isExpired ? '#dc2626' : '#16a34a', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {log.isExpired ? 'منتهي الصلاحية' : 'نشط'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="td-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#334155' }}>
                      <FaBuilding style={{ color: '#94a3b8' }} /> {log.branchName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      <FaUserTie style={{ color: '#cbd5e1' }} /> {log.employeeName}
                    </div>
                  </td>
                  <td className="td-cell" style={{ fontWeight: 'bold', color: log.type === 'sale' ? '#dc2626' : '#10b981' }}>
                    {log.type === 'sale' ? `مبيعات: ${log.amount.toLocaleString()} | حصة: ${log.platform_amount.toLocaleString()}` : 'عملية تصفية واستلام'}
                  </td>
                  <td className="td-cell" style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'left' }} dir="ltr">
                    {new Date(log.date).toLocaleString('en-IQ')}
                  </td>
                </tr>
              ))}
              {finLogs.length === 0 && <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>لا توجد حركات مالية مسجلة في هذا النطاق.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}