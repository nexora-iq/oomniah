import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function LiveAnalytics() {
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalRevenue: 0,
    posBreakdown: [] as any[],
    partnerShares: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  
  const [timeFilter, setTimeFilter] = useState<'all' | 'month'>('month');

  const fetchLiveStats = async () => {
    setLoading(true);
    
    const { data: branches } = await supabase
      .from('points_of_sale')
      .select('*')
      .order('created_at', { ascending: true });

    let linksQuery = supabase.from('gift_links').select('price, price_at_sale, pos_id, created_at');
    
    if (timeFilter === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      linksQuery = linksQuery.gte('created_at', startOfMonth.toISOString());
    }

    const { data: allLinks, error } = await linksQuery;

    if (error) {
      console.error("خطأ في جلب البيانات الإحصائية:", error);
      setLoading(false);
      return;
    }

    if (branches && allLinks) {
      const branchStats = branches.map((b) => ({
        id: b.id,
        name: b.name,
        totalSales: 0, 
        count: 0
      }));

      let grandTotalSales = 0;
      let husseinTotal = 0;
      let abdullahTotal = 0;
      let muntadherTotal = 0;

      allLinks.forEach((link: any) => {
        const actualPrice = Number(link.price_at_sale || link.price || 0);
        grandTotalSales += actualPrice;

        const targetBranch = branchStats.find(b => b.id === link.pos_id);
        if (targetBranch) {
          targetBranch.totalSales += actualPrice;
          targetBranch.count += 1;
        }
      });

      // توزيع المبيعات الكلية بنسبة 100% على الشركاء (بدون أي استقطاع للفروع)
      husseinTotal = (grandTotalSales * 35) / 100;
      abdullahTotal = (grandTotalSales * 35) / 100;
      muntadherTotal = (grandTotalSales * 30) / 100;

      setStats({
        totalLinks: allLinks.length,
        totalRevenue: grandTotalSales,
        posBreakdown: branchStats,
        partnerShares: [
          { name: "حسين ايهاب نعيم", amount: husseinTotal, formula: "35% من الأرباح الكلية" },
          { name: "عبدالله", amount: abdullahTotal, formula: "35% من الأرباح الكلية" },
          { name: "منتظر", amount: muntadherTotal, formula: "30% من الأرباح الكلية" }
        ]
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveStats();
  }, [timeFilter]);

  if (loading) {
    return <div style={{ padding: '25px', textAlign: 'center', color: '#666', fontSize: '15px', fontWeight: 'bold' }}>جاري حساب الأرباح الكلية... ⏳</div>;
  }

  return (
    <div style={container}>
      <div style={headerSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={title}>إحصائيات الأرباح والمبيعات 📊</h2>
            <p style={desc}>شاشة المراقبة المباشرة. يتم حساب الأرباح هنا بشكل فوري لجميع الشركاء بالكامل.</p>
          </div>
          <div style={filterContainer}>
            <button style={timeFilter === 'month' ? activeBtn : inactiveBtn} onClick={() => setTimeFilter('month')}>هذا الشهر</button>
            <button style={timeFilter === 'all' ? activeBtn : inactiveBtn} onClick={() => setTimeFilter('all')}>كل الأوقات (تراكمي)</button>
          </div>
        </div>
      </div>

      <div style={mainGrid}>
        <div style={statCardMain}>
          <div style={cardIcon}>💰</div>
          <div>
            <div style={cardLabel}>إجمالي المبيعات الكلية</div>
            <div style={cardValueMain}>{stats.totalRevenue.toLocaleString()} د.ع</div>
          </div>
        </div>

        <div style={statCardMain}>
          <div style={cardIcon}>🔗</div>
          <div>
            <div style={cardLabel}>الروابط المبيعة</div>
            <div style={cardValueMain}>{stats.totalLinks.toLocaleString()} رابط</div>
          </div>
        </div>
      </div>

      <h3 style={sectionSubTitle}>👥 حصص الشركاء من الأرباح الكلية (100%):</h3>
      <div style={subGrid}>
        {stats.partnerShares.map((partner, index) => (
          <div key={index} style={partnerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={partnerName}>{partner.name}</span>
              <span style={formulaBadge}>مُحدثة فورياً</span>
            </div>
            <div style={partnerAmount}>{Math.round(partner.amount).toLocaleString()} د.ع</div>
            <div style={partnerSubText}>{partner.formula}</div>
          </div>
        ))}
      </div>

      <h3 style={sectionSubTitle}>🏪 مصدر الأرباح (مبيعات الفروع الحالية):</h3>
      <div style={subGrid}>
        {stats.posBreakdown.map((pos, index) => (
          <div key={index} style={posStatCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={posNameText}>{pos.name}</span>
              <span style={posCountBadge}>{pos.count} رابط</span>
            </div>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '15px' }}>مساهمة الفرع في الأرباح:</div>
            <div style={posRevenueText}>{pos.totalSales.toLocaleString()} د.ع</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// الستايلات
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl', fontFamily: 'sans-serif' };
const headerSection: React.CSSProperties = { background: '#fff', padding: '20px 25px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const title: React.CSSProperties = { margin: 0, fontSize: '20px', color: '#111', fontWeight: '900' };
const desc: React.CSSProperties = { margin: '5px 0 0 0', fontSize: '13px', color: '#666' };
const filterContainer: React.CSSProperties = { display: 'flex', gap: '10px', background: '#f8f9fa', padding: '5px', borderRadius: '10px', border: '1px solid #eee' };
const activeBtn: React.CSSProperties = { background: '#ff69b4', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const inactiveBtn: React.CSSProperties = { background: 'transparent', color: '#666', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const mainGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const statCardMain: React.CSSProperties = { background: '#ffffff', padding: '25px', borderRadius: '16px', border: '1px solid #dcdcdc', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)', display: 'flex', alignItems: 'center', gap: '20px' };
const cardIcon: React.CSSProperties = { fontSize: '30px', background: '#f8f9fa', padding: '10px', borderRadius: '12px', border: '1px solid #eee' };
const cardLabel: React.CSSProperties = { fontSize: '13px', color: '#666', fontWeight: 'bold' };
const cardValueMain: React.CSSProperties = { fontSize: '24px', color: '#111', fontWeight: '900', marginTop: '4px' };
const sectionSubTitle: React.CSSProperties = { margin: '10px 0 0 0', fontSize: '16px', color: '#222', fontWeight: 'bold' };
const subGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '15px' };
const posStatCard: React.CSSProperties = { background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #dcdcdc', boxShadow: '0 6px 18px rgba(0,0,0,0.02)' };
const posNameText: React.CSSProperties = { fontSize: '15px', fontWeight: 'bold', color: '#111' };
const posCountBadge: React.CSSProperties = { background: '#f0f7ff', color: '#007bff', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' };
const posRevenueText: React.CSSProperties = { fontSize: '22px', color: '#00cc66', fontWeight: '900', marginTop: '4px' };
const partnerCard: React.CSSProperties = { background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #dcdcdc', boxShadow: '0 6px 18px rgba(0,0,0,0.02)' };
const partnerName: React.CSSProperties = { fontSize: '15px', fontWeight: 'bold', color: '#111' };
const formulaBadge: React.CSSProperties = { background: '#f8f9fa', color: '#555', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ddd' };
const partnerAmount: React.CSSProperties = { fontSize: '24px', color: '#ff4d4d', fontWeight: '900' };
const partnerSubText: React.CSSProperties = { fontSize: '12px', color: '#777', marginTop: '8px', fontStyle: 'italic' };