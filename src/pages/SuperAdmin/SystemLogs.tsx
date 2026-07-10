import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات الفلاتر المتقدمة والبحث
  const [searchQuery, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [posFilter, setPosFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // قوائم فريدة للفلترة الديناميكية
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [adminNames, setAdminNames] = useState<string[]>([]);
  const [posNames, setPosNames] = useState<string[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching system logs:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setLogs(data);
      setFilteredLogs(data);

      // استخراج القوائم الفريدة للفلاتر تلقائياً من البيانات
      const actions = Array.from(new Set(data.map(l => l.action_type).filter(Boolean))) as string[];
      const admins = Array.from(new Set(data.map(l => l.admin_name).filter(Boolean))) as string[];
      const positions = Array.from(new Set(data.map(l => l.pos_name).filter(Boolean))) as string[];
      
      setActionTypes(actions);
      setAdminNames(admins);
      setPosNames(positions);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // تفعيل الفلترة والبحث اللحظي عند تغيير أي فلتر
  useEffect(() => {
    let result = [...logs];

    // 1. الفلترة حسب البحث النصي العام (يبحث في التفاصيل أو الأسماء)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(log => 
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.admin_name && log.admin_name.toLowerCase().includes(q)) ||
        (log.pos_name && log.pos_name.toLowerCase().includes(q))
      );
    }

    // 2. الفلترة حسب نوع الحركة
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action_type === actionFilter);
    }

    // 3. الفلترة حسب اسم الموظف
    if (adminFilter !== 'all') {
      result = result.filter(log => log.admin_name === adminFilter);
    }

    // 4. الفلترة حسب اسم الفرع
    if (posFilter !== 'all') {
      result = result.filter(log => log.pos_name === posFilter);
    }

    // 5. الفلترة حسب النطاق الزمني الدقيق
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(log => new Date(log.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      // تمديد نهاية اليوم لتشمل الحركات المتأخرة فيه
      end.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.created_at) <= end);
    }

    setFilteredLogs(result);
  }, [searchQuery, actionFilter, adminFilter, posFilter, startDate, endDate, logs]);

  // دالة التصدير الشاملة إلى إكسل
  const exportToExcel = () => {
    const headers = ["الموظف", "الفرع", "نوع الحركة", "التفاصيل", "الوقت والتاريخ بالثواني"];
    const rows = filteredLogs.map(log => [
      log.admin_name || '-', log.pos_name || '-', log.action_type || '-', 
      log.details || '-', new Date(log.created_at).toLocaleString('en-IQ', { hour12: true })
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `سجل_حركات_النظام_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div style={container}>
      <style>{`
        @media print { .no-print { display: none !important; } }
        .filter-input { padding: 10px; border-radius: 8px; border: 1px solid #ddd; font-size: 13px; outline: none; background: #fff; min-width: 150px; flex: 1; }
        .filter-input:focus { border-color: #ff69b4; }
      `}</style>
      
      {/* الهيدر */}
      <div style={headerSection} className="no-print">
        <div>
          <h3 style={title}>سجل حركات النظام الشامل 🔒</h3>
          <p style={desc}>مراقبة صارمة لعمليات الدخول، الخروج، وتوليد الروابط بالثواني الحقيقية.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={printBtn}>🖨️ طباعة السجل</button>
          <button onClick={exportToExcel} style={excelBtn}>📊 تصدير الفلترة الحالية</button>
        </div>
      </div>

      {/* لوحة الفلاتر المتقدمة والبحث */}
      <div style={filterPanel} className="no-print">
        <input 
          type="text" 
          placeholder="🔍 ابحث في تفاصيل الحركة..." 
          value={searchQuery} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="filter-input"
          style={{ minWidth: '220px' }}
        />
        
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="filter-input">
          <option value="all">كل أنواع الحركات</option>
          {actionTypes.map((act, i) => <option key={i} value={act}>{act}</option>)}
        </select>

        <select value={adminFilter} onChange={e => setAdminFilter(e.target.value)} className="filter-input">
          <option value="all">كل الموظفين</option>
          {adminNames.map((adm, i) => <option key={i} value={adm}>{adm}</option>)}
        </select>

        <select value={posFilter} onChange={e => setPosFilter(e.target.value)} className="filter-input">
          <option value="all">كل الفروع</option>
          {posNames.map((pos, i) => <option key={i} value={pos}>{pos}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>من:</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="filter-input" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>إلى:</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="filter-input" />
        </div>
      </div>
      
      {/* جدول البيانات المطور */}
      <div style={tableContainer}>
        {loading ? (
           <div style={emptyText}>جاري جلب السجلات ومطابقة الثواني... ⏳</div>
        ) : (
          <table style={table}>
            <thead style={thRow}>
              <tr>
                <th style={th}>الموظف / المسؤول</th>
                <th style={th}>الفرع</th>
                <th style={th}>نوع الحركة</th>
                <th style={th}>تفاصيل العملية كاملة</th>
                <th style={th}>الوقت والتاريخ الحقيقي (بالثواني)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                // تنسيق التوقيت العراقي الدقيق بالثواني
                const exactTime = new Date(log.created_at).toLocaleString('en-IQ', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                  hour12: true
                });

                return (
                  <tr key={log.id} style={tdRow}>
                    <td style={td}><strong>{log.admin_name || 'غير معروف'}</strong></td>
                    <td style={td}><span style={{ color: '#555', fontWeight: 'bold' }}>{log.pos_name || '-'}</span></td>
                    <td style={td}>
                      <span style={
                        log.action_type === 'توليد رابط' ? badgeSale : 
                        log.action_type === 'تسجيل دخول' ? badgeLogin : 
                        log.action_type === 'تسجيل خروج' ? badgeLogout : badgeAction
                      }>
                        {log.action_type}
                      </span>
                    </td>
                    <td style={{ ...td, color: '#333', maxWidth: '350px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.5' }}>
                      {log.details}
                    </td>
                    <td style={{ ...td, color: '#ff4d4d', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px' }} dir="ltr">
                      {exactTime}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && <tr><td colSpan={5} style={emptyText}>لا توجد حركات مطابقة للفلترة والبحث الحالي.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// الستايلات الفاخرة المحدثة للفلترة المتقدمة
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px', direction: 'rtl', fontFamily: 'sans-serif' };
const headerSection: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #eee' };
const title: React.CSSProperties = { margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' };
const desc: React.CSSProperties = { margin: 0, fontSize: '12px', color: '#666' };

const filterPanel: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #eee', alignItems: 'center' };

const printBtn: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const excelBtn: React.CSSProperties = { background: '#00cc66', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const tableContainer: React.CSSProperties = { background: '#fff', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thRow: React.CSSProperties = { background: '#f8f9fa', borderBottom: '1px solid #eee' };
const th: React.CSSProperties = { padding: '12px 15px', fontSize: '12px', color: '#444', fontWeight: '900' };
const tdRow: React.CSSProperties = { borderBottom: '1px solid #eee' };
const td: React.CSSProperties = { padding: '12px 15px', fontSize: '12px', color: '#222' };
const emptyText: React.CSSProperties = { padding: '30px', textAlign: 'center', color: '#999', fontSize: '13px', fontWeight: 'bold' };

const badgeAction: React.CSSProperties = { background: '#f0f7ff', color: '#007bff', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' };
const badgeSale: React.CSSProperties = { background: '#e6f9f0', color: '#00cc66', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' };
const badgeLogin: React.CSSProperties = { background: '#edfdf6', color: '#00aa55', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', border: '1px solid #00cc66' };
const badgeLogout: React.CSSProperties = { background: '#fff0f0', color: '#ff4d4d', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', border: '1px solid #ffcccc' };