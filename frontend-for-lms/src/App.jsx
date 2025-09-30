import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { fetchCoursesSummary } from './services/courseService';

// Import pages
import AuthPage from './pages/AuthPage';
import TestPage from './pages/test/test';

// Giữ HomePage content trong App nhưng chỉ hiển thị nó ở route "/"
function HomeContent() {
  const [showDropOverlay, setShowDropOverlay] = useState(false);
  const [courses, setCourses] = useState([]);
  const [lpLoading, setLpLoading] = useState(false);
  const [lpError, setLpError] = useState(null);
  const dropdownRef = useRef(null);

  const loadCourses = useCallback(async () => {
    try {
      setLpLoading(true);
      setLpError(null);
      const list = await fetchCoursesSummary();
      setCourses(list);
    } catch (e) {
      setLpError(e.message || 'Không thể tải danh sách khoá học');
    } finally {
      setLpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showDropOverlay) {
      loadCourses();
    }
  }, [showDropOverlay, loadCourses]);

  // Load courses for rendering path cards
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (showDropOverlay && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropOverlay(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showDropOverlay]);
  return (
    <>
      {/* Banner (Video) */}
      <section className="home-hero">
        <div className="hero-media">
          <video className="hero-video" autoPlay muted loop playsInline>
            <source src="/src/assets/video/5734765-hd_1920_1080_30fps.mp4" type="video/mp4" />
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
              <a href="#paths" className="btn btn-outline-primary btn-sm">Xem thêm thông tin về lộ trình</a>
            </div>
          </div>
        </div>
      </section>

      {/* Lộ trình học - đã bỏ showcase theo yêu cầu */}

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
              <div className="quote-mark">"</div>
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
              <div className="quote-mark">"</div>
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
              <div className="quote-mark">"</div>
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
    </>
  );
}

function App() {
  return (
    <div className="app-layout bg-light min-vh-100 d-flex flex-column">
      <Header />


        <main className="content bg-white border rounded p-0">
          <Routes>
            <Route path="/" element={<HomeContent />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/test/:testId" element={<TestPage />} />
            {/* Thêm các routes khác ở đây */}
          </Routes>
        </main>
    

      <Footer />
    </div>
  );
}

export default App;
