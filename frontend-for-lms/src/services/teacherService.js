import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

/**
 * Helper function để lấy auth headers theo pattern của dự án
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Lấy danh sách giáo viên với phân trang và lọc
 * @param {Object} options - Các tùy chọn lọc và phân trang
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.perPage - Số lượng giáo viên mỗi trang
 * @param {string} options.search - Từ khóa tìm kiếm
 * @param {string} options.sortBy - Sắp xếp theo trường
 * @param {string} options.sortOrder - Thứ tự sắp xếp (asc/desc)
 * @param {string} options.status - Lọc theo trạng thái
 */
export const getTeachers = async (options = {}) => {
  try {
    const {
      page = 1,
      perPage = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      status = ''
    } = options;

    // Xây dựng query parameters
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', perPage);
    
    if (search) params.append('search', search);
    if (sortBy) {
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
    }
    if (status) params.append('status', status);

    const response = await axios.get(`${API_BASE_URL}/api/teachers/?${params.toString()}`, {
      headers: getAuthHeaders()
    });

    // Trả về response trực tiếp, TeacherManagement sẽ xử lý cấu trúc mới
    return response.data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng');
    }
    
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của giáo viên
 * @param {string} id - ID giáo viên (format: TCH001)
 */
export const getTeacherById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/teachers/${id}`, {
      headers: getAuthHeaders()
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching teacher ${id}:`, error);
    
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng');
    }
    
    throw error;
  }
};

/**
 * Tạo giáo viên mới
 * @param {Object} teacherData - Thông tin giáo viên từ frontend form
 */
export const createTeacher = async (teacherData) => {
  try {
    // Map từ frontend format sang API format
    const apiData = mapTeacherToApi(teacherData);
    
    const response = await axios.post(`${API_BASE_URL}/api/teachers/`, apiData, {
      headers: getAuthHeaders()
    });

    return response.data;
  } catch (error) {
    console.error('Error creating teacher:', error);
    
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng');
    }
    
    throw error;
  }
};

/**
 * Cập nhật thông tin giáo viên
 * @param {string} id - ID giáo viên (format: TCH001)
 * @param {Object} teacherData - Thông tin cập nhật
 */
export const updateTeacher = async (id, teacherData) => {
  try {
    // Map từ frontend format sang API format
    const apiData = mapTeacherToApi(teacherData);
    
    const response = await axios.put(`${API_BASE_URL}/api/teachers/${id}`, apiData, {
      headers: getAuthHeaders()
    });

    return response.data;
  } catch (error) {
    console.error(`Error updating teacher ${id}:`, error);
    
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng');
    }
    
    throw error;
  }
};

/**
 * Xóa giáo viên
 * @param {string} id - ID giáo viên (format: TCH001)
 */
export const deleteTeacher = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/teachers/${id}`, {
      headers: getAuthHeaders()
    });

    return response.data;
  } catch (error) {
    console.error(`Error deleting teacher ${id}:`, error);
    
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng');
    }
    
    throw error;
  }
};

/**
 * Lấy danh sách giáo viên cho dropdown/select options
 */
export const getTeachersForSelect = async () => {
  try {
    const result = await getTeachers({ 
      page: 1, 
      perPage: 100, // Lấy nhiều để có đủ options
      sortBy: 'user_name', 
      sortOrder: 'asc' // Sắp xếp theo tên để dễ tìm
    });
    
    if (result.success && result.data?.teachers) {
      return result.data.teachers.map(teacher => ({
        value: teacher.user_id,
        label: teacher.user_name,
        email: teacher.user_email,
        specialization: teacher.tch_specialization
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching teachers for select:', error);
    return [];
  }
};

/**
 * Kiểm tra email đã tồn tại chưa (cho validation)
 * @param {string} email - Email cần kiểm tra
 * @param {string} excludeId - ID giáo viên cần loại trừ (khi update)
 */
export const checkEmailExists = async (email, excludeId = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/teachers/check-email`, {
      email,
      exclude_id: excludeId
    }, {
      headers: getAuthHeaders()
    });

    return response.data?.exists || false;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

/**
 * Map định dạng frontend sang API request format
 * Theo teacher_model.py structure
 * @param {Object} teacherData - Dữ liệu giáo viên từ form frontend
 */
export const mapTeacherToApi = (teacherData) => {
  const data = {
    // User fields (theo User model pattern)
    user_name: teacherData.name,
    user_email: teacherData.email,
    user_telephone: teacherData.phone,
    user_birthday: teacherData.birthday,
    user_gender: teacherData.gender === 'male' ? 'M' : 
                 teacherData.gender === 'female' ? 'F' : 'O',
    
    // Teacher-specific fields (theo Teacher model)
    tch_specialization: teacherData.specialization,
    tch_qualification: teacherData.qualification,
    tch_hire_date: teacherData.hireDate,
    tch_status: teacherData.status || 'active'
  };
  
  // Chỉ thêm mật khẩu nếu có (khi tạo mới hoặc đổi mật khẩu)
  if (teacherData.password && teacherData.password.trim()) {
    data.user_password = teacherData.password;
  }
  
  return data;
};

/**
 * Map dữ liệu từ API sang định dạng frontend 
 * @param {Object} apiTeacher - Dữ liệu giáo viên từ API response
 */
export const mapTeacherFromApi = (apiTeacher) => {
  if (!apiTeacher) return null;
  
  return {
    id: apiTeacher.user_id,
    name: apiTeacher.user_name,
    email: apiTeacher.user_email,
    phone: apiTeacher.user_telephone,
    birthday: apiTeacher.user_birthday,
    gender: apiTeacher.user_gender === 'M' ? 'male' : 
            apiTeacher.user_gender === 'F' ? 'female' : 'other',
    specialization: apiTeacher.tch_specialization,
    qualification: apiTeacher.tch_qualification,
    hireDate: apiTeacher.tch_hire_date,
    status: apiTeacher.tch_status || 'active',
    createdAt: apiTeacher.created_at,
    updatedAt: apiTeacher.updated_at
  };
};

// Cập nhật export default
const teacherService = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersForSelect,
  checkEmailExists,
  mapTeacherToApi,
  mapTeacherFromApi
};

export default teacherService;