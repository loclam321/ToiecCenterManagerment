import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './css/Footer.css';

function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Hiển thị nút scroll to top khi cuộn xuống
  useEffect(() => {
    const checkScrollPosition = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', checkScrollPosition);
    return () => window.removeEventListener('scroll', checkScrollPosition);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <footer className="footer">
      {/* CTA Section - Main Footer Content */}
      <div className="footer-cta-section">
        <div className="container">
          <div className="footer-cta-content">
            <h2 className="footer-cta-title">Sẵn Sàng Bắt Đầu Hành Trình TOEIC?</h2>
            <p className="footer-cta-subtitle">
              Đăng ký ngay để được học với đội ngũ giáo viên uy tín và giàu kinh nghiệm
            </p>
            <div className="footer-cta-buttons">
              <button className="btn-primary-footer">Đăng Ký Ngay</button>
              <button className="btn-secondary-footer">Tư Vấn Miễn Phí</button>
            </div>
            
            {/* Company Info */}
            <div className="footer-company-info">
              <p className="copyright-text">© {new Date().getFullYear()} Trung tâm TOEIC. All rights reserved.</p>
              <p className="company-info">Công ty TNHH Giáo dục và Đào tạo TOEIC</p>
              <p className="company-address">123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh | Email: info@toeic-center.com | Hotline: 0123 456 789</p>
            </div>
          </div>
        </div>
      </div>

      {/* URL Bar */}
      <div className="footer-url">
        <span>toeic-center.com</span>
      </div>

      {/* Floating Buttons */}
      <div className="floating-buttons">
        <button className="btn-refresh" onClick={refreshPage}>↻</button>
        {showScrollTop && <button className="btn-scroll-top" onClick={scrollToTop}>↑</button>}
      </div>
    </footer>
  );
}

export default Footer;