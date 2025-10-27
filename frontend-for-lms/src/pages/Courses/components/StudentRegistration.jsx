import React, { useState } from 'react';
import ConfirmRegistration from './ConfirmRegistration';
import './StudentRegistration.css';
import { createConsultRegistration } from '../../../services/consultService';
import { message } from 'antd';

const StudentRegistration = ({ courseName = '', courseId = '', preCourse }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        gender: '',
        birthday: ''
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        // Họ tên
        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập họ và tên';
        }

        // Số điện thoại
        const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!phoneRegex.test(formData.phone.trim())) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!emailRegex.test(formData.email.trim())) {
            newErrors.email = 'Email không hợp lệ';
        }

        // Giới tính
        if (!formData.gender) {
            newErrors.gender = 'Vui lòng chọn giới tính';
        }

        // Ngày sinh
        if (!formData.birthday) {
            newErrors.birthday = 'Vui lòng chọn ngày sinh';
        } else {
            const birthDate = new Date(formData.birthday);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 10 || age > 100) {
                newErrors.birthday = 'Ngày sinh không hợp lệ';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async (confirmData) => {
        setShowConfirmModal(false);
        setSubmitting(true);
        setErrors({});
        try {
            const apiData = {
                course_id: confirmData.course_id,
                cr_fullname: confirmData.cr_fullname,
                cr_birthday: confirmData.cr_birthday,
                cr_phone: confirmData.cr_phone,
                cr_email: confirmData.cr_email,
                cr_gender: confirmData.cr_gender,
                cr_startlv: confirmData.cr_startlv
            };
            console.log(apiData);

            // Gọi API và lấy response
            const response = await createConsultRegistration(apiData);
            console.log(response);
            // Xử lý response thành công
            if (response.data.success === true) {
                message.success("Email xác nhận đã được gửi. Vui lòng kiểm tra email của bạn.");
                setSubmitted(true);
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    gender: '',
                    birthday: ''
                });
                // Đặt lại submitted về false sau 3 giây để ẩn thông báo thành công
                setTimeout(() => {
                    setSubmitted(false);
                }, 3000);
            } else {
                setErrors({ submit: 'Đăng ký không thành công. Vui lòng thử lại.' });
            }
        } catch (error) {
            setErrors({ submit: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="student-registration">
                <div className="registration-card">
                    {submitted ? (
                        <div className="registration-success">
                            <div className="success-animation">
                                <div className="success-checkmark">
                                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                        <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                        <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                    </svg>
                                </div>
                            </div>
                            <h3>Đã gửi email xác thực!</h3>
                            <p>Vui lòng kiểm tra email của bạn để xác thực.</p>
                            <div className="success-decoration">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    ) : (
                        <form className="registration-form" onSubmit={handleSubmit}>
                            <div className="form-header">
                                <div className="header-content">
                                    <div className="header-icon">
                                        <i className="bi bi-mortarboard-fill"></i>
                                    </div>
                                    <div className="header-text">
                                        <h3>Đăng ký tư vấn miễn phí</h3>
                                        <p>Để lại thông tin, chúng tôi sẽ tư vấn chi tiết</p>
                                    </div>
                                </div>
                            </div>

                            {errors.submit && (
                                <div className="alert alert-danger">
                                    <i className="bi bi-exclamation-triangle-fill"></i>
                                    <span>{errors.submit}</span>
                                </div>
                            )}

                            <div className="form-body">
                                {/* Họ và tên */}
                                <div className="form-group">
                                    <label htmlFor="name">
                                        Họ và tên <span className="required">*</span>
                                    </label>
                                    <div className={`input-wrapper ${errors.name ? 'error' : ''} ${formData.name ? 'filled' : ''}`}>
                                        <div className="input-icon">
                                            <i className="bi bi-person-fill"></i>
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Nhập họ và tên của bạn"
                                            disabled={submitting}
                                        />
                                        {formData.name && !errors.name && (
                                            <div className="input-check">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                        )}
                                    </div>
                                    {errors.name && (
                                        <span className="error-msg">
                                            <i className="bi bi-exclamation-circle-fill"></i>
                                            {errors.name}
                                        </span>
                                    )}
                                </div>

                                {/* Ngày sinh */}
                                <div className="form-group">
                                    <label htmlFor="birthday">
                                        Ngày sinh <span className="required">*</span>
                                    </label>
                                    <div className={`input-wrapper ${errors.birthday ? 'error' : ''} ${formData.birthday ? 'filled' : ''}`}>
                                        <div className="input-icon">
                                            <i className="bi bi-calendar-event-fill"></i>
                                        </div>
                                        <input
                                            type="date"
                                            id="birthday"
                                            name="birthday"
                                            value={formData.birthday}
                                            onChange={handleChange}
                                            max={new Date().toISOString().split('T')[0]}
                                            disabled={submitting}
                                        />
                                        {formData.birthday && !errors.birthday && (
                                            <div className="input-check">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                        )}
                                    </div>
                                    {errors.birthday && (
                                        <span className="error-msg">
                                            <i className="bi bi-exclamation-circle-fill"></i>
                                            {errors.birthday}
                                        </span>
                                    )}
                                </div>

                                {/* Giới tính */}
                                <div className="form-group">
                                    <label htmlFor="gender">
                                        Giới tính <span className="required">*</span>
                                    </label>
                                    <div className={`input-wrapper select-wrapper ${errors.gender ? 'error' : ''} ${formData.gender ? 'filled' : ''}`}>
                                        <div className="input-icon">
                                            <i className={`bi ${formData.gender === 'male' ? 'bi-gender-male' :
                                                formData.gender === 'female' ? 'bi-gender-female' :
                                                    formData.gender === 'other' ? 'bi-gender-ambiguous' :
                                                        'bi-person-fill'
                                                }`}></i>
                                        </div>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            disabled={submitting}
                                            className={formData.gender ? 'selected' : ''}
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="M">Nam</option>
                                            <option value="F">Nữ</option>
                                            <option value="O">Khác</option>
                                        </select>
                                        <div className="select-arrow">
                                            <i className="bi bi-chevron-down"></i>
                                        </div>
                                        {formData.gender && (
                                            <div className="input-check">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                        )}
                                    </div>
                                    {errors.gender && (
                                        <span className="error-msg">
                                            <i className="bi bi-exclamation-circle-fill"></i>
                                            {errors.gender}
                                        </span>
                                    )}
                                </div>

                                {/* Số điện thoại */}
                                <div className="form-group">
                                    <label htmlFor="phone">
                                        Số điện thoại <span className="required">*</span>
                                    </label>
                                    <div className={`input-wrapper ${errors.phone ? 'error' : ''} ${formData.phone ? 'filled' : ''}`}>
                                        <div className="input-icon">
                                            <i className="bi bi-telephone-fill"></i>
                                        </div>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Nhập số điện thoại"
                                            disabled={submitting}
                                        />
                                        {formData.phone && !errors.phone && (
                                            <div className="input-check">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                        )}
                                    </div>
                                    {errors.phone && (
                                        <span className="error-msg">
                                            <i className="bi bi-exclamation-circle-fill"></i>
                                            {errors.phone}
                                        </span>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label htmlFor="email">
                                        Email <span className="required">*</span>
                                    </label>
                                    <div className={`input-wrapper ${errors.email ? 'error' : ''} ${formData.email ? 'filled' : ''}`}>
                                        <div className="input-icon">
                                            <i className="bi bi-envelope-fill"></i>
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="email@example.com"
                                            disabled={submitting}
                                        />
                                        {formData.email && !errors.email && (
                                            <div className="input-check">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                        )}
                                    </div>
                                    {errors.email && (
                                        <span className="error-msg">
                                            <i className="bi bi-exclamation-circle-fill"></i>
                                            {errors.email}
                                        </span>
                                    )}
                                </div>

                                {/* Thông tin khóa học */}
                                <div className="course-info">
                                    <div className="course-label">
                                        <i className="bi bi-book-fill"></i>
                                        <span>Khóa học đăng ký</span>
                                    </div>
                                    <div className="course-name">{courseName}</div>
                                </div>
                            </div>

                            <div className="form-footer">
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border"></span>
                                            <span>Đang gửi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send-fill"></i>
                                            <span>Gửi đăng ký</span>
                                            <i className="bi bi-arrow-right"></i>
                                        </>
                                    )}
                                </button>

                                <div className="form-note">
                                    <i className="bi bi-shield-check"></i>
                                    <span>Thông tin của bạn được bảo mật 100%</span>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <ConfirmRegistration
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                formData={formData}
                courseId={courseId}
                preCourse={preCourse}
            />
        </>
    );
};

export default StudentRegistration;