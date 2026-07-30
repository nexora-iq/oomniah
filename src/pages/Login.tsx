import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Toast } from '../toast'; 
import { FaEnvelope, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError || !data.user) {
      Toast.fire({ icon: 'error', title: 'بيانات الدخول غير صحيحة' });
      setLoading(false);
      return;
    } 
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, fullname, page_id, pages(name, slug)')
      .eq('id', data.user.id)
      .single();
      
    if (profileError || !profile) {
      Toast.fire({ icon: 'warning', title: 'حسابك غير مكتمل الإعداد في النظام.' });
      setLoading(false);
      return;
    }

    const resProfile = profile as any;
    const exactEmpName = resProfile.fullname || resProfile.full_name || 'موظف مجهول';

    let exactPageName = 'الإدارة المركزية';
    if (resProfile.role !== 'super_admin' && resProfile.pages) {
      exactPageName = Array.isArray(resProfile.pages) 
                    ? resProfile.pages[0]?.name 
                    : resProfile.pages?.name;
    }

    await supabase.from('system_logs').insert([{
      admin_name: exactEmpName,
      pos_name: exactPageName || 'فرع مجهول',
      action_type: 'تسجيل دخول',
      details: `قام (${exactEmpName}) بتسجيل الدخول بنجاح إلى (${exactPageName || 'النظام'})`
    }]);

    Toast.fire({ icon: 'success', title: `أهلاً بك، ${exactEmpName}` });

    setTimeout(() => {
      if (resProfile.role === 'super_admin') {
        navigate('/master-dashboard');
      } else {
        if (resProfile.pages) {
          const slug = Array.isArray(resProfile.pages) 
                       ? resProfile.pages[0]?.slug 
                       : resProfile.pages?.slug;
          if (slug) {
            navigate(`/branch/${slug}`);
          } else {
            Toast.fire({ icon: 'error', title: 'لم يتم العثور على الرابط المخصص للفرع الخاص بك.' });
          }
        } else {
          Toast.fire({ icon: 'error', title: 'حسابك غير مربوط بأي فرع حالياً.' });
        }
      }
    }, 1200);
    
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top right, #fef2f2 0%, #fff 50%, #f1f5f9 100%);
          direction: rtl;
          font-family: Tajawal, system-ui, -apple-system, sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .login-wrapper::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: rgba(239, 68, 68, 0.08);
          border-radius: 50%;
          top: -50px;
          right: -50px;
          filter: blur(60px);
        }

        .login-card {
          position: relative;
          z-index: 10;
          background: #ffffff;
          padding: 45px 35px;
          border-radius: 28px;
          border: 1px solid #f1f5f9;
          text-align: center;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.08);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-container {
          width: 90px;
          height: 90px;
          margin: 0 auto 15px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff5f5;
          border-radius: 22px;
          padding: 12px;
          border: 1px solid #fee2e2;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .input-group {
          position: relative;
          width: 100%;
          margin-bottom: 18px;
        }

        .input-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .input-style {
          width: 100%;
          padding: 16px 48px 16px 16px;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.25s ease;
          background: #f8fafc;
          color: #0f172a;
          font-weight: 500;
        }

        .input-style:focus {
          border-color: #ef4444;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .input-group:focus-within .input-icon {
          color: #ef4444;
        }

        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          padding: 16px;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 10px 20px -5px rgba(220, 38, 38, 0.35);
          margin-top: 10px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 24px -5px rgba(220, 38, 38, 0.45);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="login-card">
        {/* اللوغو */}
       {/* اللوغو */}
        <div className="logo-container">
          <img 
            src="/oomniah-logo.png" 
            alt="شعار أمنية" 
            className="logo-img"
            onError={(e) => { 
              e.currentTarget.style.display = 'none'; 
              console.log("خطأ في تحميل الشعار، تأكد من وجود صورة oomniah-logo.png في مجلد public"); 
            }}
          />
        </div>

        <h2 style={{ color: '#0f172a', marginBottom: '4px', fontSize: '26px', fontWeight: '900' }}>
          أُمنيــــة
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', fontWeight: '600' }}>
          بوابة إدارة المنصة
        </p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              autoComplete="username"
              className="input-style" 
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              autoComplete="current-password"
              className="input-style" 
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <><FaSpinner className="spin" /> جاري التحقق...</>
            ) : (
              <><FaSignInAlt /> تسجيل الدخول</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}