import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function FinancialWallet() {
  const [posData, setPosData] = useState<any[]>([]);
  const [totalUncleared, setTotalUncleared] = useState(0); 
  const [timeFilter, setTimeFilter] = useState('all');
  const [finLogs, setFinLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: branches, error: branchError } = await supabase.from('points_of_sale').select(`
        id, name,
        gift_links:gift_links!pos_id ( id, price, price_at_sale, is_cleared, created_at, themes(name) )
      `);

      if (branchError) console.error("Error fetching branches:", branchError);

      const { data: sysLogs } = await supabase
        .from('system_logs')
        .select('*')
        .eq('action_type', 'تصفية مالية')
        .order('created_at', { ascending: false });

      const now = new Date();
      const filterDate = new Date();
      if (timeFilter === 'hour') filterDate.setHours(now.getHours() - 1);
      if (timeFilter === 'day') filterDate.setDate(now.getDate() - 1);
      if (timeFilter === 'week') filterDate.setDate(now.getDate() - 7);
      if (timeFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
      if (timeFilter === 'year') filterDate.setFullYear(now.getFullYear() - 1);

      let grandTotalNet = 0;
      let allFinancialEvents: any[] = [];

      if (branches) {
        const calculatedBranches = branches.map(branch => {
          // فلترة الروابط بناءً على الوقت
          const validLinks = branch.gift_links?.filter((l: any) => {
            const linkDate = new Date(l.created_at);
            const isWithinTime = timeFilter === 'all' ? true : linkDate >= filterDate;
            const actualPrice = Number(l.price_at_sale || l.price || 0);

            if (isWithinTime) {
              allFinancialEvents.push({
                id: l.id,
                type: 'sale',
                desc: `مبيعات (${l.themes?.name || 'ثيم'}) في ${branch.name}`,
                amount: actualPrice,
                date: l.created_at,
                is_cleared: l.is_cleared
              });
            }
            return l.is_cleared === false && isWithinTime;
          }) || [];

          // 🧮 الحسابات المالية (مبيعات الكلية = المطلوب استلامه 100%)
          const totalGross = validLinks.reduce((sum: number, link: any) => {
             return sum + Number(link.price_at_sale || link.price || 0);
          }, 0); 
          
          const linkIdsToClear = validLinks.map((l: any) => l.id);

          grandTotalNet += totalGross;
          
          return { ...branch, totalGross, pendingLinksCount: validLinks.length, linkIdsToClear };
        });
        
        setPosData(calculatedBranches);
        setTotalUncleared(grandTotalNet);
      }

      if (sysLogs) {
        sysLogs.forEach(log => {
          const logDate = new Date(log.created_at);
          if (timeFilter === 'all' || logDate >= filterDate) {
            allFinancialEvents.push({
              id: log.id,
              type: 'clearance',
              desc: log.details,
              amount: 0,
              date: log.created_at
            });
          }
        });
      }

      allFinancialEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFinLogs(allFinancialEvents);
    } catch (err) {
      console.error("General error in FinancialWallet:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [timeFilter]);

  const handleClearance = async (posId: string, posName: string, totalGross: number, linkIds: string[]) => {
    if(linkIds.length === 0 || totalGross === 0) return alert('الحساب مصفر مسبقاً ضمن هذا النطاق الزمني.');
    
    const confirm = window.confirm(`تأكيد استلام مبلغ الديون بالكامل (${totalGross.toLocaleString()} د.ع) وتصفية حساب فرع ${posName}؟`);
    
    if (confirm) {
      const { error } = await supabase.from('gift_links').update({ is_cleared: true }).in('id', linkIds);
      if (error) {
          alert("حدث خطأ أثناء التصفية. تحقق من الصلاحيات.");
          return;
      }
      
      await supabase.from('system_logs').insert([{ 
        admin_name: 'السوبر أدمن', 
        pos_name: posName, 
        action_type: 'تصفية مالية', 
        details: `تصفية مالية واستلام كامل المبلغ ${totalGross.toLocaleString()} د.ع من ${posName}` 
      }]);
      
      fetchData();
    }
  };

  const exportFinToExcel = () => {
    const headers = ["النوع", "التفاصيل", "المبلغ", "التاريخ"];
    const rows = finLogs.map(log => [
      log.type === 'sale' ? 'مبيعات' : 'تصفية',
      log.desc,
      log.type === 'sale' ? log.amount : 0,
      new Date(log.date).toLocaleString('en-IQ')
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `السجل_المالي_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px', fontWeight: 'bold', color: '#ff69b4' }}>جاري تحميل الدفتر المالي... ⏳</div>;

  return (
    <div style={container}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div style={headerSection} className="no-print">
        <h3 style={title}>الدفتر المالي وتصفية الديون 💰</h3>
        <div style={filterRibbon}>
          <button onClick={() => setTimeFilter('all')} style={timeFilter === 'all' ? activeFilterBtn : filterBtn}>كل الأوقات</button>
          <button onClick={() => setTimeFilter('year')} style={timeFilter === 'year' ? activeFilterBtn : filterBtn}>هذه السنة</button>
          <button onClick={() => setTimeFilter('month')} style={timeFilter === 'month' ? activeFilterBtn : filterBtn}>هذا الشهر</button>
          <button onClick={() => setTimeFilter('week')} style={timeFilter === 'week' ? activeFilterBtn : filterBtn}>هذا الأسبوع</button>
          <button onClick={() => setTimeFilter('day')} style={timeFilter === 'day' ? activeFilterBtn : filterBtn}>اليوم</button>
          <button onClick={() => setTimeFilter('hour')} style={timeFilter === 'hour' ? activeFilterBtn : filterBtn}>آخر ساعة</button>
        </div>
      </div>
      
      <div style={totalBox}>
        <div style={{ fontSize: '14px', color: '#666' }}>إجمالي الديون (المطلوب استلامه بالكامل من الفروع)</div>
        <div style={{ fontSize: '36px', color: '#ff4d4d', fontWeight: '900' }}>{totalUncleared.toLocaleString()} د.ع</div>
      </div>

      <div style={cardsContainer} className="no-print">
        {posData.map(pos => (
          <div key={pos.id} style={card}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>{pos.name}</h4>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <div style={{ fontSize: '13px', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                <span>إجمالي المبيعات غير المستلمة:</span>
                <strong style={{color: '#ff4d4d', fontSize: '15px'}}>{pos.totalGross.toLocaleString()} د.ع</strong>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#555', marginBottom: '15px' }}>
              عدد الروابط قيد التحصيل: <span style={{fontWeight:'bold', color: pos.pendingLinksCount > 0 ? '#ff4d4d' : '#00cc66'}}>{pos.pendingLinksCount}</span>
            </div>

            <button 
              onClick={() => handleClearance(pos.id, pos.name, pos.totalGross, pos.linkIdsToClear)} 
              style={pos.totalGross === 0 ? disabledClearBtn : clearBtn}
              disabled={pos.totalGross === 0}
            >
              💸 استلام وتصفير الحساب
            </button>
          </div>
        ))}
        {posData.length === 0 && <p style={{ color: '#999', fontSize: '14px', width: '100%', textAlign: 'center' }}>لا توجد فروع مسجلة.</p>}
      </div>

      <div style={logsContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', color: '#111' }}>🧾 سجل الحركات المالية الدقيق:</h4>
          <div style={{ display: 'flex', gap: '8px' }} className="no-print">
            <button onClick={() => window.print()} style={{ background: '#fff', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🖨️ طباعة</button>
            <button onClick={exportFinToExcel} style={{ background: '#00cc66', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>📊 إكسل</button>
          </div>
        </div>
        
        <div style={tableWrapper}>
          <table style={table}>
            <tbody>
              {finLogs.map((log, index) => (
                <tr key={index} style={tdRow}>
                  <td style={{ ...td, width: '40px', textAlign: 'center' }}>
                    {log.type === 'clearance' ? '💰' : '🔗'}
                  </td>
                  <td style={td}>
                    <strong style={{ color: log.type === 'clearance' ? '#00cc66' : '#111' }}>{log.desc}</strong>
                    {log.type === 'sale' && (
                      <span style={{ fontSize: '11px', color: log.is_cleared ? '#00cc66' : '#ff4d4d', marginRight: '10px' }}>
                        ({log.is_cleared ? 'مُصفى ومستلم' : 'دين قيد التحصيل'})
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, fontWeight: 'bold', color: log.type === 'sale' ? '#ff4d4d' : '#00cc66', textAlign: 'left' }}>
                    {log.type === 'sale' ? `+${log.amount?.toLocaleString() || 0} د.ع` : 'تصفية'}
                  </td>
                  <td style={{ ...td, color: '#888', fontSize: '11px', textAlign: 'left' }} dir="ltr">
                    {new Date(log.date).toLocaleString('en-IQ')}
                  </td>
                </tr>
              ))}
              {finLogs.length === 0 && <tr><td colSpan={4} style={emptyText}>لا توجد حركات مالية في هذا الوقت.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl', fontFamily: 'sans-serif' };
const headerSection: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const title: React.CSSProperties = { margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111' };
const filterRibbon: React.CSSProperties = { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' };
const filterBtn: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', color: '#555', fontWeight: 'bold', whiteSpace: 'nowrap' };
const activeFilterBtn: React.CSSProperties = { ...filterBtn, background: '#111', color: '#fff', border: '1px solid #111' };
const totalBox: React.CSSProperties = { background: '#fff5f7', padding: '30px', borderRadius: '16px', border: '1px solid #ffe1e8', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const cardsContainer: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' };
const card: React.CSSProperties = { background: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const clearBtn: React.CSSProperties = { width: '100%', background: '#111', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' };
const disabledClearBtn: React.CSSProperties = { ...clearBtn, background: '#e0e0e0', color: '#999', cursor: 'not-allowed' };
const logsContainer: React.CSSProperties = { background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #eee', marginTop: '10px' };
const tableWrapper: React.CSSProperties = { maxHeight: '300px', overflowY: 'auto' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const tdRow: React.CSSProperties = { borderBottom: '1px solid #f9f9f9' };
const td: React.CSSProperties = { padding: '12px 10px', fontSize: '13px' };
const emptyText: React.CSSProperties = { padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' };