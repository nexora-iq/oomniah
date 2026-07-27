import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaInstagram, FaTiktok } from 'react-icons/fa'; // 🌟 أيقونات FontAwesome الأصلية

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          window.scrollTo({
            top: element.getBoundingClientRect().top + window.pageYOffset - 90,
            behavior: 'smooth',
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        window.scrollTo({
          top: element.getBoundingClientRect().top + window.pageYOffset - 90,
          behavior: 'smooth',
        });
      }
    }
  };

  const linkStyle = {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '15px',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'Tajawal, sans-serif',
    textDecoration: 'none',
    transition: 'color 0.2s ease, transform 0.2s ease',
    display: 'inline-block',
  };

  const socialIconStyle = {
    color: '#94a3b8',
    textDecoration: 'none',
    transition: 'color 0.2s ease, transform 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  };

  return (
    <>
      <style>{`
        /* تنسيقات الشبكة واللوغو لتناسب الموبايل والشاشات الكبيرة */
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 40px;
        }
        
        .footer-logo {
          width: 160px; /* لوغو چبير */
          height: auto;
          margin-bottom: 15px;
          object-fit: contain;
        }

        .hover-link:hover {
          color: #dc2626 !important;
          transform: translateX(-5px);
        }

        .social-hover-insta:hover {
          color: #e1306c !important;
          background: rgba(225, 48, 108, 0.1) !important;
          transform: translateY(-3px);
        }

        .social-hover-tiktok:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1) !important;
          transform: translateY(-3px);
        }

        /* 📱 للموبايل: تصغير العناصر وترتيبها */
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 25px;
          }
          .footer-brand-section {
            grid-column: 1 / -1;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .footer-logo {
            width: 130px;
          }
        }
      `}</style>

      <footer
        style={{
          background: '#0f172a',
          color: '#f8fafc',
          padding: '60px 5% 20px',
          fontFamily: 'Tajawal, sans-serif',
          direction: 'rtl',
          marginTop: 'auto',
        }}
      >
        <div className="footer-grid">
          
        <div className="footer-brand-section">
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
    <img 
      src="/oomniah-logo.png" 
      alt="أمنية" 
      style={{ width: '110px', height: '110px', objectFit: 'contain' }} 
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
    <h2 style={{ color: '#dc2626', fontSize: '42px', fontFamily: '"Aref Ruqaa", serif', fontWeight: '900', margin: 0, paddingTop: '10px' }}>
      أُمنيــــة
    </h2>
  </div>
  <p
    style={{
      color: '#94a3b8',
      lineHeight: '1.8',
      fontSize: '14px',
      marginBottom: '25px',
      maxWidth: '300px'
    }}
  >
    منصتكم الأولى لتوثيق أحلى أيامكم. اصنعوا هداياكم الرقمية التفاعلية
    وشاركوها مع من تحبون بكل سهولة وأمان.
  </p>
  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              
              {/* أيقونة انستغرام */}
              <a
                href="https://www.instagram.com/oomnia.1/"
                target="_blank"
                rel="noopener noreferrer"
                style={socialIconStyle}
                className="social-hover-insta"
                title="Instagram"
              >
                <FaInstagram size={24} />
              </a>

              {/* أيقونة تيك توك */}
              <a
                href="https://www.tiktok.com/@oomnia.1"
                target="_blank"
                rel="noopener noreferrer"
                style={socialIconStyle}
                className="social-hover-tiktok"
                title="TikTok"
              >
                <FaTiktok size={24} />
              </a>
            </div>
          </div>

          {/* عمود 2: أقسام الموقع */}
          <div>
            <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>
              تصفح المنصة
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li>
                <button onClick={() => scrollToSection('home-hero')} style={linkStyle} className="hover-link">
                  الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('themes-section')} style={linkStyle} className="hover-link">
                  الثيمات المتوفرة
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing-section')} style={linkStyle} className="hover-link">
                  الأسعار والباقات
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features-section')} style={linkStyle} className="hover-link">
                  مميزاتنا
                </button>
              </li>
            </ul>
          </div>

          {/* عمود 3: الدعم والوكالات */}
          <div>
            <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>
              الخدمات والدعم
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li>
                <button onClick={() => scrollToSection('verified-pages-section')} style={linkStyle} className="hover-link">
                  البيجات المعتمدة
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('payment-section')} style={linkStyle} className="hover-link">
                  طرق الدفع
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq-section')} style={linkStyle} className="hover-link">
                  الأسئلة الشائعة
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('join-us-section')} style={linkStyle} className="hover-link">
                  الانضمام والوكالات
                </button>
              </li>
            </ul>
          </div>

          {/* عمود 4: السياسات والشروط */}
          <div>
            <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>
              قانونية
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li>
                <Link to="/privacy-policy" style={linkStyle} className="hover-link">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" style={linkStyle} className="hover-link">
                  شروط الاستخدام
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* الحقوق */}
        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '25px', fontSize: '14px' }}>
          © {new Date().getFullYear()} منصة أمنية Oomniah. جميع الحقوق محفوظة.
        </div>
      </footer>
    </>
  );
}