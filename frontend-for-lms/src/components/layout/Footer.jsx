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
    <footer className="footer bg-primary text-white py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 mb-4 mb-lg-0">
            <h5>Trung tâm TOEIC</h5>
            <p className="small mb-0">Đào tạo và luyện thi TOEIC chất lượng cao với đội ngũ giảng viên kinh nghiệm.</p>
          </div>
          <div className="col-lg-2 col-md-3 col-6 mb-4 mb-md-0">
            <h6>Liên kết</h6>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-white-50">Trang chủ</Link></li>
              <li><Link to="/courses" className="text-white-50">Khóa học</Link></li>
              <li><Link to="/exams" className="text-white-50">Đề thi</Link></li>
              <li><Link to="/about" className="text-white-50">Giới thiệu</Link></li>
            </ul>
          </div>
          <div className="col-lg-2 col-md-3 col-6 mb-4 mb-md-0">
            <h6>Hỗ trợ</h6>
            <ul className="list-unstyled">
              <li><Link to="/contact" className="text-white-50">Liên hệ</Link></li>
              <li><Link to="/faq" className="text-white-50">FAQ</Link></li>
              <li><Link to="/policy" className="text-white-50">Chính sách</Link></li>
            </ul>
          </div>
          <div className="col-lg-4">
            <h6>Liên hệ</h6>
            <p className="small mb-0">
              <i className="bi bi-geo-alt me-2"></i>123 Đường ABC, Quận XYZ, TP. HCM<br />
              <i className="bi bi-envelope me-2"></i>info@toeic-center.com<br />
              <i className="bi bi-telephone me-2"></i>0123 456 789
            </p>
          </div>
        </div>
        <hr className="my-3 bg-light" />
        <div className="text-center">
          <p className="small mb-0">&copy; {new Date().getFullYear()} Trung tâm TOEIC. All rights reserved.</p>
        </div>
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