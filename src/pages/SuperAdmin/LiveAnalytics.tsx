import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import Swal from 'sweetalert2';
import { 
  FaChartPie, FaBoxOpen, FaBuilding, FaUserTie, FaMoneyBillWave, 
  FaRocket, FaWallet, FaLink, FaPalette, FaSignOutAlt, FaPlus, 
  FaReceipt, FaUserCircle, FaPaintBrush, FaSpinner, FaQrcode,
  FaTicketAlt, FaChartArea, FaTrashAlt, FaBan, FaCheckCircle
} from 'react-icons/fa';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const Toast = Swal.mixin({
  toast: true, position: 'top-end', showConfirmButton: false,
  timer: 3000, timerProgressBar: true, background: '#fff', color: '#1e293b'
});

export default function FinancialWallet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  
  const [stats, setStats] = useState({
    totalGrossRevenue: 0, totalPlatformProfits: 0, totalExpenses: 0,
    netProfit: 0, branchesCount: 0, employeesCount: 0, themesCount: 0, 
    totalLinksSold: 0, totalDiscountsGiven: 0
  });

  const [branchProfits, setBranchProfits] = useState<any[]>([]);
  const [employeeProfits, setEmployeeProfits] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [packageStats, setPackageStats] = useState<any[]>([]);
  const [barcodeStats, setBarcodeStats] = useState({ totalCount: 0, totalRevenue: 0, byBranch: [] as any[], byTheme: [] as any[] });
  
  // 🌟 حالات الكوبونات والرسوم البيانية
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState('month'); // hour, day, week, month, year
  
  const [activeTab, setActiveTab] = useState('charts'); 

  // حالات إضافة مصروف
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  // حالات إضافة كوبون
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [addingCoupon, setAddingCoupon] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => { fetchDashboardData(); }, [timeFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/secure-portal-access');

      const { data: profile } = await supabase.from('profiles').select('role, fullname').eq('id', session.user.id).single();
      if (!profile || profile.role !== 'super_admin') {
        Toast.fire({ icon: 'error', title: 'غير مصرح لك بالدخول لهذه الصفحة!' });
        return navigate('/secure-portal-access');
      }
      setAdminName(profile.fullname || 'المدير العام');

      const { count: bCount } = await supabase.from('pages').select('id', { count: 'exact', head: true });
      const { count: eCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'super_admin');
      const { count: tCount } = await supabase.from('themes').select('id', { count: 'exact', head: true });

      const { data: linksData } = await supabase.from('gift_links').select('*').order('created_at', { ascending: true });
      const { data: themesData } = await supabase.from('themes').select('id, name');
      const { data: pagesData } = await supabase.from('pages').select('id, name');
      const { data: profilesData } = await supabase.from('profiles').select('id, fullname');
      const { data: expensesData } = await supabase.from('system_expenses').select('*').order('created_at', { ascending: false });
      const { data: couponsData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

      if (couponsData) setCouponsList(couponsData);

      let myTotalProfits = 0; let totalGrossRev = 0; let totalDiscounts = 0;
      
      const bProfitsMap: Record<string, any> = {};
      const eProfitsMap: Record<string, any> = {};
      let totalBarcodeCount = 0;
      const bBarcodeMap: Record<string, any> = {};
      const tBarcodeMap: Record<string, any> = {};
      const chartMap: Record<string, any> = {};

      // إعداد نطاق التصفية للرسوم البيانية
      const now = new Date();
      const filterDate = new Date();
      if (timeFilter === 'hour') filterDate.setHours(now.getHours() - 1);
      if (timeFilter === 'day') filterDate.setDate(now.getDate() - 1);
      if (timeFilter === 'week') filterDate.setDate(now.getDate() - 7);
      if (timeFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
      if (timeFilter === 'year') filterDate.setFullYear(now.getFullYear() - 1);

      if (linksData) {
        linksData.forEach((link: any) => {
          const linkPrice = Number(link.price) || 0; // هذا السعر النهائي بعد الخصم
          const originalPrice = Number(link.price_at_sale) || linkPrice; // السعر قبل الخصم
          const platformCut = Number(link.owner_cut) || 0;
          const discountAmt = Number(link.discount_amount) || 0;
          
          const themeName = themesData?.find(t => t.id === link.theme_id)?.name || 'ثيم محذوف';
          const pName = pagesData?.find(p => p.id === link.page_id || p.id === link.pos_id)?.name || 'فرع محذوف';
          const empName = profilesData?.find(p => p.id === link.creator_id || p.id === link.created_by)?.fullname || 'موظف محذوف';

          totalGrossRev += originalPrice; 
          myTotalProfits += platformCut;
          totalDiscounts += discountAmt;

          // 🌟 حسابات الرسوم البيانية (مبيعات عبر الزمن)
          const linkDate = new Date(link.created_at);
          if (linkDate >= filterDate) {
            let dateKey = '';
            if (timeFilter === 'hour' || timeFilter === 'day') {
              dateKey = linkDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
            } else if (timeFilter === 'year') {
              dateKey = linkDate.toLocaleDateString('ar-IQ', { month: 'short', year: 'numeric' });
            } else {
              dateKey = linkDate.toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' });
            }

            if (!chartMap[dateKey]) chartMap[dateKey] = { name: dateKey, revenue: 0, barcode: 0 };
            chartMap[dateKey].revenue += linkPrice;
            if (link.is_barcode) chartMap[dateKey].barcode += 3000;
          }

          // حسابات الفروع والموظفين
          const pId = link.page_id || link.pos_id || 'unknown';
          if (!bProfitsMap[pId]) bProfitsMap[pId] = { name: pName, totalSales: 0, branchShare: 0, platformShare: 0, discountUsed: 0 };
          bProfitsMap[pId].totalSales += linkPrice;
          bProfitsMap[pId].branchShare += Number(link.page_cut) || 0;
          bProfitsMap[pId].platformShare += platformCut;
          bProfitsMap[pId].discountUsed += discountAmt;

          const empId = link.creator_id || link.created_by || 'deleted';
          if (!eProfitsMap[empId]) eProfitsMap[empId] = { name: empName, totalSales: 0, profitsForPlatform: 0, themesSold: {} };
          eProfitsMap[empId].totalSales += linkPrice;
          eProfitsMap[empId].profitsForPlatform += platformCut;
          if (!eProfitsMap[empId].themesSold[themeName]) eProfitsMap[empId].themesSold[themeName] = { count: 0, revenue: 0 };
          eProfitsMap[empId].themesSold[themeName].count += 1;
          eProfitsMap[empId].themesSold[themeName].revenue += linkPrice;

          // حسابات الباركود
          if (link.is_barcode) {
            totalBarcodeCount++;
            if (!bBarcodeMap[pId]) bBarcodeMap[pId] = { name: pName, count: 0, revenue: 0, themes: {} };
            bBarcodeMap[pId].count++; bBarcodeMap[pId].revenue += 3000;
            if (!bBarcodeMap[pId].themes[themeName]) bBarcodeMap[pId].themes[themeName] = 0;
            bBarcodeMap[pId].themes[themeName]++;

            if (!tBarcodeMap[themeName]) tBarcodeMap[themeName] = { name: themeName, count: 0, revenue: 0 };
            tBarcodeMap[themeName].count++; tBarcodeMap[themeName].revenue += 3000;
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
        totalLinksSold: linksData?.length || 0,
        totalDiscountsGiven: totalDiscounts
      });

      setBranchProfits(Object.values(bProfitsMap).sort((a, b) => b.platformShare - a.platformShare));
      setEmployeeProfits(Object.values(eProfitsMap).sort((a, b) => b.totalSales - a.totalSales));
      setBarcodeStats({
        totalCount: totalBarcodeCount, totalRevenue: totalBarcodeCount * 3000,
        byBranch: Object.values(bBarcodeMap).sort((a: any, b: any) => b.revenue - a.revenue),
        byTheme: Object.values(tBarcodeMap).sort((a: any, b: any) => b.revenue - a.revenue)
      });
      if (expensesData) setExpenses(expensesData);

      // تجهيز بيانات الرسم البياني
      const finalChartData = Object.values(chartMap);
      setChartData(finalChartData);

    } catch (error) {
      Toast.fire({ icon: 'error', title: 'حدث خطأ في جلب البيانات' });
    } finally {
      setLoading(false);
    }
  };

  // 🌟 إدارة الكوبونات
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !discountValue) return;
    setAddingCoupon(true);

    const { error } = await supabase.from('coupons').insert([{
      code: couponCode.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_uses: maxUses ? Number(maxUses) : null,
      status: 'active'
    }]);

    setAddingCoupon(false);
    if (error) {
        Toast.fire({ icon: 'error', title: error.code === '23505' ? 'هذا الكود مستخدم مسبقاً!' : `خطأ: ${error.message}` });
    } else { 
        Toast.fire({ icon: 'success', title: 'تم إنشاء الكوبون بنجاح 🎉' });
        setCouponCode(''); setDiscountValue(''); setMaxUses(''); 
        fetchDashboardData(); 
    }
  };

  const toggleCouponStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await supabase.from('coupons').update({ status: newStatus }).eq('id', id);
    fetchDashboardData();
  };

  const deleteCoupon = async (id: string) => {
    const res = await Swal.fire({ title: 'تأكيد الحذف؟', text: "سيتم حذف الكوبون نهائياً!", icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء', confirmButtonColor: '#dc2626' });
    if (res.isConfirmed) {
      await supabase.from('coupons').delete().eq('id', id);
      Toast.fire({ icon: 'success', title: 'تم الحذف!' });
      fetchDashboardData();
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    setAddingExpense(true);
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('system_expenses').insert([{ title: expenseTitle, amount: Number(expenseAmount), created_by: session?.user.id }]);
    setAddingExpense(false);
    Toast.fire({ icon: 'success', title: 'تم تسجيل المصروف' });
    setExpenseTitle(''); setExpenseAmount(''); fetchDashboardData(); 
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/secure-portal-access');
  };

  if (loading) return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
          <FaSpinner className="spinner" style={{ fontSize: '40px', color: '#dc2626' }} />
          <style>{`.spinner { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      <style>{`
        body { background-color: #f8fafc; margin: 0; }
        button, a, input, select { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; font-weight: bold; border-radius: 12px; cursor: pointer; transition: all 0.2s; border: none; font-size: 14px; }
        .tab-btn.active { background: #dc2626; color: white; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
        .tab-btn.inactive { background: #fff; color: #64748b; border: 1px solid #e2e8f0; }
        .tab-btn.inactive:hover { background: #f1f5f9; color: #334155; }
        
        .stat-card { background: #fff; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0; flex: 1; min-width: 200px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 8px; position: relative; overflow: hidden; }
        .stat-card::after { content: ''; position: absolute; top: 0; right: 0; width: 4px; height: 100%; }
        
        .list-card { background: #fff; padding: 18px 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.01); }
        .input-style { padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; transition: 0.3s; background: #f8fafc; width: 100%; box-sizing: border-box; }
        .input-style:focus { border-color: #dc2626; background: #fff; }
        
        .recharts-wrapper { direction: ltr !important; }
        .recharts-tooltip-wrapper { direction: rtl !important; }
      `}</style>

      {/* الهيدر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '45px', height: '45px' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <div>
            <h1 style={{ margin: 0, color: '#dc2626', fontSize: '24px', fontWeight: '900' }}>أمنية</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>لوحة التحكم والمالية | أهلاً {adminName}</p>
          </div>
        </div>
        <button onClick={handleLogout} disabled={isLoggingOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          {isLoggingOut ? <FaSpinner className="spinner" /> : <FaSignOutAlt />} خروج
        </button>
      </div>

      {/* أزرار التنقل الرئيسية */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button className={`tab-btn ${activeTab === 'charts' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('charts')}><FaChartArea /> الرسوم البيانية</button>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('overview')}><FaChartPie /> المالية العامة</button>
        <button className={`tab-btn ${activeTab === 'coupons' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('coupons')}><FaTicketAlt /> الكوبونات</button>
        <button className={`tab-btn ${activeTab === 'barcode' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('barcode')}><FaQrcode /> الباركود</button>
        <button className={`tab-btn ${activeTab === 'branches' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('branches')}><FaBuilding /> الفروع</button>
        <button className={`tab-btn ${activeTab === 'employees' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('employees')}><FaUserTie /> الموظفين</button>
      </div>

      {/* 🌟 1. الرسوم البيانية (Charts) */}
      {activeTab === 'charts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaChartArea style={{ color: '#0ea5e9' }}/> تحليل المبيعات والنشاط</h3>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold', color: '#475569' }}>
              <option value="hour">آخر ساعة</option>
              <option value="day">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذه السنة</option>
            </select>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '15px' }}>📈 إيرادات المبيعات والباركود عبر الزمن</h4>
            <div style={{ width: '100%', height: '350px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBarcode" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: 'Tajawal' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                    <Area type="monotone" name="الإيرادات الكلية" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" name="أرباح الباركود" dataKey="barcode" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBarcode)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>لا توجد مبيعات في هذه الفترة.</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '15px' }}>📊 مبيعات الثيمات (أكثر طلب)</h4>
              <div style={{ width: '100%', height: '250px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barcodeStats.byTheme.slice(0, 5)} layout="vertical" margin={{ left: -20, right: 10 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={100} />
                     <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', fontFamily: 'Tajawal' }} />
                     <Bar dataKey="revenue" name="الأرباح" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '15px' }}>🛍️ الباركود ضد المبيعات العادية</h4>
              <div style={{ width: '100%', height: '250px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={[
                       { name: 'مبيعات باركود', value: barcodeStats.totalCount },
                       { name: 'بدون باركود', value: stats.totalLinksSold - barcodeStats.totalCount }
                     ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       <Cell fill="#8b5cf6" />
                       <Cell fill="#cbd5e1" />
                     </Pie>
                     <RechartsTooltip contentStyle={{ borderRadius: '12px', fontFamily: 'Tajawal' }} />
                     <Legend iconType="circle" />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 2. الكوبونات (Coupons) */}
      {activeTab === 'coupons' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div className="stat-card" style={{ background: '#fef2f2' }}><style>{`.stat-card:nth-child(1)::after { background: #ef4444; }`}</style>
              <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>إجمالي الخصومات الممنوحة للزبائن</span>
              <span style={{ color: '#dc2626', fontSize: '28px', fontWeight: '900' }}>{stats.totalDiscountsGiven.toLocaleString()} د.ع</span>
            </div>
            <div className="stat-card" style={{ background: '#f0f9ff' }}><style>{`.stat-card:nth-child(2)::after { background: #0ea5e9; }`}</style>
              <span style={{ color: '#0ea5e9', fontSize: '14px', fontWeight: 'bold' }}>عدد الكوبونات الفعالة</span>
              <span style={{ color: '#0284c7', fontSize: '28px', fontWeight: '900' }}>{couponsList.filter(c => c.status === 'active').length} كوبون</span>
            </div>
          </div>

          <form onSubmit={handleAddCoupon} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '25px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom:'8px' }}>كود الخصم (انجليزي)</label>
              <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))} className="input-style" placeholder="مثال: SALE50" required />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom:'8px' }}>نوع الخصم</label>
              <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="input-style">
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (د.ع)</option>
              </select>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom:'8px' }}>قيمة الخصم</label>
              <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="input-style" placeholder={discountType === 'percentage' ? 'مثال: 20' : 'مثال: 5000'} required />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom:'8px' }}>عدد الاستخدامات (اختياري)</label>
              <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="input-style" placeholder="غير محدود" />
            </div>
            <button type="submit" disabled={addingCoupon} style={{ background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', height: '43px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {addingCoupon ? <FaSpinner className="spinner" /> : <FaPlus />} توليد الكوبون
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {couponsList.map(coupon => (
              <div key={coupon.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', position: 'relative', opacity: coupon.status === 'active' ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', letterSpacing: '2px' }}>{coupon.code}</span>
                  <span style={{ background: coupon.status === 'active' ? '#dcfce7' : '#f1f5f9', color: coupon.status === 'active' ? '#16a34a' : '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                    {coupon.status === 'active' ? 'فعال' : 'معطل'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                  <span>قيمة الخصم:</span>
                  <strong style={{ color: '#ef4444' }}>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString()} د.ع`}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '15px' }}>
                  <span>الاستخدام:</span>
                  <strong>{coupon.used_count} / {coupon.max_uses ? coupon.max_uses : '∞'}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => toggleCouponStatus(coupon.id, coupon.status)} style={{ flex: 1, background: coupon.status === 'active' ? '#fffbeb' : '#f0fdf4', color: coupon.status === 'active' ? '#d97706' : '#16a34a', border: `1px solid ${coupon.status === 'active' ? '#fde68a' : '#bbf7d0'}`, padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                    {coupon.status === 'active' ? <><FaBan/> إيقاف</> : <><FaCheckCircle/> تفعيل</>}
                  </button>
                  <button onClick={() => deleteCoupon(coupon.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
            {couponsList.length === 0 && <p style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center' }}>لا توجد كوبونات.</p>}
          </div>
        </div>
      )}

      {/* 3. المالية العامة (Overview) */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ background: '#f5f3ff' }}><style>{`.stat-card:nth-child(1)::after { background: #8b5cf6; }`}</style>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9', fontSize: '14px', fontWeight: 'bold' }}><FaRocket /> إجمالي الإيرادات الكلية للمنصة (قبل الخصم)</span>
              <span style={{ color: '#7c3aed', fontSize: '32px', fontWeight: '900' }}>{stats.totalGrossRevenue.toLocaleString()} د.ع</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="stat-card"><style>{`.stat-card:nth-child(1)::after { background: #10b981; }`}</style>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}><FaWallet style={{ color: '#10b981' }} /> إيرادات النظام (حصة أمنية الصافية)</span>
              <span style={{ color: '#10b981', fontSize: '26px', fontWeight: '900' }}>{stats.totalPlatformProfits.toLocaleString()} د.ع</span>
            </div>
            <div className="stat-card" style={{ background: '#f0f9ff' }}><style>{`.stat-card:nth-child(2)::after { background: #3b82f6; }`}</style>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontSize: '14px', fontWeight: 'bold' }}><FaMoneyBillWave style={{ color: '#0284c7' }} /> صافي الربح الفعلي بعد المصاريف</span>
              <span style={{ color: '#0284c7', fontSize: '26px', fontWeight: '900' }}>{stats.netProfit.toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. الباركود والفروع والموظفين (نفس الكود السابق مع تحديثات الخصم) */}
      {activeTab === 'barcode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ background: '#f0f9ff' }}><style>{`.stat-card:nth-child(1)::after { background: #0ea5e9; }`}</style>
              <span style={{ color: '#0369a1', fontSize: '14px', fontWeight: 'bold' }}><FaQrcode /> مواقع الباركود المباعة</span>
              <span style={{ color: '#0ea5e9', fontSize: '32px', fontWeight: '900' }}>{barcodeStats.totalCount} موقع</span>
            </div>
            <div className="stat-card" style={{ background: '#f0fdf4' }}><style>{`.stat-card:nth-child(2)::after { background: #10b981; }`}</style>
              <span style={{ color: '#166534', fontSize: '14px', fontWeight: 'bold' }}><FaMoneyBillWave /> أرباح الباركود فقط</span>
              <span style={{ color: '#10b981', fontSize: '32px', fontWeight: '900' }}>{barcodeStats.totalRevenue.toLocaleString()} د.ع</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>مبيعات الفروع للباركود</h3>
              {barcodeStats.byBranch.map((branch, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ color: '#334155' }}>{branch.name}</strong>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{branch.revenue.toLocaleString()} د.ع</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>العدد: {branch.count} باركود</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>الثيمات الأعلى طلباً للباركود</h3>
              {barcodeStats.byTheme.map((theme, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px' }}>
                  <strong style={{ color: '#334155' }}>{theme.name}</strong>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#dc2626', fontWeight: 'bold' }}>{theme.count} طلب</div>
                    <div style={{ color: '#10b981', fontSize: '12px' }}>{theme.revenue.toLocaleString()} د.ع</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branches' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {branchProfits.map((branch, i) => (
            <div key={i} className="list-card" style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '18px' }}><FaBuilding style={{ color: '#94a3b8' }} /> {branch.name}</h3>
                <span style={{ color: '#64748b', fontSize: '13px' }}>المبيعات (بعد الخصم): <strong>{branch.totalSales.toLocaleString()} د.ع</strong></span>
                {branch.discountUsed > 0 && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>استنزف خصومات: {branch.discountUsed.toLocaleString()} د.ع</div>}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>أرباح المنصة: {branch.platformShare.toLocaleString()} د.ع</div>
                <div style={{ color: '#f59e0b', fontSize: '13px' }}>حصة الفرع: {branch.branchShare.toLocaleString()} د.ع</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {employeeProfits.map((emp, i) => (
            <div key={i} className="list-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                <div style={{ width: '45px', height: '45px', background: '#fee2e2', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FaUserCircle style={{ fontSize: '24px', color: '#f87171' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '18px' }}>{emp.name}</h3>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>المبيعات الصافية: <strong style={{color:'#dc2626'}}>{emp.totalSales.toLocaleString()} د.ع</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}