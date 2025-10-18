import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import TestPage from './pages/test/test';
import ToeicTestPage from './pages/test/toeic-test';


// Import layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { fetchLearningPathsWithCourse, toggleCourseStatus } from './services/courseService';

// Import pages
import AuthPage from './pages/AuthPage';
import FacilityPage from './pages/facility/facility';

// Giữ HomePage content trong App nhưng chỉ hiển thị nó ở route "/"
function HomeContent() {
  const [showDropOverlay, setShowDropOverlay] = useState(false);
  const [learningPaths, setLearningPaths] = useState([]);
  const [lpLoading, setLpLoading] = useState(false);
  const [lpError, setLpError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const loadLearningPaths = useCallback(async () => {
    try {
      setLpLoading(true);
      setLpError(null);
      const list = await fetchLearningPathsWithCourse();
      setLearningPaths(list);
    } catch (e) {
      setLpError(e.message || 'Không thể tải lộ trình');
    } finally {
      setLpLoading(false);
    }
  }, []);

  const handleToggle = async (lp) => {
    try {
      setTogglingId(lp.lp_id);
      const updated = await toggleCourseStatus(lp.course_id);
      setLearningPaths((prev) => prev.map((x) => x.lp_id === lp.lp_id ? { ...x, course_status: updated.course_status } : x));
    } catch (e) {
      alert(e.message || 'Không thể đổi trạng thái');
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    if (showDropOverlay) {
      loadLearningPaths();
    }
  }, [showDropOverlay, loadLearningPaths]);
  return (
    <>
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
        <div className="text-center mb-5">
          <h2 className="section-title mb-3">Về Trung Tâm TOEIC</h2>
          <p className="section-desc mx-auto" style={{maxWidth: '720px'}}>
            Môi trường học hiện đại, lộ trình cá nhân hóa theo mục tiêu. 
            Hệ thống theo dõi tiến độ từng tuần và kho đề cập nhật liên tục theo format mới.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-3 col-6">
            <div className="stats-card text-center p-4 h-100 rounded-3 border bg-white shadow-sm">
              <div className="stats-icon mb-3 mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stats-value mb-1">10.000+</div>
              <div className="stats-label">Học viên đã đạt mục tiêu</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stats-card text-center p-4 h-100 rounded-3 border bg-white shadow-sm">
              <div className="stats-icon mb-3 mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stats-value mb-1">92%</div>
              <div className="stats-label">Tỷ lệ đạt target</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stats-card text-center p-4 h-100 rounded-3 border bg-white shadow-sm">
              <div className="stats-icon mb-3 mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stats-value mb-1">8+ năm</div>
              <div className="stats-label">Kinh nghiệm giảng viên</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stats-card text-center p-4 h-100 rounded-3 border bg-white shadow-sm">
              <div className="stats-icon mb-3 mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stats-value mb-1">100+</div>
              <div className="stats-label">Khóa học đã triển khai</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="row g-4 mb-5">
          <div className="col-lg-3 col-md-6">
            <div className="feature-box p-4 h-100 rounded-3 border bg-white">
              <div className="feature-icon-wrapper mb-3">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <h5 className="feature-title mb-2">Khảo sát đầu vào</h5>
              <p className="feature-desc mb-0">Đánh giá năng lực & tư vấn lộ trình phù hợp với mục tiêu điểm của bạn</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="feature-box p-4 h-100 rounded-3 border bg-white">
              <div className="feature-icon-wrapper mb-3">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <h5 className="feature-title mb-2">Giáo trình cập nhật</h5>
              <p className="feature-desc mb-0">Bám sát đề thi chính thức, cập nhật hàng quý theo format mới nhất</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="feature-box p-4 h-100 rounded-3 border bg-white">
              <div className="feature-icon-wrapper mb-3">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              <h5 className="feature-title mb-2">Mentor 1-1</h5>
              <p className="feature-desc mb-0">Đồng hành cá nhân, chữa lỗi chi tiết từng kỹ năng để cải thiện nhanh</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="feature-box p-4 h-100 rounded-3 border bg-white">
              <div className="feature-icon-wrapper mb-3">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <h5 className="feature-title mb-2">Lịch linh hoạt</h5>
              <p className="feature-desc mb-0">Thời gian học linh động, hỗ trợ ngoài giờ qua nhóm riêng 24/7</p>
            </div>
          </div>
        </div>

        {/* Commitment Card */}
        <div className="commitment-card p-4 p-md-5 rounded-3 border bg-gradient">
          <div className="row align-items-center g-4">
            <div className="col-md-5">
              <div className="commitment-badge mb-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="commitment-title mb-3">Cam kết đầu ra rõ ràng</h3>
              <p className="commitment-desc mb-0">
                Chúng tôi cam kết kết quả học tập với chính sách hoàn phí hoặc học lại miễn phí nếu không đạt mục tiêu theo điều kiện.
              </p>
            </div>
            <div className="col-md-7">
              <div className="row g-3">
                <div className="col-12">
                  <div className="commitment-item">
                    <div className="commitment-item-icon">✓</div>
                    <div className="commitment-item-text">
                      <strong>Cam kết 550/650/800+</strong> theo lộ trình đăng ký
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="commitment-item">
                    <div className="commitment-item-icon">✓</div>
                    <div className="commitment-item-text">
                      <strong>Ôn lại miễn phí</strong> hoặc hoàn phí theo điều kiện cam kết
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="commitment-item">
                    <div className="commitment-item-icon">✓</div>
                    <div className="commitment-item-text">
                      <strong>Thi thử định kỳ</strong>, báo cáo tiến bộ 2 tuần/lần
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="commitment-item">
                    <div className="commitment-item-icon">✓</div>
                    <div className="commitment-item-text">
                      <strong>Hỗ trợ học tập</strong> liên tục qua nhóm riêng và mentor cá nhân
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lộ trình học */}
      <section
        id="paths"
        className="section bg-light py-6"
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setShowDropOverlay(true)}
        onDragLeave={() => setShowDropOverlay(false)}
        onDrop={(e) => {
          e.preventDefault();
          setShowDropOverlay(false);
        }}
      >
        <div className="container">
          <div className="section-header text-center mb-4">
            <h2 className="section-title mb-1">Lộ trình học</h2>
            <p className="section-subtitle mb-0">Chọn lộ trình phù hợp mục tiêu điểm và thời gian của bạn</p>
          </div>
          {showDropOverlay && (
            <div className="lp-drop-overlay">
              <div className="lp-drop-panel">
                <div className="lp-drop-header">
                  <div className="lp-drop-title">Lộ trình & Trạng thái khóa học</div>
                  <button className="lp-drop-close" onClick={() => setShowDropOverlay(false)}>✕</button>
                </div>
                <div className="lp-drop-content">
                  {lpLoading ? (
                    <div className="lp-loading">Đang tải lộ trình...</div>
                  ) : lpError ? (
                    <div className="lp-error">{lpError}</div>
                  ) : learningPaths.length === 0 ? (
                    <div className="lp-empty">Chưa có lộ trình</div>
                  ) : (
                    <ul className="lp-list">
                      {learningPaths.map((lp) => (
                        <li key={lp.lp_id} className="lp-item">
                          <div className="lp-meta">
                            <div className="lp-name">{lp.lp_name || `LP #${lp.lp_id}`}</div>
                            <div className="lp-course">{lp.course_name || lp.course_id}</div>
                          </div>
                          <div className="lp-actions">
                            <span className={`status-pill ${lp.course_status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                              {lp.course_status === 'ACTIVE' ? 'active' : 'inactive'}
                            </span>
                            <button
                              className="btn-toggle"
                              onClick={() => handleToggle(lp)}
                              disabled={togglingId === lp.lp_id}
                            >
                              {togglingId === lp.lp_id ? 'Đang đổi...' : 'Đổi trạng thái'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="path-card h-100 p-4 rounded border position-relative">
                <div className="d-flex align-items-center mb-3">
                  <div className="path-icon me-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 3l-1 9h8l-9 9 1-9H4l9-9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7h7l-5.5 4.1L18 21l-6-4-6 4 1.5-7.9L2 9h7l3-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

      <main className="content flex-grow-1 bg-white">
        <Routes>
          <Route path="/" element={<HomeContent />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/test/:testId" element={<TestPage />} />
          <Route path="/toeic-test" element={<ToeicTestPage />} />
          <Route path="/toeic-test/:testId" element={<ToeicTestPage />} />
          <Route path="/facility" element={<FacilityPage />} />
          {/* Thêm các routes khác ở đây */}
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;