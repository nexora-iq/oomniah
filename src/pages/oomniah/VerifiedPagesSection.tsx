import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaGift, FaCheckCircle, FaExclamationTriangle, FaLink, FaCreditCard } from 'react-icons/fa';

export default function VerifiedPagesSection({ verifiedPages }: { verifiedPages: any[] }) {
  const [searchHandle, setSearchHandle] = useState('');
  const [verificationResult, setVerificationResult] = useState<null | 'verified' | 'not-found'>(null);

  const handleVerifyPage = () => {
    if (!searchHandle.trim()) {
      setVerificationResult(null);
      return;
    }
    const cleanSearch = searchHandle.trim().toLowerCase().replace('@', '');
    const found = verifiedPages.some(p => p.handle.toLowerCase().replace('@', '') === cleanSearch);
    setVerificationResult(found ? 'verified' : 'not-found');
  };

  return (
    <section id="verified-pages-section" style={{ padding: '80px 5%', background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          البيجات المعتمدة <FaShieldAlt style={{ color: '#dc2626' }} />
        </h2>
        
        <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', padding: '20px', borderRadius: '16px', border: '1px solid #fca5a5', marginBottom: '40px', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.05)' }}>
          <p style={{ color: '#b91c1c', fontSize: '16px', margin: 0, fontWeight: 'bold', lineHeight: '1.6' }}>
            أي بيج يبيع ثيماتنا وغير موجود في هذه القائمة هو غير تابع لنا (احتيال). 
            <br/> يرجى إبلاغنا عنه فوراً وسنقدم لك <span style={{ textDecoration: 'underline' }}>مكافأة</span>! <FaGift style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto 30px' }}>
          <input 
            type="text" 
            placeholder="اكتب اليوزر (مثال: oomnia.1)" 
            value={searchHandle}
            onChange={(e) => setSearchHandle(e.target.value)}
            style={{ flex: 1, padding: '14px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '16px', direction: 'ltr', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
          />
          <button onClick={handleVerifyPage} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0 25px', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)' }}>تحقق</button>
        </div>

        {verificationResult === 'verified' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', background: 'linear-gradient(135deg, #dcfce7 0%, #ffffff 100%)', color: '#15803d', padding: '25px', borderRadius: '16px', marginBottom: '40px', fontWeight: 'bold', border: '1px solid #bbf7d0', boxShadow: '0 10px 25px rgba(22, 163, 74, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}><FaCheckCircle style={{ fontSize: '28px' }} /> هذا الحساب معتمد ورسمي، يمكنك التعامل معه بأمان!</div>
            <Link to={`/certificate/${searchHandle.replace('@', '').toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#166534', color: '#fff', padding: '12px 25px', borderRadius: '12px', textDecoration: 'none', marginTop: '10px', fontSize: '15px', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.4)' }}><FaShieldAlt /> عرض شهادة الثقة الرسمية</Link>
          </div>
        )}
        {verificationResult === 'not-found' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '16px', marginBottom: '40px', fontWeight: 'bold', border: '1px solid #fecaca' }}><FaExclamationTriangle style={{ fontSize: '24px' }} /> هذا الحساب غير موجود في قائمة وكلائنا، احذر التعامل معه!</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', textAlign: 'right' }}>
          {verifiedPages.length > 0 ? verifiedPages.map(page => (
            <div key={page.id} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <div style={{ padding: '25px', zIndex: 1, flexGrow: 1 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: '0 0 5px' }}>{page.name} <FaCheckCircle style={{ color: '#0ea5e9', fontSize: '18px' }} title="موثوق" /></h3>
                <span style={{ fontSize: '14px', color: '#64748b', direction: 'ltr', display: 'inline-block', marginBottom: '15px' }}>@{page.handle}</span>
                {page.bio && <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: '1.6', margin: '0 0 20px 0' }}>{page.bio}</p>}
                
                {page.payment_methods && page.payment_methods.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>طرق الدفع:</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {page.payment_methods.map((pm: string, i: number) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', color: '#10b981', border: '1px solid #cbd5e1', fontSize: '12px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}><FaCreditCard /> {pm}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to={`/certificate/${page.handle}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', color: '#fff', padding: '14px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}><FaShieldAlt style={{ color: '#fbbf24' }} /> عرض شهادة الاعتماد</Link>
                {page.platforms && page.platforms.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {page.platforms.map((pl: any, idx: number) => (
                      <a key={idx} href={pl.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1, background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', textDecoration: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}><FaLink style={{ fontSize: '12px' }} /> {pl.platform}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )) : <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '40px 0', textAlign: 'center' }}>لا توجد بيجات معتمدة حالياً.</div>}
        </div>
      </div>
    </section>
  );
}