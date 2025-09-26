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
      {/* Copyright Section */}
      <div className="footer-copyright">
        <p className="copyright-text">© {new Date().getFullYear()} Trung tâm TOEIC. All rights reserved.</p>
        <p className="company-info">Công ty TNHH Giáo dục và Đào tạo TOEIC</p>
        <p className="company-address">123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh | Email: info@toeic-center.com | Hotline: 0123 456 789</p>
      </div>

      {/* CTA Section */}
      <div className="footer-cta">
        <button className="btn-test">
          <span>THI THỬ MIỄN PHÍ</span>
          <div className="btn-icon">T</div>
        </button>
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