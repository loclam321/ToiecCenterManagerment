import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { getTeachers } from '../../services/teacherService';
import '../../App.css';
import './css/teacher.css';

const TeacherIntroduction = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({});
    const gridRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

    // Fetch teachers data theo API pattern
    const fetchTeachers = async () => {
        try {
            setLoading(true);
            
            // Sử dụng teacherService với filter cho senior teachers
            const result = await getTeachers({ 
                page: 1, 
                perPage: 20, 
                status: 'active'
            });
            
            // Filter senior teachers (có kinh nghiệm >= 5 năm hoặc hire_date >= 5 năm trước)
            const seniorTeachers = result.teachers.filter(teacher => {
                const yearsOfService = calculateYearsOfService(teacher.hireDate);
                return yearsOfService >= 5 || teacher.experience >= 5;
            });
            
            setTeachers(seniorTeachers);
        } catch (err) {
            setError('Không thể tải thông tin giáo viên');
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics theo standardized API pattern
    const fetchStatistics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teachers/statistics`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch statistics');
            }
            
            setStatistics(result.data?.statistics || {});
        } catch (err) {
            console.error('Error fetching statistics:', err);
            // Set default statistics nếu API chưa có
            setStatistics({
                total_teachers: teachers.length || 0,
                senior_teachers: teachers.length || 0,
                avg_years_service: 7,
                success_rate: 95
            });
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (teachers.length > 0) {
            fetchStatistics();
        }
    }, [teachers]);

    // Scroll functions cho horizontal navigation
    const scrollLeft = () => {
        if (gridRef.current) {
            gridRef.current.scrollBy({
                left: -400, // Scroll 400px sang trái
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (gridRef.current) {
            gridRef.current.scrollBy({
                left: 400, // Scroll 400px sang phải
                behavior: 'smooth'
            });
        }
    };

    // Helper functions theo teacher model structure
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getGenderText = (gender) => {
        switch (gender) {
            case 'male': return 'Nam';
            case 'female': return 'Nữ';
            case 'other': return 'Khác';
            default: return 'Chưa xác định';
        }
    };

    const getGenderIcon = (gender) => {
        switch (gender) {
            case 'male': return '👨‍🏫';
            case 'female': return '👩‍🏫';
            default: return '👨‍🏫';
        }
    };

    const calculateYearsOfService = (hireDate) => {
        if (!hireDate) return 0;
        const today = new Date();
        const hire = new Date(hireDate);
        return Math.floor((today - hire) / (365.25 * 24 * 60 * 60 * 1000));
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return { text: 'Đang hoạt động', class: 'status-active' };
            case 'inactive':
                return { text: 'Tạm nghỉ', class: 'status-inactive' };
            case 'retired':
                return { text: 'Đã nghỉ hưu', class: 'status-retired' };
            default:
                return { text: 'Chưa xác định', class: 'status-unknown' };
        }
    };

    // Tính toán thống kê từ dữ liệu teachers
    const calculateStatistics = () => {
        const totalTeachers = teachers.length;
        const seniorTeachers = teachers.filter(t => 
            calculateYearsOfService(t.hireDate) >= 5 || t.experience >= 5
        ).length;
        
        const avgExperience = teachers.length > 0 
            ? Math.round(teachers.reduce((sum, t) => sum + (t.experience || 0), 0) / teachers.length)
            : 0;

        return {
            total_teachers: totalTeachers,
            senior_teachers: seniorTeachers,
            avg_years_service: avgExperience,
            success_rate: 95 // Static value hoặc có thể fetch từ API khác
        };
    };

    const stats = calculateStatistics();

    if (loading) {
        return (
            <div className="app-layout bg-light min-vh-100 d-flex flex-column">
                <Header />
                <main className="content bg-white border rounded p-0">
                    <div className="teacher-intro-container">
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Đang tải thông tin giáo viên...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="app-layout bg-light min-vh-100 d-flex flex-column">
            <Header />
            <main className="content bg-white border rounded p-0">
                <div className="teacher-intro-container">
                    {/* Hero Section */}
                    <div className="teacher-hero">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                <span className="hero-icon">👨‍🏫</span>
                                Đội Ngũ Giáo Viên Uy Tín
                            </h1>
                            <p className="hero-subtitle">
                                Với nhiều năm kinh nghiệm và chuyên môn sâu, đội ngũ giáo viên của chúng tôi 
                                cam kết mang đến chất lượng giảng dạy tốt nhất cho học viên
                            </p>
                        </div>
                    </div>

                    {/* Statistics Section - Updated với calculated stats */}
                    <div className="teacher-stats-section">
                        <div className="container">
                            <h2 className="section-title">Thống Kê Đội Ngũ</h2>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">👥</div>
                                    <div className="stat-content">
                                        <h3>{stats.total_teachers}+</h3>
                                        <p>Giáo viên giàu kinh nghiệm</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">⭐</div>
                                    <div className="stat-content">
                                        <h3>{stats.senior_teachers}+</h3>
                                        <p>Giáo viên thâm niên (trên 5 năm)</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🎓</div>
                                    <div className="stat-content">
                                        <h3>{stats.avg_years_service}+</h3>
                                        <p>Năm kinh nghiệm trung bình</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🏆</div>
                                    <div className="stat-content">
                                        <h3>{stats.success_rate}%</h3>
                                        <p>Tỷ lệ học viên đạt mục tiêu</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teachers Showcase - Updated với teacher model fields */}
                    <div className="teachers-showcase">
                        <div className="container">
                            <div className="showcase-header">
                                <h2 className="section-title">Giáo Viên Thâm Niên</h2>
                                <p className="section-subtitle">
                                    Những giáo viên có nhiều năm kinh nghiệm và thành tích xuất sắc
                                </p>
                            </div>

                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {teachers.length === 0 && !loading ? (
                                <div className="empty-state">
                                    <div className="empty-icon">👨‍🏫</div>
                                    <h3>Đang cập nhật thông tin giáo viên</h3>
                                    <p>Vui lòng quay lại sau để xem thông tin chi tiết</p>
                                </div>
                            ) : (
                                <div className="teachers-container">
                                    <button 
                                        className="scroll-nav-btn prev" 
                                        onClick={scrollLeft}
                                        aria-label="Xem giáo viên trước"
                                    >
                                        &#8249;
                                    </button>
                                    <button 
                                        className="scroll-nav-btn next" 
                                        onClick={scrollRight}
                                        aria-label="Xem giáo viên tiếp theo"
                                    >
                                        &#8250;
                                    </button>
                                    <div className="teachers-grid" ref={gridRef}>
                                        {teachers.map((teacher) => (
                                        <div key={teacher.id} className="teacher-card">
                                            {/* Left side - Avatar */}
                                            <div className="teacher-left">
                                                <div className="teacher-avatar">
                                                    <span className="avatar-icon">
                                                        {getGenderIcon(teacher.gender)}
                                                    </span>
                                                </div>
                                                <div className="teacher-basic">
                                                    <h3 className="teacher-name">{teacher.displayName}</h3>
                                                    <p className="teacher-specialization">
                                                        {teacher.specialization || 'Chuyên gia TOEIC'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Right side - Details */}
                                            <div className="teacher-right">
                                                <div className="teacher-badges">
                                                    <div className="teacher-badge">
                                                        <span className="badge-text">
                                                            {calculateYearsOfService(teacher.hireDate)} năm
                                                        </span>
                                                    </div>
                                                    <div className={`status-badge ${getStatusBadge(teacher.status).class}`}>
                                                        {getStatusBadge(teacher.status).text}
                                                    </div>
                                                </div>
                                                
                                                <div className="teacher-quick-info">
                                                    <div className="info-row">
                                                        <span className="info-item">📅 {teacher.experience || calculateYearsOfService(teacher.hireDate)} năm</span>
                                                        <span className="info-item">🎓 {teacher.qualification || 'Chứng chỉ quốc tế'}</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <span className="info-item">👤 {getGenderText(teacher.gender)}</span>
                                                        <span className="info-item">📍 {formatDate(teacher.hireDate)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="teacher-contact">
                                                    <div className="contact-row">
                                                        <span className="contact-item">📧 {teacher.email}</span>
                                                        <span className="contact-item">📞 {teacher.phone || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Why Choose Our Teachers */}
                    <div className="why-choose-section">
                        <div className="container">
                            <h2 className="section-title">Tại Sao Chọn Giáo Viên Của Chúng Tôi?</h2>
                            <div className="reasons-grid">
                                <div className="reason-card">
                                    <div className="reason-icon">🎯</div>
                                    <h3>Chuyên Môn Sâu</h3>
                                    <p>Giáo viên có chuyên môn sâu về TOEIC và phương pháp giảng dạy hiệu quả</p>
                                </div>
                                <div className="reason-card">
                                    <div className="reason-icon">📚</div>
                                    <h3>Kinh Nghiệm Dày Dặn</h3>
                                    <p>Nhiều năm kinh nghiệm giảng dạy và thành công trong việc giúp học viên đạt mục tiêu</p>
                                </div>
                                <div className="reason-card">
                                    <div className="reason-icon">💡</div>
                                    <h3>Phương Pháp Hiện Đại</h3>
                                    <p>Áp dụng phương pháp giảng dạy tiên tiến, phù hợp với từng trình độ học viên</p>
                                </div>
                                <div className="reason-card">
                                    <div className="reason-icon">🤝</div>
                                    <h3>Hỗ Trợ Tận Tình</h3>
                                    <p>Luôn sẵn sàng hỗ trợ học viên ngoài giờ học và giải đáp mọi thắc mắc</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="cta-section">
                        <div className="container">
                            <div className="cta-content">
                                <h2 className="cta-title">Sẵn Sàng Bắt Đầu Hành Trình TOEIC?</h2>
                                <p className="cta-subtitle">
                                    Đăng ký ngay để được học với đội ngũ giáo viên uy tín và giàu kinh nghiệm
                                </p>
                                <div className="cta-buttons">
                                    <button className="btn-primary">Đăng Ký Ngay</button>
                                    <button className="btn-secondary">Tư Vấn Miễn Phí</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TeacherIntroduction;