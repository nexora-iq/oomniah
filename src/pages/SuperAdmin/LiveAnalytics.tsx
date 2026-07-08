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

  const fetchLiveStats = async () => {
    setLoading(true);
    
    // 1. جلب الفروع مرتبة حسب تاريخ الإنشاء لمعرفة الفرع الأول دائماً
    const { data: branches } = await supabase
      .from('points_of_sale')
      .select('*')
      .order('created_at', { ascending: true });

    // 2. جلب جميع الروابط الكلية المتولدة بالنظام
    const { data: allLinks, error } = await supabase
      .from('gift_links')
      .select('price, pos_id');

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
        isFirstBranch: index === 0, // الفرع الأول المعتمد link.love
        revenue: 0,
        count: 0
      }));

      let grandTotalRevenue = 0;
      let husseinTotal = 0;
      let partner2Total = 0;
      let partner3Total = 0;

      // حساب إجمالي الإيرادات لكل فرع على حدة
      allLinks.forEach((link: any) => {
        const price = Number(link.price || 0);
        grandTotalRevenue += price;

        const targetBranch = branchStats.find(b => b.id === link.pos_id);
        if (targetBranch) {
          targetBranch.revenue += price;
          targetBranch.count += 1;
        }
      });

      // 3. تطبيق المعادلة المالية الذكية حسب شروطك لكل فرع
      branchStats.forEach((branch) => {
        if (branch.isFirstBranch) {
          // الفرع الأول: حسين 35% | الثاني 35% | الثالث 30%
          husseinTotal += (branch.revenue * 35) / 100;
          partner2Total += (branch.revenue * 35) / 100;
          partner3Total += (branch.revenue * 30) / 100;
        } else {
          // الفروع الأخرى: حصة المجموعة 50% وتقسم على 3 بالتساوي
          const groupShare = (branch.revenue * 50) / 100;
          const splitEqual = groupShare / 3;
          
          husseinTotal += splitEqual;
          partner2Total += splitEqual;
          partner3Total += splitEqual;
        }
      });

      setStats({
        totalLinks: allLinks.length,
        totalRevenue: grandTotalRevenue,
        posBreakdown: branchStats,
        partnerShares: [
          { name: "حسين ايهاب نعيم", amount: husseinTotal, formula: "35% من الفرع الأول + ثلث الـ 50% من الفروع الأخرى" },
          { name: "الشريك الثاني", amount: partner2Total, formula: "35% من الفرع الأول + ثلث الـ 50% من الفروع الأخرى" },
          { name: "الشريك الثالث", amount: partner3Total, formula: "30% من الفرع الأول + ثلث الـ 50% من الفروع الأخرى" }
        ]
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '25px', textAlign: 'center', color: '#666', fontSize: '13px' }}>جاري معالجة الحسابات التراكمية الفورية... ⏳</div>;
  }

  return (
    <div style={container}>
      {/* الهيدر الرئيسي للمركز الإحصائي */}
      <div style={headerSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={title}>الإحصائيات والأرباح الفورية 📊</h2>
          <span style={liveBadge}>● تراكمي أزلي</span>
        </div>
        <p style={desc}>شاشة المراقبة الكبرى للمشروع. الأرقام هنا معصومة من التصفير وتوفر تحليلاً دقيقاً لحصص الأرباح.</p>
      </div>

      {/* العدادات العامة الكبرى */}
      <div style={mainGrid}>
        <div style={statCardMain}>
          <div style={cardIcon}>💰</div>
          <div>
            <div style={cardLabel}>المجموع العام للإيرادات</div>
            <div style={cardValueMain}>{stats.totalRevenue.toLocaleString()} د.ع</div>
          </div>
        </div>

        <div style={statCardMain}>
          <div style={cardIcon}>🔗</div>
          <div>
            <div style={cardLabel}>مجموع الروابط المبيعة كلياً</div>
            <div style={cardValueMain}>{stats.totalLinks.toLocaleString()} رابط</div>
          </div>
        </div>
      </div>

      {/* تفصيل النقاط البيعية والإنتاجية */}
      <h3 style={sectionSubTitle}>🏪 أداء الفروع وحركتها المالية الإجمالية:</h3>
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
          </div>
        ))}
      </div>

      {/* توزيع الحصص وفق المعادلة الجديدة */}
      <h3 style={sectionSubTitle}>👥 المحفظة الرقمية لتوزيع حصص الشركاء الثلاثة:</h3>
      <div style={subGrid}>
        {stats.partnerShares.map((partner, index) => (
          <div key={index} style={partnerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={partnerName}>{partner.name}</span>
              <span style={formulaBadge}>معادلة خاصة</span>
            </div>
            <div style={partnerAmount}>{Math.round(partner.amount).toLocaleString()} د.ع</div>
            <div style={partnerSubText}>{partner.formula}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// الستايلات المدمجة والاحترافية لتتناسب مع الرؤية الجديدة للوحة
const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const headerSection: React.CSSProperties = { background: '#fff', padding: '20px 25px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const title: React.CSSProperties = { margin: 0, fontSize: '18px', color: '#111', fontWeight: '900' };
const desc: React.CSSProperties = { margin: '5px 0 0 0', fontSize: '13px', color: '#666' };
const liveBadge: React.CSSProperties = { background: '#fff5f7', color: '#ff4d4d', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #ffe1e8' };

const mainGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const statCardMain: React.CSSProperties = { background: '#ffffff', padding: '25px', borderRadius: '16px', border: '1px solid #dcdcdc', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)', display: 'flex', alignItems: 'center', gap: '20px' };
const cardIcon: React.CSSProperties = { fontSize: '30px', background: '#f8f9fa', padding: '10px', borderRadius: '12px', border: '1px solid #eee' };
const cardLabel: React.CSSProperties = { fontSize: '13px', color: '#666', fontWeight: 'bold' };
const cardValueMain: React.CSSProperties = { fontSize: '24px', color: '#111', fontWeight: '900', marginTop: '4px' };

const sectionSubTitle: React.CSSProperties = { margin: '10px 0 0 0', fontSize: '14px', color: '#222', fontWeight: 'bold' };
const subGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '15px' };

const posStatCard: React.CSSProperties = { background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #dcdcdc', boxShadow: '0 6px 18px rgba(0,0,0,0.02)' };
const posNameText: React.CSSProperties = { fontSize: '13px', fontWeight: 'bold', color: '#111' };
const posCountBadge: React.CSSProperties = { background: '#f0f7ff', color: '#007bff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' };
const posRevenueText: React.CSSProperties = { fontSize: '20px', color: '#00cc66', fontWeight: '900', marginTop: '10px' };

const partnerCard: React.CSSProperties = { background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #dcdcdc', boxShadow: '0 6px 18px rgba(0,0,0,0.02)' };
const partnerName: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: '#111' };
const formulaBadge: React.CSSProperties = { background: '#f8f9fa', color: '#555', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ddd' };
const partnerAmount: React.CSSProperties = { fontSize: '22px', color: '#ff4d4d', fontWeight: '900' };
const partnerSubText: React.CSSProperties = { fontSize: '11px', color: '#777', marginTop: '6px', fontStyle: 'italic' };