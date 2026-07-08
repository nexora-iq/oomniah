import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. الدخول عبر سيرفرات Supabase (البيانات مشفرة ولا توجد كلمات سر في الكود)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError('بيانات الدخول غير صحيحة ❌');
      setLoading(false);
      return;
    } 
    
    if (data.user) {
      // 2. فحص الصلاحية (Role) من قاعدة البيانات
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, points_of_sale(slug)')
        .eq('id', data.user.id)
        .single();
        
      if (profileError || !profile) {
        setError('حسابك غير مكتمل الإعداد في النظام.');
        setLoading(false);
        return;
      }

      const resProfile = profile as any;

      // 3. التوجيه الذكي حسب الصلاحية
      if (resProfile.role === 'super_admin') {
        // إذا كان المدير (السوبر أدمن)
        navigate('/master-dashboard');
      } else {
        // إذا كان موظف مبيعات عادي
        if (resProfile.points_of_sale) {
          const pos = resProfile.points_of_sale;
          const slug = Array.isArray(pos) ? pos[0]?.slug : pos?.slug;
navigate(`/${slug}`);
        } else {
          setError('حسابك غير مربوط بنقطة بيع.');
          setLoading(false);
        }
      }
    }
  };

  return (
    <div style={loginContainer}>
      <div style={loginCard}>
        <div style={iconBox}>🔐</div>
        <h2 style={{ color: '#333', marginBottom: '5px' }}>دخول النظام</h2>
        <p style={{ color: '#ff69b4', fontSize: '14px', marginBottom: '25px', fontWeight: 'bold' }}>بوابة الوصول الآمنة</p>
        
        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="البريد الإلكتروني" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={inputStyle} 
          />
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={inputStyle} 
          />
          <button type="submit" disabled={loading} style={loginBtn}>
            {loading ? 'جاري التحقق...' : 'دخول النظام'}
          </button>
        </form>
      </div>
    </div>
  );
}

// الستايلات
const loginContainer: React.CSSProperties = { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff', direction: 'rtl', fontFamily: 'sans-serif', padding: '20px' };
const loginCard: React.CSSProperties = { background: '#fff', padding: '40px 30px', borderRadius: '30px', border: '2px solid #fff0f5', textAlign: 'center', width: '100%', maxWidth: '380px', boxShadow: '0 15px 35px rgba(255, 105, 180, 0.1)' };
const iconBox: React.CSSProperties = { width: '70px', height: '70px', background: '#fff5f7', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', fontSize: '30px', border: '2px solid #ff69b4' };
const inputStyle: React.CSSProperties = { padding: '14px', borderRadius: '12px', border: '1px solid #ffd1dc', fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const loginBtn: React.CSSProperties = { background: '#ff69b4', color: '#fff', padding: '15px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer' };
const errorStyle: React.CSSProperties = { background: '#fff0f0', color: '#ff0000', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', border: '1px solid #ffcccc' };