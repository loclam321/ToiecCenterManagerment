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
    const [preCourse, setPreCourse] = useState({});
    const [selectedOption, setSelectedOption] = useState('current');

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const fetchCourse = async () => {
        try {
            const data = await getCourseById(courseId);
            setCourse(data);
        } catch (error) {
            console.error('Error fetching course:', error);
        }
    };

    const fetchPreCourse = async () => {
        try {
            const data = await getCourseById(course.cou_course_id);
            setPreCourse(data);
        } catch (error) {
            console.error('Error fetching pre-course:', error);
        }
    };

    useEffect(() => {
        if (!isOpen || !courseId) return;
        fetchCourse();
        setSelectedOption('current');
    }, [isOpen, courseId]);

    useEffect(() => {
        if (!course.cou_course_id) return;
        fetchPreCourse();
    }, [course.cou_course_id]);

    if (!isOpen) return null;

    const hasPreCourse = preCourse.course_name;

    const handleConfirm = () => {
        // ✅ Tính startLevel dựa trên lựa chọn
        let startLevel = '';
        
        if (selectedOption === 'current') {
            // Nếu chỉ học khóa hiện tại → startLevel = level của preCourse
            startLevel = preCourse.course_level || '';
        } else {
            // Nếu học cả preCourse → startLevel = '' (bắt đầu từ đầu)
            startLevel = '';
        }

        const confirmData = {
            selectedOption: selectedOption,
            includePreCourse: selectedOption === 'withPreCourse',
            preCourseId: selectedOption === 'withPreCourse' ? preCourse.course_id : null,
            preCourseName: selectedOption === 'withPreCourse' ? preCourse.course_name : null,
            startLevel: startLevel // ✅ Gửi startLevel về parent
        };

        console.log('📦 Confirm Data:', {
            ...confirmData,
            logic: selectedOption === 'current' 
                ? `Bỏ qua preCourse → startLevel = ${preCourse.course_level}`
                : 'Học cả preCourse → startLevel = "" (bắt đầu từ đầu)'
        });

        onConfirm(confirmData);
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
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
                                    <span>Khóa tiên quyết</span>
                                </div>
                                <div className="info-value course-name">
                                    {preCourse.course_name}
                                    <span className="level-badge">Level: {preCourse.course_level}</span>
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
                                    <span>Chọn phương án học</span>
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
                                                    <span className="start-level-hint">
                                                        (Bắt đầu từ Level: {preCourse.course_level})
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
                                                    Học bao gồm khóa tiên quyết
                                                    <span className="recommended-badge">Khuyến nghị</span>
                                                </div>
                                                <div className="option-desc">
                                                    {preCourse.course_name} + {course.course_name}
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
                                            ? 'Bạn sẽ được tư vấn chi tiết về lộ trình học cả 2 khóa từ cơ bản'
                                            : `Đảm bảo bạn đã có kiến thức tương đương Level ${preCourse.course_level}`
                                        }
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