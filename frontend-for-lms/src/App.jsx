import { useNavigate, Link } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import logo from './assets/logo.png'

function App() {

  const navigate = useNavigate()

  return (
    <div className="app-layout bg-light min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            {/* Logo + Brand */}
            <Link to="/" className="brand">
              <img src={logo} alt="TOEIC Center" className="brand-logo" />
              <div className="brand-text">
                <span className="brand-title">Hệ Thống Quản Lý</span>
                <span className="brand-subtitle">Trung Tâm TOEIC</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="header-nav">
              <Link to="/" className="nav-link">Trang chủ</Link>
              <Link to="/students" className="nav-link">Lộ trình học</Link>
              <Link to="/teachers" className="nav-link">Giáo viên</Link>
              <Link to="/courses" className="nav-link">Khóa học</Link>
              <Link to="/exams" className="nav-link">Kiểm tra đầu vào</Link>
          </nav>

            {/* CTA Buttons */}
            <div className="header-actions">
              <button className="btn-login" onClick={() => navigate('/login?mode=login')}>Đăng nhập</button>
              <button className="btn-cta" onClick={() => navigate('/login?mode=register')}>ĐĂNG KÝ NGAY</button>
            </div>
          </div>
        </div>
      </header>

      <div className="container flex-grow-1">
        {/* Main Content */}
        <main className="content flex-grow-1 bg-white border rounded p-0">
          {/* Banner (Video) */}
          <section className="home-hero">
            <div className="hero-media">
              <video className="hero-video" autoPlay muted loop playsInline>
                <source src="/src/assets/5734765-hd_1920_1080_30fps.mp4" type="video/mp4" />
              </video>
              <div className="hero-overlay"></div>
            </div>
            <div className="container hero-content text-start">
              <h1 className="display-6 fw-bold mb-2">Nâng tầm điểm TOEIC của bạn</h1>
              <p className="lead mb-3">Lộ trình cá nhân hóa, giáo trình cập nhật, giảng viên giàu kinh nghiệm.</p>
              <div className="hero-badges mb-3">
                <span className="badge-item">Cam kết 650+ đầu ra</span>
                <span className="badge-item">Lịch học linh hoạt</span>
                <span className="badge-item">Giáo viên 8+ năm</span>
              </div>
              <div className="d-flex justify-content-center">
                <a href="#paths" className="btn btn-primary me-2">Xem lộ trình</a>
                <a href="#intro" className="btn btn-outline-primary">Tìm hiểu thêm</a>
              </div>
            </div>
          </section>

          {/* Giới thiệu trung tâm */}
          <section id="intro" className="section container py-6">
            <div className="row align-items-center g-4">
              <div className="col-md-6">
                <h2 className="section-title">Về Trung Tâm</h2>
                <p className="section-desc">Môi trường học hiện đại, lộ trình cá nhân hóa theo mục tiêu. Hệ thống theo dõi tiến độ từng tuần và kho đề cập nhật liên tục theo format mới.</p>
                <ul className="intro-features mt-3">
                  <li>Khảo sát đầu vào & tư vấn lộ trình theo mục tiêu điểm</li>
                  <li>Giáo trình bám sát đề thi chính thức, cập nhật hàng quý</li>
                  <li>Mentor đồng hành 1-1, chữa lỗi chi tiết từng kỹ năng</li>
                  <li>Lịch học linh hoạt, hỗ trợ học ngoài giờ qua nhóm riêng</li>
                </ul>
              </div>
              <div className="col-md-6">
                <div className="intro-card shadow-sm p-4 rounded bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0">Cam kết đầu ra</h5>
                    <span className="badge text-bg-primary">Chính sách rõ ràng</span>
                  </div>
                  <div className="kpi-row mb-3">
                    <div className="kpi">
                      <div className="kpi-value">10.000+</div>
                      <div className="kpi-label">Học viên</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-value">92%</div>
                      <div className="kpi-label">Đạt mục tiêu</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-value">8+ năm</div>
                      <div className="kpi-label">Kinh nghiệm GV</div>
                    </div>
                  </div>
                  <ul className="guarantee-list mb-3">
                    <li>Cam kết 550/650/800+ theo lộ trình đăng ký</li>
                    <li>Ôn lại miễn phí hoặc hoàn phí theo điều kiện</li>
                    <li>Thi thử định kỳ, báo cáo tiến bộ 2 tuần/lần</li>
                  </ul>
                  <a href="#paths" className="btn btn-outline-primary btn-sm">Xem thêm thông tin về lộ trình</a>
                </div>
              </div>
            </div>
          </section>

          {/* Lộ trình học */}
          <section id="paths" className="section bg-light py-6">
            <div className="container">
              <div className="section-header text-center mb-4">
                <h2 className="section-title mb-1">Lộ trình học</h2>
                <p className="section-subtitle mb-0">Chọn lộ trình phù hợp mục tiêu điểm và thời gian của bạn</p>
              </div>
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="path-card h-100 p-4 rounded border position-relative">
                    <div className="d-flex align-items-center mb-3">
                      <div className="path-icon me-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <div>
                        <h5 className="mb-1">Foundation (0-450)</h5>
                        <div className="text-muted small">4–8 tuần • 2–3 buổi/tuần</div>
                      </div>
                    </div>
                    <p className="mb-3">Củng cố phát âm, từ vựng, ngữ pháp nền tảng. Làm quen format đề và chiến thuật cơ bản.</p>
                    <ul className="feature-list small mb-3">
                      <li>Làm bài tập ngắn mỗi ngày</li>
                      <li>Mini test hàng tuần</li>
                    </ul>
                    <a href="#" className="path-link">Khám phá lộ trình</a>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="path-card h-100 p-4 rounded border position-relative">
                    <div className="d-flex align-items-center mb-3">
                      <div className="path-icon me-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 3l-1 9h8l-9 9 1-9H4l9-9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <h5 className="mb-1">Accelerate (450-650)</h5>
                        <div className="text-muted small">6–10 tuần • 3 buổi/tuần</div>
                      </div>
                    </div>
                    <p className="mb-3">Tăng tốc kỹ năng nghe–đọc, luyện chiến thuật theo từng Part, tập trung tối ưu điểm.</p>
                    <ul className="feature-list small mb-3">
                      <li>Chữa đề chi tiết theo lỗi</li>
                      <li>Đánh giá tiến bộ 2 tuần/lần</li>
                    </ul>
                    <a href="#" className="path-link">Khám phá lộ trình</a>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="path-card h-100 p-4 rounded border position-relative">
                    <div className="d-flex align-items-center mb-3">
                      <div className="path-icon me-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7h7l-5.5 4.1L18 21l-6-4-6 4 1.5-7.9L2 9h7l3-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <h5 className="mb-1">Master (650-800+)</h5>
                        <div className="text-muted small">8–12 tuần • 3–4 buổi/tuần</div>
                      </div>
                    </div>
                    <p className="mb-3">Luyện đề cường độ cao, phân tích lỗi theo chủ đề, tối ưu tốc độ và độ chính xác.</p>
                    <ul className="feature-list small mb-3">
                      <li>Full test mô phỏng mỗi tuần</li>
                      <li>Coaching chiến lược cá nhân</li>
                    </ul>
                    <a href="#" className="path-link">Khám phá lộ trình</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Teachers Section */}
          <section id="teachers" className="section container py-6">
            <div className="section-header text-center mb-4">
              <h2 className="section-title mb-1">Đội ngũ giảng viên</h2>
              <p className="section-subtitle mb-0">Giảng viên giàu kinh nghiệm với chứng chỉ quốc tế</p>
            </div>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="teacher-card p-4 rounded border h-100">
                  <div className="teacher-avatar mb-3">
                    <div className="avatar-circle-large mx-auto">MS</div>
                  </div>
                  <h5 className="teacher-name text-center mb-2">Ms. Sarah Johnson</h5>
                  <p className="teacher-title text-center text-muted mb-3">Chuyên gia TOEIC</p>
                  <p className="mb-3">8 năm kinh nghiệm giảng dạy TOEIC, chứng chỉ TESOL quốc tế. Đã giúp hơn 500 học viên đạt điểm mục tiêu.</p>
                  <div className="teacher-experience d-flex justify-content-center align-items-center mb-3">
                    <span className="badge bg-primary me-2">8 năm kinh nghiệm</span>
                    <span className="badge bg-success">TESOL Certified</span>
                  </div>
                  <div className="teacher-achievements text-center">
                    <div className="small text-muted">500+ học viên thành công</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="teacher-card p-4 rounded border h-100">
                  <div className="teacher-avatar mb-3">
                    <div className="avatar-circle-large mx-auto">DM</div>
                  </div>
                  <h5 className="teacher-name text-center mb-2">Mr. David Miller</h5>
                  <p className="teacher-title text-center text-muted mb-3">Chuyên gia Listening</p>
                  <p className="mb-3">10 năm kinh nghiệm, từng làm việc tại các tập đoàn đa quốc gia. Chuyên sâu về kỹ năng nghe và phát âm.</p>
                  <div className="teacher-experience d-flex justify-content-center align-items-center mb-3">
                    <span className="badge bg-primary me-2">10 năm kinh nghiệm</span>
                    <span className="badge bg-info">IELTS 8.5</span>
                  </div>
                  <div className="teacher-achievements text-center">
                    <div className="small text-muted">98% học viên đạt mục tiêu</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="teacher-card p-4 rounded border h-100">
                  <div className="teacher-avatar mb-3">
                    <div className="avatar-circle-large mx-auto">AL</div>
                  </div>
                  <h5 className="teacher-name text-center mb-2">Ms. Anna Lee</h5>
                  <p className="teacher-title text-center text-muted mb-3">Chuyên gia Reading</p>
                  <p className="mb-3">6 năm kinh nghiệm, thạc sĩ Ngôn ngữ học. Phương pháp giảng dạy sáng tạo, giúp học viên cải thiện kỹ năng đọc hiểu nhanh chóng.</p>
                  <div className="teacher-experience d-flex justify-content-center align-items-center mb-3">
                    <span className="badge bg-primary me-2">6 năm kinh nghiệm</span>
                    <span className="badge bg-warning">MA Linguistics</span>
                  </div>
                  <div className="teacher-achievements text-center">
                    <div className="small text-muted">300+ học viên thành công</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Chia sẻ học viên */}
          <section id="testimonials" className="section container py-6">
            <div className="section-header text-center mb-4">
              <h2 className="section-title mb-1">Chia sẻ từ học viên</h2>
              <p className="section-subtitle mb-0">Trải nghiệm thực tế sau khi học và thi</p>
            </div>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="testimonial-card p-4 rounded border h-100">
                  <div className="quote-mark">“</div>
                  <p className="mb-3">Tăng 200 điểm sau 8 tuần. Mentor theo sát giúp mình giữ nhịp học và biết cách phân bổ thời.</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle me-2">MK</div>
                      <div>
                        <div className="fw-semibold">Minh K.</div>
                        <div className="small text-muted">TOEIC 745</div>
                      </div>
                    </div>
                    <div className="rating" aria-label="5 stars">★★★★★</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card p-4 rounded border h-100">
                  <div className="quote-mark">“</div>
                  <p className="mb-3">Kho đề và chữa chi tiết rất chất lượng, chỉ ra điểm yếu cụ thể để cải thiện nhanh.</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle me-2">TH</div>
                      <div>
                        <div className="fw-semibold">Thu H.</div>
                        <div className="small text-muted">TOEIC 805</div>
                      </div>
                    </div>
                    <div className="rating" aria-label="5 stars">★★★★★</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card p-4 rounded border h-100">
                  <div className="quote-mark">“</div>
                  <p className="mb-3">Lịch học linh hoạt, giáo viên hỗ trợ ngoài giờ qua nhóm riêng, rất yên tâm.</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle me-2">QN</div>
                      <div>
                        <div className="fw-semibold">Quân N.</div>
                        <div className="small text-muted">TOEIC 650</div>
                      </div>
                    </div>
                    <div className="rating" aria-label="5 stars">★★★★★</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          {/* Copyright */}
          <div className="footer-copyright">
            <p className="copyright-text">
              © Copyright {new Date().getFullYear()} Trung tâm TOEIC. All rights reserved.
            </p>
            <p className="company-info">
              Công ty TNHH Trung tâm TOEIC, GCN đăng ký đầu tư số 123456789 ngày cấp 01/01/2020 nơi cấp Sở Kế Hoạch & Đầu Tư TP.HCM.
            </p>
            <p className="company-address">
              Trụ sở chính: 123 Đường ABC, Phường XYZ, Quận 1, Thành phố Hồ Chí Minh.
            </p>
          </div>

          {/* CTA Button */}
          <div className="footer-cta">
            <button className="btn-test">
              <span>KIỂM TRA TRÌNH ĐỘ MIỄN PHÍ</span>
              <div className="btn-icon">→</div>
            </button>
          </div>

          {/* URL Bar */}
          <div className="footer-url">
            <span>https://toeiccenter.edu.vn/bai-test-tieng-anh-chuan-quoc-te-mien-phi</span>
          </div>
        </div>

        {/* Floating Buttons */}
        <div className="floating-buttons">
          <button className="btn-refresh">↻</button>
          <button className="btn-scroll-top">↑</button>
        </div>
      </footer>
    </div>
  )
}

export default App
