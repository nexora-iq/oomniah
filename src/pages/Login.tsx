import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Toast } from '../toast'; 
import { FaEnvelope, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa'; // 🌟 استدعاء الأيقونات

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. الدخول عبر سيرفرات Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError || !data.user) {
      Toast.fire({ icon: 'error', title: 'بيانات الدخول غير صحيحة' });
      setLoading(false);
      return;
    } 
    
    // 2. فحص الصلاحية مع جلب كلا الحقلين للاسم
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, fullname, page_id, pages(name, slug)')
      .eq('id', data.user.id)
      .single();
      
    if (profileError || !profile) {
      console.log(profileError); 
      Toast.fire({ icon: 'warning', title: 'حسابك غير مكتمل الإعداد في النظام.' });
      setLoading(false);
      return;
    }

    const resProfile = profile as any;
    
    // ⬇️ سحب الاسم الحقيقي بذكاء
    const exactEmpName = resProfile.fullname || resProfile.full_name || 'موظف مجهول';

    // 3. تحديد اسم الفرع الصحيح للسجل
    let exactPageName = 'الإدارة المركزية';
    if (resProfile.role !== 'super_admin' && resProfile.pages) {
      exactPageName = Array.isArray(resProfile.pages) 
                    ? resProfile.pages[0]?.name 
                    : resProfile.pages?.name;
    }

    // 4. توثيق تسجيل الدخول في السجل الأمني
    await supabase.from('system_logs').insert([{
      admin_name: exactEmpName,
      pos_name: exactPageName || 'فرع مجهول',
      action_type: 'تسجيل دخول',
      details: `قام (${exactEmpName}) بتسجيل الدخول بنجاح إلى (${exactPageName || 'النظام'})`
    }]);

    // عرض إشعار النجاح
    Toast.fire({ icon: 'success', title: `أهلاً بك، ${exactEmpName}` });

    // 5. التوجيه الذكي
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
    }, 1500);
    
    // إزالة اللودنك بعد التوجيه
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="login-container fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        
        .login-container { 
          height: 100vh; display: flex; justify-content: center; alignItems: center; 
          background: #f8fafc; direction: rtl; fontFamily: Tajawal, system-ui, -apple-system, sans-serif; padding: 20px; 
        }
        
        .login-card { 
          background: #fff; padding: 40px 30px; border-radius: 24px; border: 1px solid #e2e8f0; 
          text-align: center; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05); 
        }
        
        .input-group { position: relative; width: 100%; margin-bottom: 15px; }
        .input-icon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 16px; transition: 0.3s; }
        
        .input-style { 
          width: 100%; padding: 16px 16px 16px 45px; border-radius: 12px; border: 1px solid #cbd5e1; 
          font-size: 15px; outline: none; box-sizing: border-box; transition: all 0.3s; background: #f8fafc; color: #1e293b;
        }
        .input-style:focus { border-color: #dc2626; background: #fff; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .input-group:focus-within .input-icon { color: #dc2626; }
        
        .login-btn { 
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #ef4444; color: #fff; padding: 16px; border-radius: 12px; font-size: 18px; 
          font-weight: bold; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); 
        }
        .login-btn:hover:not(:disabled) { background: #dc2626; transform: translateY(-2px); }
        .login-btn:disabled { background: #fca5a5; cursor: not-allowed; box-shadow: none; }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="login-card">
        {/* شعار أمنية */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <img src="/oomniah-logo.png" alt="أمنية" style={{ width: '70px', height: '70px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>
        <h2 style={{ color: '#dc2626', marginBottom: '5px', fontSize: '28px', fontWeight: '900', fontFamily: '"Aref Ruqaa", serif' }}>أُمنيــــة</h2>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px', fontWeight: 'bold' }}>بوابة إدارة المنصة</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
          
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
              style={{ paddingRight: '45px', paddingLeft: '16px' }} // التأكيد على المسافة للأيقونة يميناً
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
              style={{ paddingRight: '45px', paddingLeft: '16px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn" style={{ marginTop: '5px' }}>
            {loading ? (
              <><FaSpinner className="spin" /> جاري التحقق...</>
            ) : (
              <><FaSignInAlt /> دخول النظام</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}