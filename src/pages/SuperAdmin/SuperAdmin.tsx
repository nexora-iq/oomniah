import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
// استيراد الأقسام الحقيقية
import POSManagement from './POSManagement';
import ThemesControl from './ThemesControl';
import AdminsControl from './AdminsControl';
import SystemLogs from './SystemLogs';
import LinksMaster from './LinksMaster';
import FinancialWallet from './FinancialWallet';
import LiveAnalytics from './LiveAnalytics';


export default function SuperAdmin() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // خليتها مفتوحة كبِداية
  const [activeTab, setActiveTab] = useState('analytics');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    // توثيق تسجيل الخروج
    await supabase.from('system_logs').insert([{
      admin_name: 'حسين ايهاب نعيم', // أو يمكنك جلب الاسم من الـ session
      pos_name: 'لوحة التحكم الكبرى',
      action_type: 'تسجيل خروج',
      details: `قام السوبر أدمن بتسجيل الخروج من النظام`
    }]);

    await supabase.auth.signOut();
    navigate('/secure-portal-access');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics': return <LiveAnalytics />;
      case 'pos': return <POSManagement />;
      case 'themes': return <ThemesControl />;
      case 'admins': return <AdminsControl />;
      case 'logs': return <SystemLogs />;
      case 'links': return <LinksMaster />;
      case 'financial': return <FinancialWallet />;
      default: return <LiveAnalytics />;
    }
  };

  // 1. شاشة الترحيب الملكية الفخمة (تصميم جديد)
  if (showWelcome) {
    return (
      <div style={welcomeContainer}>
        <style>
          {`
            @keyframes elegantFadeIn {
              0% { opacity: 0; transform: translateY(15px); filter: blur(4px); }
              100% { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            @keyframes lineExpand {
              0% { width: 0; opacity: 0; }
              100% { width: 60px; opacity: 1; }
            }
          `}
        </style>
        <div style={{ animation: 'elegantFadeIn 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          <div style={crownIcon}>👑</div>
          <h2 style={{ color: '#111', fontSize: '18px', fontWeight: '500', marginBottom: '8px', letterSpacing: '1px' }}>مرحباً بك في مركز القيادة</h2>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #ff4d4d, transparent)', margin: '0 auto 15px', animation: 'lineExpand 1.5s ease forwards' }}></div>
          <h1 style={{ color: '#ff4d4d', fontSize: '28px', margin: 0, fontWeight: '800', letterSpacing: '1px' }}>حسين ايهاب نعيم</h1>
        </div>
      </div>
    );
  }

  // 2. لوحة القيادة الرئيسية (بترتيب جديد وأحجام مصغرة)
  return (
    <div style={layout}>
      
      {/* القائمة الجانبية (تدفع المحتوى ولا تغطيه) */}
      <div style={{ ...sidebar, width: isSidebarOpen ? '230px' : '0px' }}>
        <div style={sidebarInner}>
          <div style={sidebarHeader}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ff4d4d' }}>Link<span style={{ color: '#ff69b4' }}>Love</span></h3>
          </div>
          
          <div style={menuContainer}>
            <MenuItem id="analytics" icon="📊" text="الإحصائيات الفورية" active={activeTab} onClick={setActiveTab} />
            <MenuItem id="pos" icon="🏪" text="إدارة الفروع" active={activeTab} onClick={setActiveTab} />
            <MenuItem id="themes" icon="🎨" text="متجر الثيمات" active={activeTab} onClick={setActiveTab} />
            <MenuItem id="admins" icon="👥" text="الرقابة والموظفين" active={activeTab} onClick={setActiveTab} />
            <MenuItem id="logs" icon="🔒" text="سجل النظام" active={activeTab} onClick={setActiveTab} />
            <MenuItem id="links" icon="🔗" text="مراقبة الروابط" active={activeTab} onClick={setActiveTab} />
            <MenuItem id="financial" icon="💰" text="الدفتر المالي" active={activeTab} onClick={setActiveTab} />
          </div>

          <button onClick={handleLogout} style={logoutBtn}>تسجيل الخروج</button>
        </div>
      </div>

      {/* منطقة المحتوى الرئيسية */}
      <main style={mainContent}>
        {/* الشريط العلوي المصغر */}
        <header style={topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={hamburgerBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 style={{ margin: 0, color: '#333', fontSize: '14px', fontWeight: 'bold' }}>لوحة الإدارة الكبرى</h2>
          </div>
          
          {/* اسمك يظهر بالهيدر */}
          <div style={userInfo}>
            <span style={{ fontSize: '13px', color: '#666' }}>المدير العام:</span>
            <span style={{ fontSize: '14px', color: '#ff4d4d', fontWeight: 'bold' }}>حسين ايهاب نعيم</span>
          </div>
        </header>
        
        {/* مساحة العمل */}
        <div style={contentArea}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// مكون فرعي مصغر لأزرار القائمة الجانبية
const MenuItem = ({ id, icon, text, active, onClick }: any) => {
  const isActive = active === id;
  return (
    <div 
      onClick={() => onClick(id)}
      style={{
        padding: '10px 15px',
        margin: '4px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: isActive ? '#fff5f7' : 'transparent',
        color: isActive ? '#ff4d4d' : '#444',
        fontWeight: isActive ? '600' : '500',
        borderRight: isActive ? '3px solid #ff4d4d' : '3px solid transparent',
        transition: 'all 0.15s ease'
      }}
    >
      <span style={{ fontSize: '15px' }}>{icon}</span>
      <span style={{ fontSize: '13px' }}>{text}</span>
    </div>
  );
};

// --- الستايلات (أحجام الداشبورد الاحترافي) ---

// ستايل شاشة الترحيب (الفخمة)
const welcomeContainer: React.CSSProperties = { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fff', direction: 'rtl', fontFamily: 'sans-serif', textAlign: 'center' };
const crownIcon: React.CSSProperties = { fontSize: '45px', marginBottom: '15px', filter: 'drop-shadow(0 4px 6px rgba(255, 105, 180, 0.2))' };

// ستايل اللوحة الأساسية (Flex Row حتى تدفع المحتوى)
const layout: React.CSSProperties = { display: 'flex', height: '100vh', background: '#f8f9fa', direction: 'rtl', fontFamily: 'sans-serif', overflow: 'hidden' };

// القائمة الجانبية (أصبحت Transition للـ Width)
const sidebar: React.CSSProperties = { background: '#fff', borderLeft: '1px solid #ffeaee', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 10 };
const sidebarInner: React.CSSProperties = { width: '230px', height: '100%', display: 'flex', flexDirection: 'column' };
const sidebarHeader: React.CSSProperties = { height: '55px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #ffeaee' };
const menuContainer: React.CSSProperties = { flex: 1, overflowY: 'auto', paddingTop: '10px' };
const logoutBtn: React.CSSProperties = { margin: '15px', padding: '10px', background: '#fff', border: '1px solid #ffeaee', color: '#444', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'background 0.2s' };

// منطقة المحتوى الرئيسية
const mainContent: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }; // minWidth 0 لمنع الانهيار
const topBar: React.CSSProperties = { height: '55px', background: '#fff', borderBottom: '1px solid #ffeaee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', flexShrink: 0 };
const hamburgerBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', borderRadius: '6px' };
const userInfo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: '#fff5f7', borderRadius: '20px', border: '1px solid #ffe1e8' };

const contentArea: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '25px' };

// ستايل الأقسام (أحجام مصغرة للمحتوى)
const sectionStyle: React.CSSProperties = { background: '#fff', padding: '20px 25px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' };
const sectionTitle: React.CSSProperties = { color: '#111', fontSize: '16px', margin: '0 0 5px 0' };
const sectionDesc: React.CSSProperties = { color: '#777', fontSize: '13px', margin: 0 };