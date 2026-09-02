import React, { useEffect, useState, Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useSearchParams } from 'react-router-dom';
import { supabase } from './supabase';
import { FaHome, FaInstagram, FaTiktok, FaExclamationTriangle } from 'react-icons/fa'; 

// System Views
const POS = lazy(() => import('./pages/pos/POS'));
const Login = lazy(() => import('./pages/Login'));
const Viewer = lazy(() => import('./pages/Viewer'));
const ThemePreview = lazy(() => import('./pages/ThemePreview'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin/SuperAdmin'));

// Public Views
const Navbar = lazy(() => import('./pages/oomniah/Navbar')); 
const Home = lazy(() => import('./pages/oomniah/Home'));
const Footer = lazy(() => import('./pages/oomniah/Footer')); 
const PrivacyPolicy = lazy(() => import('./pages/oomniah/PrivacyPolicy')); 
const Terms = lazy(() => import('./pages/oomniah/Terms')); 
const Certificate = lazy(() => import('./pages/oomniah/Certificate'));

const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
    <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #dc2626', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// App Boundaries
const PortalBoundary = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const sysMode = localStorage.getItem('_sys_pref_mode');
  const accessRef = import.meta.env.VITE_PORTAL_KEY;

  if (token === accessRef) {
    localStorage.setItem('_sys_pref_mode', 'active');
    return <>{children}</>;
  }

  if (sysMode === 'active') {
    return <>{children}</>;
  }

  return <ErrorPage />;
};

const RequireSuperAdmin = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsAuthenticated(false); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      setIsAuthenticated(profile?.role === 'super_admin');
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return <PageLoader />; 
  if (isAuthenticated === false) return <Navigate to="/secure-portal-access" replace />; 
  return <>{children}</>; 
};

const RequirePageAdmin = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsAuthenticated(false); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      setIsAuthenticated(profile?.role === 'page_admin' || profile?.role === 'super_admin');
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return <PageLoader />; 
  if (isAuthenticated === false) return <Navigate to="/secure-portal-access" replace />; 
  return <>{children}</>; 
};

const PublicLayout = () => {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar /> 
      <main style={{ marginTop: '130px', flexGrow: 1 }}>
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
          </Route>

          <Route path="/certificate/:handle" element={<Certificate />} />

          <Route 
            path="/secure-portal-access" 
            element={
              <PortalBoundary>
                <Login />
              </PortalBoundary>
            } 
          />
          
          <Route path="/master-dashboard" element={<RequireSuperAdmin><SuperAdmin /></RequireSuperAdmin>} />
          <Route path="/branch/:slug" element={<RequirePageAdmin><POS /></RequirePageAdmin>} /> 
          <Route path="/:themeSlug/:shortId" element={<Viewer />} />        
          <Route path="/preview/:themeSlug" element={<ThemePreview />} />
          
          <Route path="*" element={<ErrorPage />} />
          
        </Routes>
      </Suspense>
    </Router>
  );
}

function ErrorPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', fontFamily: 'Tajawal, system-ui, -apple-system, sans-serif', padding: '20px', textAlign: 'center', direction: 'rtl' }}>
      
      <style>{`
        .social-btn { transition: all 0.3s ease; }
        .social-btn:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .home-btn { transition: all 0.3s ease; }
        .home-btn:hover { background: #b91c1c !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4) !important; }
      `}</style>

      <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', maxWidth: '420px', width: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '80px', height: '80px', marginBottom: '20px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        
        <h2 style={{ color: '#dc2626', fontSize: '24px', marginBottom: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaExclamationTriangle /> عذراً، الصفحة غير موجودة
        </h2>
        
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
          يبدو أن الرابط الذي تحاول الوصول إليه غير صحيح أو تم حذفه. تأكد من نسخ الرابط بشكل كامل.
        </p>
        
        <Link to="/" className="home-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#dc2626', color: '#ffffff', textDecoration: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)', width: '100%', boxSizing: 'border-box', marginBottom: '25px' }}>
          <FaHome /> العودة للموقع الرسمي
        </Link>

        <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px', fontWeight: 'bold' }}>أو تواصل معنا عبر حساباتنا الرسمية:</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <a href="https://www.instagram.com/oomnia.1/" target="_blank" rel="noreferrer" className="social-btn" style={{ background: '#fef2f2', color: '#dc2626', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', textDecoration: 'none' }}>
              <FaInstagram />
            </a>
            <a href="https://www.tiktok.com/@oomnia.1" target="_blank" rel="noreferrer" className="social-btn" style={{ background: '#f8fafc', color: '#0f172a', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', textDecoration: 'none' }}>
              <FaTiktok />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}