import React from 'react';
import { FaShoppingCart, FaQrcode, FaCheckCircle, FaTimes, FaCheck, FaMoneyBillWave, FaInfinity, FaCreditCard } from 'react-icons/fa';

export default function PricingSteps() {
  return (
    <>
      {/* 6. كيفية الشراء */}
      <section id="how-to-buy-section" style={{ padding: '60px 5% 20px', background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', color: '#dc2626', fontWeight: '900', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          كيفية الشراء <FaShoppingCart style={{ color: '#dc2626' }} />
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {[
            { step: '1', title: 'اختر الثيم', desc: 'تصفح قسم الثيمات واختر التصميم اللي يعبر عن مشاعرك.' },
            { step: '2', title: 'تواصل معنا', desc: 'إذا كنت تريد أن تعاملك معنا مباشرة فتواصل عبر حساباتنا الرسمية. أو إذا اشتريت عبر وكلائنا فيكون تعاملك معهم مباشرة.' },
            { step: '3', title: 'استلم هديتك', desc: 'استلم الرابط خلال نصف ساعة فقط من الدفع! (في أوقات الصيانة خلال 24 ساعة).' }
          ].map((item, index) => (
            <div key={index} style={{ textAlign: 'center', padding: '25px 15px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '50px', height: '50px', background: '#dc2626', color: '#fff', fontSize: '24px', fontWeight: 'bold', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>{item.step}</div>
              <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. الأسعار والباقات */}
      <section id="pricing-section" style={{ padding: '20px 5% 60px', background: '#f8fafc' }}>
        
        {/* باقة الباركود */}
        <div style={{ maxWidth: '800px', margin: '0 auto 40px', background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', borderRadius: '20px', border: '2px solid #fecaca', padding: '30px', boxShadow: '0 10px 30px rgba(220, 38, 38, 0.1)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', color: '#dc2626', fontWeight: '900', margin: '0 0 10px' }}>
              <FaQrcode /> ترقية الباركود المميز
            </h3>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', margin: '0 0 15px' }}>
              اجعل هديتك أكثر تميزاً! يمكنك إضافة "بطاقة الإهداء الرقمية" لأي باقة تختارها. استلم باركود مخصص بلونك المفضل مع إيموجي أو حرف يزين منتصف الباركود، جاهز للإرسال والمشاركة فوراً.
            </p>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheckCircle /> تخصيص اللون</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheckCircle /> إضافة إيموجي أو حرف</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheckCircle /> تصميم بطاقة إهداء</span>
            </div>
          </div>
          <div style={{ flex: '0 0 auto', background: '#fff', border: '1px solid #fecaca', borderRadius: '15px', padding: '20px', textAlign: 'center', minWidth: '150px' }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>تُضاف على أي باقة بـ</div>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900' }}>3,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
          </div>
        </div>

        {/* الباقات كاملة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>الباقة اليومية</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: يوم واحد</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>5,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> بدون دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>

          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>الباقة الأسبوعية</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: أسبوع كامل</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>10,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>

          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>الباقة الشهرية</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: شهر كامل</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>15,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>

          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>باقة الشهرين</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>المدة: شهرين</p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>19,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>

          <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #0ea5e9', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.1)' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>باقة 3 شهور</h3>
            <p style={{ color: '#0ea5e9', fontSize: '14px', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>الأكثر توفيراً <FaMoneyBillWave /></p>
            <div style={{ fontSize: '28px', color: '#dc2626', fontWeight: '900', marginBottom: '20px' }}>24,000<span style={{ fontSize: '14px', color: '#94a3b8' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#475569', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes style={{color: '#ef4444'}}/> تغيير المعلومات بعد التسليم</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إضافة رسالة صوتية بدال الأغنية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> دعم فني سريع</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#10b981'}}/> إمكانية تمديد الرابط لاحقاً</li>
            </ul>
          </div>

          <div style={{ background: '#dc2626', padding: '30px 20px', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '5px' }}>الباقة الدائمية</h3>
            <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>مدة الرابط: دائمي <FaInfinity /></p>
            <div style={{ fontSize: '24px', color: '#fff', fontWeight: '900', marginBottom: '20px' }}>50,000<span style={{ fontSize: '14px', color: '#fecaca' }}> د.ع</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#fef2f2', fontSize: '14px', lineHeight: '2', textAlign: 'right' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> نفس مميزات الباقات السابقة</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> تغيير المعلومات بأي وقت (بـ 5 آلاف فقط)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> إضافة رسالة صوتية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{color: '#fef2f2'}}/> دعم فني سريع</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="payment-section" style={{ padding: '60px 5%', background: '#ffffff', textAlign: 'center', borderTop: '2px solid #f1f5f9' }}>
        <h2 style={{ fontSize: '32px', color: '#1e293b', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          طرق الدفع المتوفرة <FaCreditCard style={{ color: '#1e293b' }} />
        </h2>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px' }}>ندعم أشهر وسائل الدفع في العراق عبر بيجاتنا المعتمدة وتكون طرق الدفع مختلفة من بيج الى اخر.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '18px' }}>زين كاش</div>
          <div style={{ padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0ea5e9', fontSize: '18px' }}>ماستر كارد (Qi)</div>
          <div style={{ padding: '15px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>تحويل رصيد اسيا</div>
        </div>
      </section>
    </>
  );
}