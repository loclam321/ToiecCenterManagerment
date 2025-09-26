import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import '../App.css';
import './css/teacher.css';

const Teacher = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({});

    const API_BASE_URL = 'http://localhost:5000/api/teachers';

    // Fetch teachers data
    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/?page=1&per_page=12`);
            const data = await response.json();

            if (data.success) {
                setTeachers((data.data && data.data.teachers) || []);
            } else {
                setError(data.message || 'Có lỗi xảy ra');
            }
        } catch (err) {
            setError('Không thể kết nối đến server');
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics
    const fetchStatistics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/statistics`);
            const data = await response.json();
            
            if (data.success) {
                setStatistics(data.data.statistics || {});
            }
        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    useEffect(() => {
        fetchTeachers();
        fetchStatistics();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getGenderText = (gender) => {
        switch (gender) {
            case 'M': return 'Nam';
            case 'F': return 'Nữ';
            default: return 'Chưa xác định';
        }
    };

    const getGenderIcon = (gender) => {
        switch (gender) {
            case 'M': return '👨‍🏫';
            case 'F': return '👩‍🏫';
            default: return '👨‍🏫';
        }
    };

    const calculateYearsOfService = (hireDate) => {
        if (!hireDate) return 0;
        const today = new Date();
        const hire = new Date(hireDate);
        return Math.floor((today - hire) / (365.25 * 24 * 60 * 60 * 1000));
    };

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

            {/* Statistics Section */}
            <div className="teacher-stats-section">
                <div className="container">
                    <h2 className="section-title">Thống Kê Đội Ngũ</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <h3>{statistics.total_teachers || 0}+</h3>
                                <p>Giáo viên giàu kinh nghiệm</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⭐</div>
                            <div className="stat-content">
                                <h3>{statistics.senior_teachers || 0}+</h3>
                                <p>Giáo viên thâm niên (trên 5 năm)</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🎓</div>
                            <div className="stat-content">
                                <h3>{statistics.avg_years_service || 0}+</h3>
                                <p>Năm kinh nghiệm trung bình</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🏆</div>
                            <div className="stat-content">
                                <h3>95%</h3>
                                <p>Tỷ lệ học viên đạt mục tiêu</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teachers Showcase */}
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
                        <div className="teachers-grid">
                            {teachers.map((teacher) => (
                                <div key={teacher.user_id} className="teacher-card">
                                    <div className="teacher-header">
                                        <div className="teacher-avatar">
                                            <span className="avatar-icon">
                                                {getGenderIcon(teacher.user_gender)}
                                            </span>
                                        </div>
                                        <div className="teacher-badge">
                                            <span className="badge-text">Thâm niên</span>
                                        </div>
                                    </div>
                                    
                                    <div className="teacher-info">
                                        <h3 className="teacher-name">{teacher.user_name || 'Giáo viên'}</h3>
                                        <p className="teacher-specialization">
                                            {teacher.tch_specialization || 'Chuyên gia TOEIC'}
                                        </p>
                                        
                                        <div className="teacher-experience">
                                            <div className="exp-item">
                                                <span className="exp-icon">📅</span>
                                                <span className="exp-text">
                                                    {calculateYearsOfService(teacher.tch_hire_date)} năm kinh nghiệm
                                                </span>
                                            </div>
                                            <div className="exp-item">
                                                <span className="exp-icon">🎓</span>
                                                <span className="exp-text">
                                                    {teacher.tch_qualification || 'Chứng chỉ quốc tế'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="teacher-details">
                                            <div className="detail-item">
                                                <span className="detail-label">Giới tính:</span>
                                                <span className="detail-value">{getGenderText(teacher.user_gender)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Ngày sinh:</span>
                                                <span className="detail-value">{formatDate(teacher.user_birthday)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Ngày tuyển dụng:</span>
                                                <span className="detail-value">{formatDate(teacher.tch_hire_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="teacher-achievements">
                                        <div className="achievement-item">
                                            <span className="achievement-icon">🏆</span>
                                            <span className="achievement-text">Giáo viên xuất sắc</span>
                                        </div>
                                        <div className="achievement-item">
                                            <span className="achievement-icon">⭐</span>
                                            <span className="achievement-text">Đánh giá cao từ học viên</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
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

export default Teacher;