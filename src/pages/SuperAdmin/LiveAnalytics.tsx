import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { 
  FaChartPie, FaBoxOpen, FaBuilding, FaUserTie, FaMoneyBillWave, 
  FaRocket, FaWallet, FaLink, FaPalette, FaSignOutAlt, FaPlus, 
  FaReceipt, FaUserCircle, FaPaintBrush 
} from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

export default function FinancialWallet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  
  const [stats, setStats] = useState({
    totalGrossRevenue: 0,
    totalPlatformProfits: 0,
    totalExpenses: 0,
    netProfit: 0,
    branchesCount: 0,
    employeesCount: 0,
    themesCount: 0,
    totalLinksSold: 0
  });

  const [branchProfits, setBranchProfits] = useState<any[]>([]);
  const [employeeProfits, setEmployeeProfits] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [packageStats, setPackageStats] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('overview'); 

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/secure-portal-access');

      const { data: profile } = await supabase.from('profiles').select('role, fullname').eq('id', session.user.id).single();
      if (!profile || profile.role !== 'super_admin') {
        alert('غير مصرح لك بالدخول لهذه الصفحة!');
        return navigate('/secure-portal-access');
      }
      setAdminName(profile.fullname || 'المدير العام');

      const { count: bCount } = await supabase.from('pages').select('id', { count: 'exact', head: true });
      const { count: eCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'super_admin');
      const { count: tCount } = await supabase.from('themes').select('id', { count: 'exact', head: true });

      const { data: linksData, error: linksError } = await supabase.from('gift_links').select('*');
      if (linksError) console.error("Error fetching links:", linksError);

      const { data: themesData } = await supabase.from('themes').select('id, name');
      const { data: pagesData } = await supabase.from('pages').select('id, name');
      
      const { data: profilesData } = await supabase.from('profiles').select('id, fullname');

      const { data: expensesData } = await supabase.from('system_expenses').select('*').order('created_at', { ascending: false });

      let myTotalProfits = 0; 
      let totalGrossRev = 0; 
      
      const bProfitsMap: Record<string, any> = {};
      const eProfitsMap: Record<string, any> = {};
      
      const packagesMap: Record<string, any> = {
        daily: { label: 'باقة يومية (24 ساعة)', count: 0, revenue: 0 },
        weekly: { label: 'باقة أسبوعية', count: 0, revenue: 0 },
        monthly: { label: 'باقة شهرية', count: 0, revenue: 0 },
        permanent: { label: 'باقة دائمية', count: 0, revenue: 0 }
      };

      if (linksData) {
        linksData.forEach((link: any) => {
          const linkPrice = Number(link.price) || 0;
          const platformCut = Number(link.owner_cut) || 0;
          
          const theme = themesData?.find(t => t.id === link.theme_id);
          const themeName = theme?.name || 'ثيم غير محدد أو محذوف';

          const page = pagesData?.find(p => p.id === link.page_id || p.id === link.pos_id);
          const pName = page?.name || 'فرع غير معروف أو محذوف';

          const creator = profilesData?.find(p => p.id === link.creator_id || p.id === link.created_by);
          
          const empName = creator?.fullname || 'موظف محذوف';

          totalGrossRev += linkPrice;
          myTotalProfits += platformCut;

          // تجميع أرباح الفروع
          const pId = link.page_id || link.pos_id || 'unknown';
          if (!bProfitsMap[pId]) bProfitsMap[pId] = { name: pName, totalSales: 0, branchShare: 0, platformShare: 0 };
          bProfitsMap[pId].totalSales += linkPrice;
          bProfitsMap[pId].branchShare += Number(link.page_cut) || 0;
          bProfitsMap[pId].platformShare += platformCut;

          // تجميع أرباح الموظفين وتفصيل الثيمات
          const empId = link.creator_id || link.created_by || 'deleted';
          if (!eProfitsMap[empId]) {
            eProfitsMap[empId] = { name: empName, totalSales: 0, profitsForPlatform: 0, themesSold: {} };
          }
          eProfitsMap[empId].totalSales += linkPrice;
          eProfitsMap[empId].profitsForPlatform += platformCut;

          if (!eProfitsMap[empId].themesSold[themeName]) {
            eProfitsMap[empId].themesSold[themeName] = { count: 0, revenue: 0 };
          }
          eProfitsMap[empId].themesSold[themeName].count += 1;
          eProfitsMap[empId].themesSold[themeName].revenue += linkPrice;

          // تحليل الباقات
          if (link.created_at && link.expires_at) {
            const diffTime = Math.abs(new Date(link.expires_at).getTime() - new Date(link.created_at).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 2) { packagesMap.daily.count++; packagesMap.daily.revenue += linkPrice; }
            else if (diffDays > 2 && diffDays <= 8) { packagesMap.weekly.count++; packagesMap.weekly.revenue += linkPrice; }
            else if (diffDays > 8 && diffDays <= 32) { packagesMap.monthly.count++; packagesMap.monthly.revenue += linkPrice; }
            else { packagesMap.permanent.count++; packagesMap.permanent.revenue += linkPrice; }
          }
        });
      }

      const totalExp = expensesData ? expensesData.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) : 0;

      setStats({
        totalGrossRevenue: totalGrossRev,
        totalPlatformProfits: myTotalProfits,
        totalExpenses: totalExp,
        netProfit: myTotalProfits - totalExp,
        branchesCount: bCount || 0,
        employeesCount: eCount || 0,
        themesCount: tCount || 0,
        totalLinksSold: linksData?.length || 0
      });

      setBranchProfits(Object.values(bProfitsMap).sort((a, b) => b.platformShare - a.platformShare));
      setEmployeeProfits(Object.values(eProfitsMap).sort((a, b) => b.totalSales - a.totalSales));
      setPackageStats(Object.values(packagesMap));
      if (expensesData) setExpenses(expensesData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    setAddingExpense(true);

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('system_expenses').insert([{
      title: expenseTitle, amount: Number(expenseAmount), created_by: session?.user.id
    }]);

    setAddingExpense(false);
    if (error) alert(`خطأ في إضافة المصروف: ${error.message}`);
    else { setExpenseTitle(''); setExpenseAmount(''); fetchDashboardData(); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/secure-portal-access');
  };

  if (loading) return <div style={centerScreen}><div className="spinner"></div></div>;

  return (
    <div style={dashboardContainer}>
      <style>{`
        body { background-color: #f8fafc; margin: 0; }
        .spinner { border: 4px solid rgba(220, 38, 38, 0.2); border-top: 4px solid #dc2626; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; font-weight: bold; border-radius: 12px; cursor: pointer; transition: all 0.2s; border: none; font-size: 14px; }
        .tab-btn.active { background: #dc2626; color: white; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
        .tab-btn.inactive { background: #fff; color: #64748b; border: 1px solid #e2e8f0; }
        .tab-btn.inactive:hover { background: #f1f5f9; color: #334155; }
        
        .stat-card { background: #fff; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0; flex: 1; min-width: 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 8px; }
        .small-card { min-width: 150px; padding: 20px; }
        
        .list-card { background: #fff; padding: 18px 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.01); }
        .theme-sub-card { background: #f8fafc; padding: 10px 15px; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
        
        .input-style { padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; transition: 0.3s; background: #f8fafc; }
        .input-style:focus { border-color: #dc2626; background: #fff; }

        .logout-btn:hover { background: #fca5a5 !important; color: #b91c1c !important; }
      `}</style>

      {/* الهيدر */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '45px', height: '45px' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <div>
            <h1 style={{ margin: 0, color: '#dc2626', fontSize: '24px', fontWeight: '900' }}>أمنية</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>الإحصائيات المالية | أهلاً {adminName}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={logoutBtn} className="logout-btn">
          <FaSignOutAlt style={{ fontSize: '14px' }} /> تسجيل خروج
        </button>
      </div>

      {/* أزرار التنقل */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('overview')}>
          <FaChartPie /> المالية العامة
        </button>
        <button className={`tab-btn ${activeTab === 'packages' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('packages')}>
          <FaBoxOpen /> الباقات والثيمات
        </button>
        <button className={`tab-btn ${activeTab === 'branches' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('branches')}>
          <FaBuilding /> أرباح الفروع
        </button>
        <button className={`tab-btn ${activeTab === 'employees' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('employees')}>
          <FaUserTie /> أداء الموظفين
        </button>
        <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('expenses')}>
          <FaMoneyBillWave /> المصاريف
        </button>
      </div>

      {/* 1. المالية العامة */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ borderBottom: '4px solid #8b5cf6', background: '#f5f3ff', borderColor: '#ddd6fe' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9', fontSize: '14px', fontWeight: 'bold' }}>
                <FaRocket style={{ fontSize: '16px' }} /> إجمالي الإيرادات الكلية للمنصة
              </span>
              <span style={{ color: '#7c3aed', fontSize: '32px', fontWeight: '900' }}>{stats.totalGrossRevenue.toLocaleString()} د.ع</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ borderBottom: '4px solid #10b981' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>
                <FaWallet style={{ color: '#10b981' }} /> إيرادات النظام (حصة أمنية فقط)
              </span>
              <span style={{ color: '#10b981', fontSize: '26px', fontWeight: '900' }}>{stats.totalPlatformProfits.toLocaleString()} د.ع</span>
            </div>
            <div className="stat-card" style={{ borderBottom: '4px solid #3b82f6', background: '#f0f9ff', borderColor: '#bae6fd' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontSize: '14px', fontWeight: 'bold' }}>
                <FaMoneyBillWave style={{ color: '#0284c7' }} /> صافي الربح الفعلي بعد المصاريف
              </span>
              <span style={{ color: '#0284c7', fontSize: '26px', fontWeight: '900' }}>{stats.netProfit.toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. الباقات والثيمات */}
      {activeTab === 'packages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="stat-card small-card" style={{ borderBottom: '4px solid #f43f5e' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>
                <FaLink style={{ color: '#f43f5e' }} /> إجمالي الروابط المباعة
              </span>
              <span style={{ color: '#f43f5e', fontSize: '28px', fontWeight: '900' }}>{stats.totalLinksSold}</span>
            </div>
            <div className="stat-card small-card" style={{ borderBottom: '4px solid #8b5cf6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>
                <FaPalette style={{ color: '#8b5cf6' }} /> الثيمات المتاحة بالنظام
              </span>
              <span style={{ color: '#8b5cf6', fontSize: '28px', fontWeight: '900' }}>{stats.themesCount}</span>
            </div>
          </div>

          <h3 style={{ margin: '10px 0', color: '#1e293b' }}>مبيعات الباقات الزمنية:</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {packageStats.map((pkg, i) => (
              <div key={i} className="stat-card" style={{ minWidth: '200px' }}>
                <span style={{ color: '#475569', fontSize: '15px', fontWeight: 'bold' }}>{pkg.label}</span>
                <span style={{ color: '#dc2626', fontSize: '22px', fontWeight: '900' }}>{pkg.count} <span style={{fontSize:'14px', color:'#94a3b8'}}>رابط</span></span>
                <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', marginTop:'5px' }}>أرباح: {pkg.revenue.toLocaleString()} د.ع</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. أرباح الفروع */}
      {activeTab === 'branches' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {branchProfits.map((branch, i) => (
            <div key={i} className="list-card" style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaBuilding style={{ color: '#94a3b8', fontSize: '16px' }} /> {branch.name}
                </h3>
                <span style={{ color: '#64748b', fontSize: '13px' }}>إجمالي مبيعات الفرع: <strong>{branch.totalSales.toLocaleString()} د.ع</strong></span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>أرباح المنصة: {branch.platformShare.toLocaleString()} د.ع</div>
                <div style={{ color: '#f59e0b', fontSize: '13px' }}>حصة الفرع: {branch.branchShare.toLocaleString()} د.ع</div>
              </div>
            </div>
          ))}
          {branchProfits.length === 0 && <p style={{ color: '#64748b' }}>لا توجد أرباح فروع حتى الآن.</p>}
        </div>
      )}

      {/* 4. أداء الموظفين */}
      {activeTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {employeeProfits.map((emp, i) => (
            <div key={i} className="list-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', width: '100%' }}>
                <div style={{ width: '45px', height: '45px', background: '#fee2e2', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FaUserCircle style={{ fontSize: '24px', color: '#f87171' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '18px' }}>
                    {emp.name} {emp.name === adminName && <span style={{ color: '#0ea5e9', fontSize: '14px' }}>(أنت)</span>}
                    {emp.name === 'موظف محذوف' && <span style={{fontSize:'11px', background:'#fee2e2', color:'#dc2626', padding:'2px 6px', borderRadius:'5px', marginRight:'5px'}}>محذوف</span>}
                  </h3>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>المبيعات الإجمالية: <strong style={{color:'#dc2626'}}>{emp.totalSales.toLocaleString()} د.ع</strong></span>
                </div>
              </div>
              
              <div style={{ width: '100%', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '14px' }}>تفاصيل مبيعات الثيمات:</h4>
                {Object.keys(emp.themesSold).map((themeName, idx) => (
                  <div key={idx} className="theme-sub-card">
                    <span style={{fontWeight:'bold', color:'#334155', fontSize:'14px', display:'flex', alignItems:'center', gap:'8px'}}>
                      <FaPaintBrush style={{ color: '#64748b' }} /> {themeName}
                    </span>
                    <div style={{display:'flex', gap:'20px'}}>
                      <span style={{color:'#64748b', fontSize:'13px'}}>العدد: <strong>{emp.themesSold[themeName].count}</strong></span>
                      <span style={{color:'#10b981', fontSize:'13px'}}>أرباح: <strong>{emp.themesSold[themeName].revenue.toLocaleString()} د.ع</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {employeeProfits.length === 0 && <p style={{ color: '#64748b' }}>لم يقم أي موظف بتوليد روابط حتى الآن.</p>}
        </div>
      )}

      {/* 5. المصاريف */}
      {activeTab === 'expenses' && (
        <div>
          <form onSubmit={handleAddExpense} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '25px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>عنوان المصروف</label>
              <input type="text" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} className="input-style" required />
            </div>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>المبلغ (بالدينار)</label>
              <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="input-style" required />
            </div>
            <button type="submit" disabled={addingExpense} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#dc2626', color: '#fff', padding: '12px 24px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', height: '43px' }}>
              {addingExpense ? 'جاري الإضافة...' : <><FaPlus /> تسجيل المصروف</>}
            </button>
          </form>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {expenses.map(exp => (
              <div key={exp.id} style={{ background: '#fff', padding: '15px 20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FaReceipt style={{ fontSize: '22px', color: '#ef4444' }} />
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', color: '#334155', fontSize: '15px' }}>{exp.title}</h4>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(exp.created_at).toLocaleDateString('ar-IQ')}</span>
                  </div>
                </div>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>- {exp.amount.toLocaleString()} د.ع</span>
              </div>
            ))}
            {expenses.length === 0 && <p style={{ color: '#64748b' }}>لا توجد مصاريف مسجلة حتى الآن.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const centerScreen: React.CSSProperties = { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' };
const dashboardContainer: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', direction: 'rtl', fontFamily: 'Tajawal, system-ui, -apple-system, sans-serif' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' };
const logoutBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' };