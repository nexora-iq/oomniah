import { Link } from 'react-router-dom';
import React, { useEffect } from 'react';

export default function Terms() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // هذا اللي راح يخليها تصعد بأنيميشن ناعم
    });
  }, []);
  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', padding: '130px 5% 80px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>⚖️</div>
          <h1 style={{ color: '#dc2626', fontSize: '36px', fontWeight: '900', margin: '0 0 10px 0' }}>شروط الاستخدام</h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>يرجى قراءة الشروط والأحكام بعناية قبل إتمام عملية الشراء.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #dc2626', paddingRight: '10px', marginBottom: '15px' }}>
              1. البيجات والوكلاء المعتمدون
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              يتم بيع الثيمات والهدايا الرقمية حصرياً عبر صفحاتنا الرسمية أو وكلائنا المعتمدين المدرجين في قسم "البيجات المعتمدة" على الموقع. المنصة غير مسؤولة عن أي عمليات احتيال تتم عبر صفحات تدعي تمثيلنا وغير مدرجة في نظامنا.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #dc2626', paddingRight: '10px', marginBottom: '15px' }}>
              2. التسليم والتنفيذ
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              نلتزم بتسليم الرابط السري للهدية خلال مدة أقصاها (نصف ساعة) من وقت تأكيد الدفع واستلام التفاصيل. في حالات الصيانة الاستثنائية للموقع، قد يمتد وقت التسليم كحد أقصى إلى 24 ساعة.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #dc2626', paddingRight: '10px', marginBottom: '15px' }}>
              3. التعديل على الهدايا
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              لا يسمح بتغيير المعلومات (الأسماء، الصور، الرسائل) بعد إتمام الشراء وتسليم الرابط في جميع الباقات المحددة بمدة (يومي، أسبوعي، الخ). يُستثنى من ذلك <strong>الباقة الدائمية</strong> التي تتيح إمكانية التعديل في أي وقت مقابل أجور رمزية قدرها (5,000 دينار عراقي).
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #dc2626', paddingRight: '10px', marginBottom: '15px' }}>
              4. الاسترجاع والإلغاء
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              نظراً لطبيعة المنتج الرقمية والجهد المبذول في تجهيزه فوراً، فإن المبالغ المدفوعة غير قابلة للاسترداد بعد أن يتم إرسال الرابط السري للزبون.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: 'bold', borderRight: '4px solid #dc2626', paddingRight: '10px', marginBottom: '15px' }}>
              5. تمديد صلاحية الرابط
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px', margin: 0 }}>
              في حال انتهاء صلاحية الباقة التي قمت بشرائها، يمكنك تمديد الرابط لنفس الهدية لأي مدة إضافية عن طريق دفع سعر المدة المطلوبة فقط دون الحاجة لإنشاء الهدية من جديد، وذلك بشرط طلب التمديد قبل الحذف النهائي من السيرفر.
            </p>
          </section>

        </div>

        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <Link to="/" style={{ display: 'inline-block', background: '#f1f5f9', color: '#1e293b', textDecoration: 'none', padding: '12px 30px', borderRadius: '10px', fontWeight: 'bold', border: '1px solid #cbd5e1', transition: '0.3s' }}>
            العودة للرئيسية 🏠
          </Link>
        </div>

      </div>
    </div>
  );
}