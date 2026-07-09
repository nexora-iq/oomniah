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
  
  // 📅 إضافة حالة لتصفية الوقت (كل الأوقات أو هذا الشهر)
  const [timeFilter, setTimeFilter] = useState<'all' | 'month'>('month');

  const fetchLiveStats = async () => {
    setLoading(true);
    
    // 1. جلب الفروع مرتبة حسب تاريخ الإنشاء لمعرفة الفرع الأول دائماً
    const { data: branches } = await supabase
      .from('points_of_sale')
      .select('*')
      .order('created_at', { ascending: true });

    // 2. بناء استعلام الروابط (نطلب price و price_at_sale)
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
      // هيكلة الفروع وتجهيز العدادات الخاصة بها
      const branchStats = branches.map((b, index) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        isFirstBranch: index === 0, // الفرع الأول المعتمد (الرئيسي)
        sharePercentage: Number(b.share_percentage || 0), // حصة الفرع المسجلة بالداتابيس
        revenue: 0, // إجمالي الإيرادات
        netSystemRevenue: 0, // الصافي للنظام (بعد استقطاع حصة الفرع)
        count: 0
      }));

      let grandTotalRevenue = 0;
      let husseinTotal = 0;
      let partner2Total = 0;
      let partner3Total = 0;

      // حساب الإيرادات وتوزيعها على الفروع
      allLinks.forEach((link: any) => {
        // التأكد من أخذ السعر الحقيقي
        const actualPrice = Number(link.price_at_sale || link.price || 0);
        grandTotalRevenue += actualPrice;

        const targetBranch = branchStats.find(b => b.id === link.pos_id);
        if (targetBranch) {
          targetBranch.revenue += actualPrice;
          targetBranch.count += 1;
        }
      });

      // 3. تطبيق المعادلة المالية الذكية
      branchStats.forEach((branch) => {
        // حساب الصافي العائد للنظام (الإجمالي - حصة الفرع)
        const posShare = (branch.revenue * branch.sharePercentage) / 100;
        branch.netSystemRevenue = branch.revenue - posShare;

        if (branch.isFirstBranch) {
          // الفرع الأول (الرئيسي): تتوزع أرباحه الصافية بنسبة (35%، 35%، 30%)
          husseinTotal += (branch.netSystemRevenue * 35) / 100;
          partner2Total += (branch.netSystemRevenue * 35) / 100;
          partner3Total += (branch.netSystemRevenue * 30) / 100;
        } else {
          // الفروع الأخرى (الوكلاء): حصة النظام منها تتوزع (35%، 35%، 30%)
          // (إذا كنت تقصد 50% تنقسم بالتساوي، غير هذه المعادلة أدناه، لكن حسب طلبك الأخير: 35/35/30)
          husseinTotal += (branch.netSystemRevenue * 35) / 100;
          partner2Total += (branch.netSystemRevenue * 35) / 100;
          partner3Total += (branch.netSystemRevenue * 30) / 100;
        }
      });

      setStats({
        totalLinks: allLinks.length,
        totalRevenue: grandTotalRevenue,
        posBreakdown: branchStats,
        partnerShares: [
          { name: "حسين ايهاب نعيم", amount: husseinTotal, formula: "35% من صافي أرباح الفروع" },
          { name: "عبدالله", amount: partner2Total, formula: "35% من صافي أرباح الفروع" },
          { name: "منتظر", amount: partner3Total, formula: "30% من صافي أرباح الفروع" }
        ]
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveStats();
  }, [timeFilter]);

  if (loading) {
    return <div style={{ padding: '25px', textAlign: 'center', color: '#666', fontSize: '15px', fontWeight: 'bold' }}>جاري معالجة الحسابات الفورية... ⏳</div>;
  }

  return (
    <div style={container}>
      {/* الهيدر الرئيسي */}
      <div style={headerSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={title}>الإحصائيات والأرباح 📊</h2>
            <p style={desc}>شاشة المراقبة الكبرى للمشروع. الأرقام هنا معصومة من التصفير وتوفر تحليلاً دقيقاً للحصص.</p>
          </div>
          <div style={filterContainer}>
            <button 
              style={timeFilter === 'month' ? activeBtn : inactiveBtn} 
              onClick={() => setTimeFilter('month')}
            >
              هذا الشهر
            </button>
            <button 
              style={timeFilter === 'all' ? activeBtn : inactiveBtn} 
              onClick={() => setTimeFilter('all')}
            >
              كل الأوقات (تراكمي)
            </button>
          </div>
        </div>
      </div>

      {/* العدادات العامة الكبرى */}
      <div style={mainGrid}>
        <div style={statCardMain}>
          <div style={cardIcon}>💰</div>
          <div>
            <div style={cardLabel}>إجمالي الإيرادات (المبيعات الكلية)</div>
            <div style={cardValueMain}>{stats.totalRevenue.toLocaleString()} د.ع</div>
          </div>
        </div>

        <div style={statCardMain}>
          <div style={cardIcon}>🔗</div>
          <div>
            <div style={cardLabel}>الروابط المبيعة ({timeFilter === 'month' ? 'الشهرية' : 'الكلية'})</div>
            <div style={cardValueMain}>{stats.totalLinks.toLocaleString()} رابط</div>
          </div>
        </div>
      </div>

      {/* توزيع الحصص وفق المعادلة */}
      <h3 style={sectionSubTitle}>👥 المحفظة الرقمية لتوزيع صافي أرباح الشركاء (بعد استقطاع حصة الفروع):</h3>
      <div style={subGrid}>
        {stats.partnerShares.map((partner, index) => (
          <div key={index} style={partnerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={partnerName}>{partner.name}</span>
              <span style={formulaBadge}>مُحدثة</span>
            </div>
            <div style={partnerAmount}>{Math.round(partner.amount).toLocaleString()} د.ع</div>
            <div style={partnerSubText}>{partner.formula}</div>
          </div>
        ))}
      </div>

      {/* تفصيل النقاط البيعية */}
      <h3 style={sectionSubTitle}>🏪 أداء الفروع وحركتها المالية الإجمالية (إيرادات قبل الاستقطاع):</h3>
      <div style={subGrid}>
        {stats.posBreakdown.map((pos, index) => (
          <div key={index} style={posStatCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={posNameText}>
                {pos.name} {pos.isFirstBranch && <span style={{ color: '#ff4d4d', fontSize: '11px' }}>(الأساسي)</span>}
              </span>
              <span style={posCountBadge}>{pos.count} رابط</span>
            </div>
            <div style={posRevenueText}>{pos.revenue.toLocaleString()} د.ع</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>الصافي للنظام: {pos.netSystemRevenue.toLocaleString()} د.ع</div>
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
const activeBtn: React.CSSProperties = { background: '#ff69b4', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.3s' };
const inactiveBtn: React.CSSProperties = { background: 'transparent', color: '#666', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.3s' };
const mainGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const statCardMain: React.CSSProperties = { background: '#ffffff', padding: '25px', borderRadius: '16px', border: '1px solid #dcdcdc', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)', display: 'flex', alignItems: 'center', gap: '20px' };
const cardIcon: React.CSSProperties = { fontSize: '30px', background: '#f8f9fa', padding: '10px', borderRadius: '12px', border: '1px solid #eee' };
const cardLabel: React.CSSProperties = { fontSize: '13px', color: '#666', fontWeight: 'bold' };
const cardValueMain: React.CSSProperties = { fontSize: '24px', color: '#111', fontWeight: '900', marginTop: '4px' };
const sectionSubTitle: React.CSSProperties = { margin: '10px 0 0 0', fontSize: '16px', color: '#222', fontWeight: 'bold' };
const subGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '15px' };
const posStatCard: React.CSSProperties = { background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #dcdcdc', boxShadow: '0 6px 18px rgba(0,0,0,0.02)' };
const posNameText: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: '#111' };
const posCountBadge: React.CSSProperties = { background: '#f0f7ff', color: '#007bff', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' };
const posRevenueText: React.CSSProperties = { fontSize: '22px', color: '#00cc66', fontWeight: '900', marginTop: '10px' };
const partnerCard: React.CSSProperties = { background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #dcdcdc', boxShadow: '0 6px 18px rgba(0,0,0,0.02)' };
const partnerName: React.CSSProperties = { fontSize: '15px', fontWeight: 'bold', color: '#111' };
const formulaBadge: React.CSSProperties = { background: '#f8f9fa', color: '#555', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ddd' };
const partnerAmount: React.CSSProperties = { fontSize: '22px', color: '#ff4d4d', fontWeight: '900' };
const partnerSubText: React.CSSProperties = { fontSize: '12px', color: '#777', marginTop: '8px', fontStyle: 'italic' };