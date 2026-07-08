import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';

// استيراد الصفحات الأساسية
import POS from './pages/POS';
import Login from './pages/Login';
import Viewer from './pages/Viewer';
import SuperAdmin from './pages/SuperAdmin/SuperAdmin';

// 🛡️ مكون حماية السوبر أدمن (الجدار الناري)
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/secure-portal-access" element={<Login />} />
        
        {/* التعديل صار هنا: شلنا كلمة pos المزعجة وصار الرابط مباشر باسم الفرع */}
        <Route path="/:slug" element={<POS />} /> 
        
        <Route 
          path="/master-dashboard" 
          element={
            <RequireSuperAdmin>
              <SuperAdmin />
            </RequireSuperAdmin>
          } 
        />
        
        <Route path="/:themeSlug/:shortId" element={<Viewer />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

function ErrorPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fff', color: '#ff69b4' }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎀</div>
      <h2 style={{ fontSize: '24px', fontFamily: 'sans-serif' }}>عذراً، الرابط غير صحيح 🌸</h2>
    </div>
  );
}