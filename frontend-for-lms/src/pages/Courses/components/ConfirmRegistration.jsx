import React, { useEffect, useState } from 'react';
import './ConfirmRegistration.css';
import { getCourseById } from '../../../services/courseService';

const ConfirmRegistration = ({
    isOpen,
    onClose,
    onConfirm,
    formData,
    courseId
}) => {
    const [course, setCourse] = useState({});
    const [preCourses, setPreCourses] = useState([]); // Mảng các học phần tiên quyết
    const [selectedStartCourseId, setSelectedStartCourseId] = useState(null); // ID học phần muốn bắt đầu
    const [selectedOption, setSelectedOption] = useState('current');

    // Đệ quy lấy tất cả precourse (nhiều cấp)
    const fetchAllPreCourses = async (courseId, visited = new Set()) => {
        if (!courseId || visited.has(courseId)) return [];
        visited.add(courseId);

        const course = await getCourseById(courseId);
        preCourses.forEach(c => {
            if (c.course_id === course.course_id) {
                return []; // Đã có trong danh sách
            }
        });
        setPreCourses(prev => [...prev, course]);

        const preIds = Array.isArray(course.precourses)
            ? course.precourses
            : course.cou_course_id
                ? [course.cou_course_id]
                : [];
        let result = [];
        for (const preId of preIds) {
            const pre = await getCourseById(preId);
            result.push(pre);
            const subPre = await fetchAllPreCourses(preId, visited);
            result = result.concat(subPre);
        }
        return result;
    };

    useEffect(() => {
        if (!isOpen || !courseId) return;
        const fetchData = async () => {
            const mainCourse = await getCourseById(courseId);
            setCourse(mainCourse);
            const allPreCourses = await fetchAllPreCourses(mainCourse.cou_course_id);
            
            if (allPreCourses.length > 0) {
                setSelectedStartCourseId(allPreCourses[allPreCourses.length - 1].course_id); // mặc định chọn cuối cùng
            }
        };
        fetchData();
        setSelectedOption('current');
    }, [isOpen, courseId]);
    if (!isOpen) return null;
    const hasPreCourse = preCourses.length > 0;

    const handleConfirm = () => {
        // Xác định startLevel theo học phần được chọn
        let startLevel = '';
        let startCourseName = '';
        if (selectedOption === 'current' && hasPreCourse) {
            const startCourse = preCourses.find(c => c.course_id === selectedStartCourseId);
            startLevel = startCourse ? startCourse.course_level : '';
            startCourseName = startCourse ? startCourse.course_name : '';
        }
        const confirmData = {
            selectedOption,
            includePreCourse: selectedOption === 'withPreCourse',
            preCourseIds: hasPreCourse ? preCourses.map(c => c.course_id) : null,
            preCourseNames: hasPreCourse ? preCourses.map(c => c.course_name) : null,
            startLevel,
            startCourseId: selectedStartCourseId,
            startCourseName
        };
        onConfirm(confirmData);
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-container">
                <div className="modal-header">
                    <div className="header-content">
                        <div className="header-icon-wrapper">
                            <div className="header-icon">
                                <i className="bi bi-clipboard-check-fill"></i>
                            </div>
                            <div className="icon-circle"></div>
                        </div>
                        <div className="header-text">
                            <h3>Xác nhận đăng ký</h3>
                            <p>Kiểm tra thông tin của bạn</p>
                        </div>
                    </div>
                    <button className="btn-close-modal" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="confirm-message">
                        <i className="bi bi-info-circle-fill"></i>
                        <p>Vui lòng kiểm tra lại thông tin trước khi gửi đăng ký tư vấn</p>
                    </div>

                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">
                                <i className="bi bi-person-fill"></i>
                                <span>Họ và tên</span>
                            </div>
                            <div className="info-value">{formData.name}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">
                                <i className="bi bi-calendar-event-fill"></i>
                                <span>Ngày sinh</span>
                            </div>
                            <div className="info-value">
                                {formData.birthday ? new Date(formData.birthday).toLocaleDateString('vi-VN') : ''}
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">
                                <i className={`bi ${formData.gender === 'male' ? 'bi-gender-male' :
                                    formData.gender === 'female' ? 'bi-gender-female' :
                                        'bi-gender-ambiguous'
                                    }`}></i>
                                <span>Giới tính</span>
                            </div>
                            <div className="info-value">
                                {formData.gender === 'male' ? 'Nam' :
                                    formData.gender === 'female' ? 'Nữ' : 'Khác'}
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">
                                <i className="bi bi-telephone-fill"></i>
                                <span>Số điện thoại</span>
                            </div>
                            <div className="info-value">{formData.phone}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">
                                <i className="bi bi-envelope-fill"></i>
                                <span>Email</span>
                            </div>
                            <div className="info-value">{formData.email}</div>
                        </div>

                        <div className="info-item course-item">
                            <div className="info-label">
                                <i className="bi bi-book-fill"></i>
                                <span>Khóa học đăng ký</span>
                            </div>
                            <div className="info-value course-name">{course.course_name}</div>
                        </div>

                        {hasPreCourse && (
                            <div className="info-item course-item precourse-item">
                                <div className="info-label">
                                    <i className="bi bi-arrow-up-circle-fill"></i>
                                    <span>Các học phần tiên quyết</span>
                                </div>
                                <div className="info-value course-name">
                                    {preCourses.map((c, idx) => (
                                        <span key={c.course_id} className="precourse-list-item">
                                            {idx + 1}. {c.course_name} <span className="level-badge">Level: {c.course_level}</span>
                                            <br />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {hasPreCourse && (
                        <>
                            <div className="divider"></div>
                            <div className="course-options">
                                <div className="options-header">
                                    <i className="bi bi-check2-square"></i>
                                    <span>Bạn muốn bắt đầu học từ học phần nào?</span>
                                </div>
                                <div className="options-grid">
                                    <label
                                        className={`option-card ${selectedOption === 'current' ? 'selected' : ''}`}
                                        onClick={() => setSelectedOption('current')}
                                    >
                                        <input
                                            type="radio"
                                            name="courseOption"
                                            value="current"
                                            checked={selectedOption === 'current'}
                                            onChange={() => setSelectedOption('current')}
                                        />
                                        <div className="option-content">
                                            <div className="option-icon">
                                                <i className="bi bi-book"></i>
                                            </div>
                                            <div className="option-info">
                                                <div className="option-title">Chỉ học khóa đã chọn</div>
                                                <div className="option-desc">
                                                    {course.course_name}
                                                    {preCourses.length > 0 && (
                                                        <div style={{ marginTop: 8 }}>
                                                            <label style={{ fontWeight: 500 }}>
                                                                Chọn học phần tiên quyết bạn đã hoàn thành:
                                                            </label>
                                                            <select
                                                                style={{ marginLeft: 8, padding: '4px 8px' }}
                                                                value={selectedStartCourseId || ''}
                                                                onChange={e => setSelectedStartCourseId(e.target.value)}
                                                            >
                                                                {preCourses.map(c => (
                                                                    <option key={c.course_id} value={c.course_id}>
                                                                        {c.course_name} (Level: {c.course_level})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                    <span className="start-level-hint">
                                                        (Bắt đầu từ Level: {
                                                            preCourses.length > 0
                                                                ? preCourses.find(c => c.course_id === selectedStartCourseId)?.course_level
                                                                : 'Beginner'
                                                        })
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="option-check">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                        </div>
                                    </label>
                                    <label
                                        className={`option-card ${selectedOption === 'withPreCourse' ? 'selected' : ''}`}
                                        onClick={() => setSelectedOption('withPreCourse')}
                                    >
                                        <input
                                            type="radio"
                                            name="courseOption"
                                            value="withPreCourse"
                                            checked={selectedOption === 'withPreCourse'}
                                            onChange={() => setSelectedOption('withPreCourse')}
                                        />
                                        <div className="option-content">
                                            <div className="option-icon recommended">
                                                <i className="bi bi-layers-fill"></i>
                                            </div>
                                            <div className="option-info">
                                                <div className="option-title">
                                                    Học từ học phần tiên quyết đầu tiên
                                                    <span className="recommended-badge">Khuyến nghị</span>
                                                </div>
                                                <div className="option-desc">
                                                    {preCourses.map((c) => c.course_name).join(' → ')} + {course.course_name}
                                                    <span className="start-level-hint">
                                                        (Bắt đầu từ Level: Beginner)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="option-check">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                                <div className="option-note">
                                    <i className="bi bi-lightbulb-fill"></i>
                                    <span>
                                        {selectedOption === 'withPreCourse'
                                            ? 'Bạn sẽ được tư vấn lộ trình học từ các học phần nền tảng.'
                                            : `Bạn cần đảm bảo đã có kiến thức tương đương Level ${preCourses.length > 0
                                                ? preCourses.find(c => c.course_id === selectedStartCourseId)?.course_level
                                                : 'Beginner'
                                            }`}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        <i className="bi bi-x-circle"></i>
                        <span>Hủy</span>
                    </button>
                    <button className="btn-confirm" onClick={handleConfirm}>
                        <i className="bi bi-check-circle"></i>
                        <span>Xác nhận gửi</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmRegistration;