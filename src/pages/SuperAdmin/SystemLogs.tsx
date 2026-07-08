import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false });
      
      if (data) {
        const now = new Date();
        const filterDate = new Date();
        if (timeFilter === 'hour') filterDate.setHours(now.getHours() - 1);
        if (timeFilter === 'day') filterDate.setDate(now.getDate() - 1);
        if (timeFilter === 'week') filterDate.setDate(now.getDate() - 7);
        if (timeFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
        if (timeFilter === 'year') filterDate.setFullYear(now.getFullYear() - 1);

        const filtered = timeFilter === 'all' ? data : data.filter(log => new Date(log.created_at) >= filterDate);
        setLogs(filtered);
      }
    };
    fetchLogs();
  }, [timeFilter]);

  // دالة التصدير إلى إكسل
  const exportToExcel = () => {
    const headers = ["الموظف", "الفرع", "نوع الحركة", "التفاصيل", "الوقت والتاريخ"];
    const rows = logs.map(log => [
      log.admin_name || '-', log.pos_name || '-', log.action_type || '-', 
      log.details || '-', new Date(log.created_at).toLocaleString('en-IQ')
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `سجل_النظام_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div style={container}>
      {/* ستايل مخصص للطباعة لإخفاء الأزرار الجانبية */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      
      <div style={headerSection} className="no-print">
        <div>
          <h3 style={title}>سجل حركات النظام 🔒</h3>
          <p style={desc}>مراقبة شاملة لكل العمليات مع إمكانية التصدير والفلترة.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={printBtn}>🖨️ طباعة</button>
          <button onClick={exportToExcel} style={excelBtn}>📊 تصدير إكسل</button>
        </div>
      </div>

      <div style={filterRibbon} className="no-print">
        <button onClick={() => setTimeFilter('all')} style={timeFilter === 'all' ? activeFilterBtn : filterBtn}>كل الأوقات</button>
        <button onClick={() => setTimeFilter('year')} style={timeFilter === 'year' ? activeFilterBtn : filterBtn}>هذه السنة</button>
        <button onClick={() => setTimeFilter('month')} style={timeFilter === 'month' ? activeFilterBtn : filterBtn}>هذا الشهر</button>
        <button onClick={() => setTimeFilter('week')} style={timeFilter === 'week' ? activeFilterBtn : filterBtn}>هذا الأسبوع</button>
        <button onClick={() => setTimeFilter('day')} style={timeFilter === 'day' ? activeFilterBtn : filterBtn}>اليوم</button>
        <button onClick={() => setTimeFilter('hour')} style={timeFilter === 'hour' ? activeFilterBtn : filterBtn}>آخر ساعة</button>
      </div>
      
      <div style={tableContainer}>
        <table style={table}>
          <thead style={thRow}>
            <tr><th style={th}>الموظف</th><th style={th}>الفرع</th><th style={th}>نوع الحركة</th><th style={th}>التفاصيل</th><th style={th}>الوقت والتاريخ</th></tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={tdRow}>
                <td style={td}><strong>{log.admin_name}</strong></td>
                <td style={td}>{log.pos_name}</td>
                <td style={td}><span style={badgeAction}>{log.action_type}</span></td>
                <td style={td}>{log.details}</td>
                <td style={td} dir="ltr">{new Date(log.created_at).toLocaleString('en-IQ')}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} style={emptyText}>لا توجد حركات مسجلة.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const headerSection: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eee' };
const title: React.CSSProperties = { margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' };
const desc: React.CSSProperties = { margin: 0, fontSize: '12px', color: '#666' };
const filterRibbon: React.CSSProperties = { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' };
const filterBtn: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const activeFilterBtn: React.CSSProperties = { ...filterBtn, background: '#111', color: '#fff', border: '1px solid #111' };
const printBtn: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const excelBtn: React.CSSProperties = { background: '#00cc66', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const tableContainer: React.CSSProperties = { background: '#fff', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thRow: React.CSSProperties = { background: '#f8f9fa', borderBottom: '1px solid #eee' };
const th: React.CSSProperties = { padding: '12px 15px', fontSize: '12px', color: '#444' };
const tdRow: React.CSSProperties = { borderBottom: '1px solid #eee' };
const td: React.CSSProperties = { padding: '12px 15px', fontSize: '12px', color: '#222' };
const emptyText: React.CSSProperties = { padding: '20px', textAlign: 'center', color: '#999', fontSize: '12px' };
const badgeAction: React.CSSProperties = { background: '#f0f7ff', color: '#007bff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' };