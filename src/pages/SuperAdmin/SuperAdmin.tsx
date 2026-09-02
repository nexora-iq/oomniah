import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../../toast'; // 🔔 استدعاء الإشعارات

// 🖼️ استدعاء الشعار بالطريقة الصحيحة من مجلد assets
import logoImg from '../../assets/oomniah-logo.png'; 

// استيراد الأقسام الحقيقية
import POSManagement from './POSManagement';
import ThemesControl from './ThemesControl';
import AdminsControl from './AdminsControl';
import SystemLogs from './SystemLogs';
import LinksMaster from './LinksMaster';
import FinancialWallet from './FinancialWallet';
import LiveAnalytics from './LiveAnalytics';
import SiteSettings from './SiteSettings';

export default function SuperAdmin() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  
  const [activeTab, setActiveTab] = useState('analytics');
  // 🚀 السر هنا: نحفظ الأقسام اللي انفتحت حتى ما نعيد تحميلها (Caching)
  const [mountedTabs, setMountedTabs] = useState<string[]>(['analytics']);
  
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // ⏳ خلينا وقت الشاشة الملكية 4 ثواني حتى تكتمل حركتها
    const timer = setTimeout(() => {
      setShowWelcome(false);
      Toast.fire({ icon: 'success', title: 'أهلاً بك في منصة أمنية 👑' });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.from('system_logs').insert([{
      admin_name: 'حسين ايهاب نعيم',
      pos_name: 'لوحة التحكم الكبرى',
      action_type: 'تسجيل خروج',
      details: `قام السوبر أدمن بتسجيل الخروج من النظام`
    }]);

    await supabase.auth.signOut();
    Toast.fire({ icon: 'success', title: 'في أمان الله يالمدير 👋' });
    navigate('/secure-portal-access');
  };

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (!mountedTabs.includes(id)) {
      setMountedTabs([...mountedTabs, id]);
    }
    if (isMobile) setIsSidebarOpen(false);
  };

  // 👑 شاشة الدخول الملكية (أحمر وأبيض فقط)
  if (showWelcome) {
    return (
      <div className="royal-splash">
        <style>
          {`
            .royal-splash {
              position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
              background: #ffffff; display: flex; flex-direction: column;
              justify-content: center; align-items: center; z-index: 99999;
              overflow: hidden; direction: rtl; font-family: system-ui, sans-serif;
            }
            
            .splash-container {
              display: flex; flex-direction: column; align-items: center;
              animation: splashFadeOut 0.8s ease-in-out 3.2s forwards;
            }

            .royal-logo {
              width: 130px; height: 130px; object-fit: contain;
              opacity: 0; transform: scale(0.5);
              animation: royalReveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
              filter: drop-shadow(0 15px 35px rgba(220, 38, 38, 0.5));
              margin-bottom: 20px;
            }

            .royal-name {
              color: #dc2626; font-size: 46px; font-weight: 900; margin: 0;
              opacity: 0; transform: translateY(20px);
              animation: fadeUpText 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
              letter-spacing: -1.5px;
            }

            .royal-line {
              width: 0; height: 4px; background: #dc2626; margin: 25px 0;
              border-radius: 4px;
              box-shadow: 0 0 20px rgba(220, 38, 38, 0.6);
              animation: expandRoyalLine 1s cubic-bezier(0.8, 0, 0.2, 1) 1.2s forwards;
            }

            .royal-role {
              color: #ef4444; font-size: 18px; font-weight: 900; letter-spacing: 5px;
              opacity: 0; text-transform: uppercase;
              animation: trackingInRoyal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 1.6s forwards;
            }

            @keyframes royalReveal {
              0% { opacity: 0; transform: scale(0.8) translateY(30px); filter: blur(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
            }
            @keyframes fadeUpText {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes expandRoyalLine {
              0% { width: 0; opacity: 0; }
              100% { width: 180px; opacity: 1; }
            }
            @keyframes trackingInRoyal {
              0% { opacity: 0; letter-spacing: -2px; }
              100% { opacity: 1; letter-spacing: 5px; }
            }
            @keyframes splashFadeOut {
              0% { opacity: 1; transform: scale(1); filter: blur(0); }
              100% { opacity: 0; transform: scale(1.1); filter: blur(15px); }
            }
          `}
        </style>
        
        <div className="splash-container">
          <img src={logoImg} alt="أمنية" className="royal-logo" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <h1 className="royal-name">حسين ايهاب نعيم</h1>
          <div className="royal-line"></div>
          <div className="royal-role">المدير</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <style>
        {`
          .admin-layout { display: flex; height: 100vh; background: #f8fafc; direction: rtl; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
          
          .sidebar { 
            background: #fff; 
            border-left: 1px solid #e2e8f0; 
            display: flex; 
            flex-direction: column; 
            transition: width 0.3s ease, transform 0.3s ease; 
            z-index: 50; 
            overflow: hidden; 
            white-space: nowrap; 
          }
          
          @media (min-width: 768px) {
            .sidebar { width: 260px; transform: translateX(0); position: relative; }
            .sidebar.closed { width: 0; border: none; padding: 0; }
            .mobile-overlay { display: none; }
          }
          
          @media (max-width: 767px) {
            .sidebar { position: fixed; top: 0; right: 0; height: 100%; width: 260px; transform: translateX(100%); box-shadow: -5px 0 25px rgba(0,0,0,0.1); }
            .sidebar.open { transform: translateX(0); }
            .content-area { padding: 15px !important; }
            .header-title { font-size: 13px !important; }
            .user-info span { display: none; }
            .user-info { padding: 5px !important; border: none !important; background: transparent !important; }
          }
          
          .mobile-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 40; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
          .mobile-overlay.active { opacity: 1; visibility: visible; }
          
          .menu-item { padding: 12px 18px; margin: 6px 15px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.2s ease; border-right: 4px solid transparent; font-weight: 600; color: #475569; }
          .menu-item:hover { background: #f1f5f9; }
          .menu-item.active { background: #fef2f2; color: #dc2626; border-right-color: #dc2626; }
          .menu-icon { font-size: 18px; }
          
          .scrollable::-webkit-scrollbar { width: 6px; }
          .scrollable::-webkit-scrollbar-track { background: transparent; }
          .scrollable::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        `}
      </style>

      {isMobile && (
        <div className={`mobile-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${isSidebarOpen ? (isMobile ? 'open' : '') : 'closed'}`}>
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 25px', borderBottom: '1px solid #e2e8f0', gap: '10px', minWidth: '260px' }}>
          <img src={logoImg} alt="أمنية" style={{ width: '35px', height: '35px' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <h2 style={{ margin: 0, fontSize: '22px', color: '#dc2626', fontWeight: '900', letterSpacing: '-0.5px' }}>أمنية</h2>
        </div>
        
        <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '15px 0', minWidth: '260px' }}>
          <div className={`menu-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleTabClick('analytics')}>
            <span className="menu-icon">📊</span><span>لوحة القيادة</span>
          </div>
          <div className={`menu-item ${activeTab === 'financial' ? 'active' : ''}`} onClick={() => handleTabClick('financial')}>
            <span className="menu-icon">💰</span><span>الخزينة والمالية</span>
          </div>
          <div className={`menu-item ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => handleTabClick('pos')}>
            <span className="menu-icon">🏢</span><span>توسعة الفروع (SaaS)</span>
          </div>
          <div className={`menu-item ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => handleTabClick('admins')}>
            <span className="menu-icon">👥</span><span>إدارة فريق العمل</span>
          </div>
          <div className={`menu-item ${activeTab === 'links' ? 'active' : ''}`} onClick={() => handleTabClick('links')}>
            <span className="menu-icon">🔗</span><span>سجل الروابط الشامل</span>
          </div>
          <div className={`menu-item ${activeTab === 'themes' ? 'active' : ''}`} onClick={() => handleTabClick('themes')}>
            <span className="menu-icon">🎨</span><span>متجر الثيمات</span>
          </div>
          <div className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => handleTabClick('logs')}>
            <span className="menu-icon">🛡️</span><span>سجل الرقابة الأمني</span>
          </div>
          <div className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabClick('settings')}>
  <span className="menu-icon">⚙️</span><span>إعدادات الواجهة</span>
</div>
        </div>

        <div style={{ minWidth: '260px' }}>
          <button onClick={handleLogout} style={{ width: 'calc(100% - 40px)', margin: '20px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s' }}>
            تسجيل الخروج 🚪
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        <header style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', borderRadius: '10px', color: '#334155' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="header-title" style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '800' }}>لوحة الإدارة الكبرى</h2>
          </div>
          
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fef2f2', borderRadius: '30px', border: '1px solid #fecaca' }}>
            <div style={{ width: '28px', height: '28px', background: '#dc2626', color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold' }}>ح</div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>المؤسس:</span>
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '900' }}>حسين ايهاب نعيم</span>
          </div>
        </header>
        
        {/* 🚀 السحر هنا: عرض جميع الأقسام وإخفاء غير النشط بدل إعادة التحميل */}
        <div className="content-area scrollable" style={{ flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' }}>
          {mountedTabs.includes('analytics') && <div style={{ display: activeTab === 'analytics' ? 'block' : 'none', height: '100%' }}><LiveAnalytics /></div>}
          {mountedTabs.includes('financial') && <div style={{ display: activeTab === 'financial' ? 'block' : 'none', height: '100%' }}><FinancialWallet /></div>}
          {mountedTabs.includes('pos') && <div style={{ display: activeTab === 'pos' ? 'block' : 'none', height: '100%' }}><POSManagement /></div>}
          {mountedTabs.includes('admins') && <div style={{ display: activeTab === 'admins' ? 'block' : 'none', height: '100%' }}><AdminsControl /></div>}
          {mountedTabs.includes('links') && <div style={{ display: activeTab === 'links' ? 'block' : 'none', height: '100%' }}><LinksMaster /></div>}
          {mountedTabs.includes('themes') && <div style={{ display: activeTab === 'themes' ? 'block' : 'none', height: '100%' }}><ThemesControl /></div>}
         {mountedTabs.includes('settings') && <div style={{ display: activeTab === 'settings' ? 'block' : 'none', height: '100%' }}><SiteSettings /></div>}
          {mountedTabs.includes('logs') && <div style={{ display: activeTab === 'logs' ? 'block' : 'none', height: '100%' }}><SystemLogs /></div>}
        </div>

      </main>
    </div>
  );
}