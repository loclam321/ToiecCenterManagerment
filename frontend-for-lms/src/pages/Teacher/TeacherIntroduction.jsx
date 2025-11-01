import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { getTeachers, mapTeacherFromApi } from '../../services/teacherService';
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

            const apiTeachers = Array.isArray(result?.data?.teachers)
                ? result.data.teachers
                : Array.isArray(result?.teachers)
                    ? result.teachers
                    : [];

            const mappedTeachers = apiTeachers.map(mapTeacherFromApi);

            // Filter senior teachers (có kinh nghiệm >= 5 năm hoặc hire_date >= 5 năm trước)
            const seniorTeachers = mappedTeachers.filter(teacher => {
                const yearsOfService = calculateYearsOfService(teacher.hireDate);
                const declaredExp = Number.isFinite(teacher.experience) ? teacher.experience : 0;
                return yearsOfService >= 5 || declaredExp >= 5;
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
            
            const statsPayload = result?.data?.statistics || result?.statistics;
            if (statsPayload) {
                setStatistics(statsPayload);
            }
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

    // Chuẩn hóa đường dẫn avatar sang web path an toàn
    // Trả về null khi không có đường dẫn hợp lệ để tránh đặt src="" trên thẻ <img>
    const normalizeAvatar = (p) => {
        if (!p) return null;
        const raw = String(p).trim();
        if (!raw) return null;
        if (/^(https?:|data:)/i.test(raw)) return raw;
        let path = raw.replace(/\\/g, '/');
        const lower = path.toLowerCase();
        const publicIdx = lower.indexOf('/public/');
        if (publicIdx !== -1) {
            path = path.substring(publicIdx + '/public'.length);
        }
        const avatarIdx = path.toLowerCase().indexOf('/avatar/');
        if (avatarIdx !== -1) {
            path = path.substring(avatarIdx);
        }
        if (!path.startsWith('/')) path = '/' + path;
        return path;
    };

    const calculateYearsOfService = (hireDate) => {
        if (!hireDate) return 0;
        const today = new Date();
        const hire = new Date(hireDate);
        return Math.floor((today - hire) / (365.25 * 24 * 60 * 60 * 1000));
    };

    // Chuẩn hoá và hiển thị badge trạng thái ổn định, kể cả khi API trả về giá trị lạ
    const getStatusBadge = (status) => {
        const s = (status ?? '').toString().trim().toLowerCase();
        const normalized = (
            s === 'a' || s === 'act' || s === 'active' || s === '1' || s === 'true'
        ) ? 'active'
          : (
            s === 'i' || s === 'inact' || s === 'inactive' || s === '0' || s === 'false' ||
            s === 'idle' || s === 'leave' || s === 'on_leave' || s === 'suspended' || s === 'pause' || s === 'paused'
          ) ? 'inactive'
          : (s === 'r' || s === 'retire' || s === 'retired') ? 'retired'
          : 'unknown';

        switch (normalized) {
            case 'active':
                return { text: 'Đang hoạt động', class: 'status-active', hint: 'Giáo viên đang công tác' };
            case 'inactive':
                return { text: 'Tạm nghỉ', class: 'status-inactive', hint: 'Tạm nghỉ / tạm dừng / đang rảnh' };
            case 'retired':
                return { text: 'Đã nghỉ hưu', class: 'status-retired', hint: 'Đã nghỉ công tác' };
            default:
                return { text: 'Chưa xác định', class: 'status-unknown', hint: 'Trạng thái chưa rõ — vui lòng cập nhật hồ sơ' };
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
                                <div className="teachers-grid" ref={gridRef}>
                                    {teachers.map((teacher, idx) => {
                                        const avatarPath = normalizeAvatar(teacher.avatarPath) || '/avatar/default.svg';
                                        const mapKey = teacher.id || teacher.tch_id || teacher.user_id || teacher.userId || `teacher-${idx}`;
                                        return (
                                            <div key={mapKey} className="teacher-card">
                                                {/* Full-bleed image */}
                                                <div className="teacher-card-img-wrap">
                                                    <img
                                                        className="teacher-card-img"
                                                        src={avatarPath}
                                                        alt={teacher.displayName || 'Giáo viên'}
                                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar/default.svg'; }}
                                                    />
                                                </div>

                                                {/* Status badge */}
                                                {(() => {
                                                    const badge = getStatusBadge(teacher.status);
                                                    return (
                                                        <div className={`status-badge ${badge.class}`} title={badge.hint} aria-label={`Trạng thái: ${badge.text}`}>
                                                            {badge.text}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Bottom band with name/title */}
                                                <div className="teacher-card-bottom">
                                                    <div className="teacher-card-name">{teacher.displayName}</div>
                                                    <div className="teacher-card-title">{teacher.specialization || 'Chuyên gia TOEIC'}</div>
                                                </div>

                                                {/* Hover overlay with details */}
                                                <div className="teacher-card-overlay">
                                                    <div className="teacher-overlay-content">
                                                        <div className="overlay-row">🎓 {teacher.qualification || 'Chứng chỉ quốc tế'}</div>
                                                        <div className="overlay-row">📅 {teacher.experience || calculateYearsOfService(teacher.hireDate)} năm kinh nghiệm</div>
                                                        <div className="overlay-row">👤 {getGenderText(teacher.gender)}</div>
                                                        <div className="overlay-row">📍 Bắt đầu: {formatDate(teacher.hireDate)}</div>
                                                        {/* Đã xoá email và phone overlay-row theo yêu cầu */}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TeacherIntroduction;