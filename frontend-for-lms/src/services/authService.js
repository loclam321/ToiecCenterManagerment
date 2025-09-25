// Base API URL - có thể dễ dàng thay đổi cho các môi trường khác nhau
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Lưu thông tin xác thực người dùng
 * @param {object} authData - Dữ liệu xác thực từ API
 */
const saveAuthData = (authData) => {
  if (authData && authData.access_token) {
    localStorage.setItem('token', authData.access_token);
    localStorage.setItem('role', authData.role);
    if (authData.user) {
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
  }
};

/**
 * Xóa thông tin xác thực người dùng (logout)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

/**
 * Kiểm tra người dùng đã đăng nhập chưa
 * @returns {boolean} - true nếu đã đăng nhập
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {object|null} - Thông tin người dùng hoặc null nếu chưa đăng nhập
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Đăng ký học viên mới
 * @param {object} formData - Dữ liệu từ form đăng ký
 * @returns {Promise} - Promise chứa kết quả từ API
 */
export const registerStudent = async (formData) => {
  // Chuyển đổi dữ liệu form thành định dạng API yêu cầu
  const registerData = {
    user_name: formData.fullName,
    user_email: formData.email,
    user_password: formData.password,
    user_gender: formData.gender === 'male' ? 'M' : formData.gender === 'female' ? 'F' : 'O',
    user_birthday: formData.dateOfBirth,
    user_telephone: formData.phone,
    sd_startlv: formData.startLevel || "BEGINNER" // Giá trị mặc định nếu không có
  };
  
  console.log('Sending registration data:', registerData);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    const data = await response.json();
    console.log('Registration API response:', data);
    
    if (!response.ok) {
      // Trích xuất thông báo lỗi chi tiết từ phản hồi API
      const errorMsg = data.message || 
                      (data.error ? data.error : 
                      (data.data && data.data.message ? data.data.message : 'Đăng ký thất bại'));
      throw new Error(errorMsg);
    }
    
    // Lưu thông tin xác thực nếu API trả về
    if (data.data) {
      saveAuthData(data.data);
    }
    
    return data;
  } catch (error) {
    console.error('Registration error details:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc API server.');
    }
    throw error;
  }
};

/**
 * Đăng nhập người dùng
 * @param {object} formData - Dữ liệu từ form đăng nhập
 * @returns {Promise} - Promise chứa kết quả từ API
 */
export const loginUser = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,         // Đã sửa từ user_email thành email
        password: formData.password    // Đã sửa từ user_password thành password
      })
    });
    
    const data = await response.json();
    console.log('Login API response:', data);
    
    if (!response.ok) {
      const errorMsg = data.message || 'Đăng nhập thất bại';
      throw new Error(errorMsg);
    }
    
    // Lưu thông tin xác thực
    if (data.data) {
      saveAuthData(data.data);
    }
    
    return data;
  } catch (error) {
    console.error('Login error details:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    throw error;
  }
};

/**
 * Đặt lại mật khẩu với token
 * @param {object} resetData - Dữ liệu đặt lại mật khẩu
 * @returns {Promise} - Promise chứa kết quả từ API
 */
export const resetPassword = async (resetData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${resetData.token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        new_password: resetData.new_password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.message || 'Đặt lại mật khẩu thất bại';
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error('Password reset error details:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    throw error;
  }
};

/**
 * Gửi yêu cầu đặt lại mật khẩu
 * @param {object} forgotData - Dữ liệu yêu cầu đặt lại (email)
 * @returns {Promise} - Promise chứa kết quả từ API
 */
export const forgotPassword = async (forgotData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: forgotData.email
      })
    });
    
    const data = await response.json();
    
    // Nếu success=true trong data, xem là thành công ngay cả khi message không rõ ràng
    // Đây là điểm an ninh của API để không tiết lộ email tồn tại hay không
    if (data.success === true) {
      return data;
    }
    
    // Nếu không thành công và response không ok
    if (!response.ok) {
      const errorMsg = data.message || 'Gửi yêu cầu đặt lại mật khẩu thất bại';
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error('Forgot password error details:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    throw error;
  }
};