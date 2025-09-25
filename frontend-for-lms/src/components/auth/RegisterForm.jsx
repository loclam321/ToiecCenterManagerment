import { useState } from 'react';
import './css/RegisterForm.css'; // Tạo file CSS riêng nếu cần

function RegisterForm({ onSubmit }) {
    const [formValues, setFormValues] = useState({
        fullName: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePhone = (phone) => {
        const re = /^(0|\+84)(\s|\.)?[0-9]{9,10}$/;
        return re.test(String(phone));
    };

    const validate = () => {
        const nextErrors = {};

        if (!formValues.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ tên.';
        if (!validateEmail(formValues.email)) nextErrors.email = 'Email không hợp lệ.';
        if (!formValues.dateOfBirth) nextErrors.dateOfBirth = 'Vui lòng chọn ngày sinh.';
        if (!formValues.gender) nextErrors.gender = 'Vui lòng chọn giới tính.';
        if (!validatePhone(formValues.phone)) nextErrors.phone = 'Số điện thoại không hợp lệ.';
        if ((formValues.password || '').length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
        if (formValues.password !== formValues.confirmPassword)
            nextErrors.confirmPassword = 'Xác nhận mật khẩu không trùng.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit(formValues);
    };

    return (
        <form className="registration-form" onSubmit={handleSubmit} noValidate>
            <div className="row">
                <div className="col-md-12">
                    <div className="form-group mb-3">
                        <label className="form-label" htmlFor="fullName">Họ và tên</label>
                        <input
                            className="form-control"
                            id="fullName"
                            name="fullName"
                            type="text"
                            placeholder="VD: Nguyễn Văn A"
                            value={formValues.fullName}
                            onChange={handleChange}
                        />
                        {errors.fullName && <div className="error-text text-danger small">{errors.fullName}</div>}
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            className="form-control"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formValues.email}
                            onChange={handleChange}
                        />
                        {errors.email && <div className="error-text text-danger small">{errors.email}</div>}
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="form-label" htmlFor="phone">Số điện thoại</label>
                        <input
                            className="form-control"
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="VD: 0912345678"
                            value={formValues.phone}
                            onChange={handleChange}
                        />
                        {errors.phone && <div className="error-text text-danger small">{errors.phone}</div>}
                        <div className="help-text text-muted small">Nhập số điện thoại Việt Nam (10 số)</div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="form-label" htmlFor="dateOfBirth">Ngày sinh</label>
                        <input
                            className="form-control"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formValues.dateOfBirth}
                            onChange={handleChange}
                        />
                        {errors.dateOfBirth && <div className="error-text text-danger small">{errors.dateOfBirth}</div>}
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="form-label d-block">Giới tính</label>
                        <div className="gender-options d-flex gap-4 mt-2">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="genderMale"
                                    name="gender"
                                    value="male"
                                    checked={formValues.gender === 'male'}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="genderMale">
                                    Nam
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="genderFemale"
                                    name="gender"
                                    value="female"
                                    checked={formValues.gender === 'female'}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="genderFemale">
                                    Nữ
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="genderOther"
                                    name="gender"
                                    value="other"
                                    checked={formValues.gender === 'other'}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="genderOther">
                                    Khác
                                </label>
                            </div>
                        </div>
                        {errors.gender && <div className="error-text text-danger small">{errors.gender}</div>}
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="form-label" htmlFor="password">Mật khẩu</label>
                        <input
                            className="form-control"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••"
                            value={formValues.password}
                            onChange={handleChange}
                        />
                        {errors.password && <div className="error-text text-danger small">{errors.password}</div>}
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <input
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            value={formValues.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <div className="error-text text-danger small">{errors.confirmPassword}</div>}
                    </div>
                </div>
            </div>

            <div className="d-grid mt-4">
                <button type="submit" className="btn btn-primary btn-lg">
                    Đăng ký
                </button>
            </div>
        </form>
    );
}

export default RegisterForm;