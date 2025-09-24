import { useState } from 'react';

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
        <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
                <label htmlFor="fullName">Họ và tên</label>
                <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={formValues.fullName}
                    onChange={handleChange}
                />
                {errors.fullName && <div className="error-text">{errors.fullName}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formValues.email}
                    onChange={handleChange}
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="dateOfBirth">Ngày sinh</label>
                <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formValues.dateOfBirth}
                    onChange={handleChange}
                />
                {errors.dateOfBirth && <div className="error-text">{errors.dateOfBirth}</div>}
            </div>

            <div className="form-group">
                <label>Giới tính</label>
                <div className="gender-options">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={formValues.gender === 'male'}
                            onChange={handleChange}
                        />
                        Nam
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={formValues.gender === 'female'}
                            onChange={handleChange}
                        />
                        Nữ
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="other"
                            checked={formValues.gender === 'other'}
                            onChange={handleChange}
                        />
                        Khác
                    </label>
                </div>
                {errors.gender && <div className="error-text">{errors.gender}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="VD: 0912345678"
                    value={formValues.phone}
                    onChange={handleChange}
                />
                {errors.phone && <div className="error-text">{errors.phone}</div>}
                <div className="help-text">Nhập số điện thoại Việt Nam (10 số)</div>
            </div>

            <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••"
                    value={formValues.password}
                    onChange={handleChange}
                />
                {errors.password && <div className="error-text">{errors.password}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                />
                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
            </div>

            <button type="submit" className="submit-btn">
                Đăng ký
            </button>
        </form>
    );
}

export default RegisterForm;