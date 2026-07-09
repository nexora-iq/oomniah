import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';

// استيراد الصفحات الأساسية
import POS from './pages/POS';
import Login from './pages/Login';
import Viewer from './pages/Viewer';
import SuperAdmin from './pages/SuperAdmin/SuperAdmin';

// 🛡️ مكون حماية السوبر أدمن (للصلاحيات الكاملة)
const RequireSuperAdmin = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      setIsAuthenticated(profile?.role === 'super_admin');
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return <div style={{ height: '100vh', background: '#000' }}></div>; 
  if (isAuthenticated === false) return <Navigate to="/secure-portal-access" replace />; 
  
  return <>{children}</>; 
};

// 🛡️ مكون حماية أدمن نقطة البيع
const RequirePosAdmin = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      setIsAuthenticated(profile?.role === 'pos_admin' || profile?.role === 'super_admin');
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return <div style={{ height: '100vh', background: '#000' }}></div>; 
  if (isAuthenticated === false) return <Navigate to="/secure-portal-access" replace />; 
  
  return <>{children}</>; 
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🔒 صفحة الدخول المخفية */}
        <Route path="/secure-portal-access" element={<Login />} />
        
        {/* 👑 لوحة التحكم الكبرى (السوبر أدمن) */}
        <Route 
          path="/master-dashboard" 
          element={
            <RequireSuperAdmin>
              <SuperAdmin />
            </RequireSuperAdmin>
          } 
        />

        {/* 🏪 لوحة نقطة البيع للموظفين (تم حمايتها بـ /branch/ لمنع كشف صفحة الدخول) */}
        <Route path="/branch/:slug" element={<POS />} /> 

        {/* 🎁 عرض الهدية للزبون */}
        <Route path="/:themeSlug/:shortId" element={<Viewer />} />
        
        {/* 🚫 مسار الأخطاء (أي رابط عشوائي أو خاطئ سيأتي إلى هنا مباشرة) */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

function ErrorPage() {
  const INSTAGRAM_URL = "https://www.instagram.com/link.love1?igsh=dDRjd2d3MTN1dm92";

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#ffeef2', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', padding: '20px', textAlign: 'center', direction: 'rtl' }}>
      <div style={{ 
        background: '#ffffff', padding: '40px 30px', borderRadius: '24px', 
        boxShadow: '0 15px 35px rgba(255, 143, 163, 0.2)', maxWidth: '400px', width: '100%', border: '2px solid #ffccd5' 
      }}>
        <div style={{ fontSize: '60px', marginBottom: '15px' }}>💔</div>
        <h2 style={{ color: '#ff477e', fontSize: '24px', marginBottom: '10px', fontWeight: '900' }}>الرابط غير صحيح</h2>
        <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
          عذراً، لا يمكننا العثور على هذه الصفحة أو الهدية. تأكد من نسخ الرابط بشكل كامل.
        </p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          color: '#ffffff', textDecoration: 'none', padding: '12px 25px', borderRadius: '50px',
          fontWeight: 'bold', fontSize: '15px', boxShadow: '0 5px 15px rgba(220, 39, 67, 0.3)'
        }}>
          ابتكر هديتك الخاصة 🎁
        </a>
      </div>
    </div>
  );
}