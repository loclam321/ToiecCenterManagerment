const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const BASE_URL = `${API_BASE_URL}/api/teachers`;

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
      sortBy = '',
      sortOrder = 'asc',
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

    const url = `${BASE_URL}/?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lấy danh sách giáo viên thất bại');
    }

    // Theo pattern của dự án, API response có structure với 'data' property
    return {
      teachers: (result.data?.teachers || []).map(teacher => mapTeacherFromApi(teacher)),
      pagination: result.data?.pagination || {
        page: 1,
        pages: 1,
        per_page: 10,
        total: 0,
        has_next: false,
        has_prev: false
      }
    };
  } catch (error) {
    console.error('Error fetching teachers:', error);
    
    // Network error detection theo pattern dự án
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng');
    }
    
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của giáo viên
 * @param {string} id - ID giáo viên (format: T00000001)
 */
export const getTeacherById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lấy thông tin giáo viên thất bại');
    }

    // Map teacher data từ API format sang frontend format
    return result.data?.teacher ? mapTeacherFromApi(result.data.teacher) : null;
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
    
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(apiData)
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle validation errors theo pattern dự án
      if (response.status === 400 && result.errors) {
        const errorMessages = Object.values(result.errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(result.message || 'Tạo giáo viên thất bại');
    }

    // Return mapped teacher data
    return result.data?.teacher ? mapTeacherFromApi(result.data.teacher) : null;
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
 * @param {string} id - ID giáo viên (format: T00000001)
 * @param {Object} teacherData - Thông tin cập nhật
 */
export const updateTeacher = async (id, teacherData) => {
  try {
    // Map từ frontend format sang API format
    const apiData = mapTeacherToApi(teacherData);
    
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(apiData)
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 400 && result.errors) {
        const errorMessages = Object.values(result.errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(result.message || 'Cập nhật giáo viên thất bại');
    }

    return result.data?.teacher ? mapTeacherFromApi(result.data.teacher) : null;
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
 * @param {string} id - ID giáo viên (format: T00000001)
 */
export const deleteTeacher = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Xóa giáo viên thất bại');
    }

    return true;
  } catch (error) {
    console.error(`Error deleting teacher ${id}:`, error);
    
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng');
    }
    
    throw error;
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
    tch_experience_years: teacherData.experience || 0,
    tch_status: teacherData.status || 'active'
  };
  
  // Đưa avatar path vào API nếu có
  if (teacherData.avatarPath) {
    data.tch_avtlink = teacherData.avatarPath;
  }
  
  // Chỉ thêm mật khẩu nếu có (khi tạo mới hoặc đổi mật khẩu)
  if (teacherData.password && teacherData.password.trim()) {
    data.user_password = teacherData.password;
  }
  
  return data;
};

/**
 * Map API response format sang frontend format
 * @param {Object} apiTeacher - Teacher data từ API
 */
export const mapTeacherFromApi = (apiTeacher) => {
  const normalizeAvatarPath = (p) => {
    if (!p) return '';
    if (/^(https?:|data:)/i.test(p)) return p; // absolute url or data uri
    let path = String(p).replace(/\\/g, '/');
    const lower = path.toLowerCase();
    const publicIdx = lower.indexOf('/public/');
    if (publicIdx !== -1) {
      path = path.substring(publicIdx + '/public'.length); // keep leading slash before avatar
    }
    const avatarIdx = path.toLowerCase().indexOf('/avatar/');
    if (avatarIdx !== -1) {
      path = path.substring(avatarIdx);
    }
    if (!path.startsWith('/')) path = '/' + path;
    return path;
  };

  return {
    // ID theo pattern T00000001
    id: apiTeacher.user_id || apiTeacher.tch_id,
    
    // User information
    name: apiTeacher.user_name || '',
    email: apiTeacher.user_email || '',
    phone: apiTeacher.user_telephone || '',
    birthday: apiTeacher.user_birthday || '',
    gender: apiTeacher.user_gender === 'M' ? 'male' : 
            apiTeacher.user_gender === 'F' ? 'female' : 'other',
    
    // Teacher-specific information
    specialization: apiTeacher.tch_specialization || '',
    qualification: apiTeacher.tch_qualification || '',
    hireDate: apiTeacher.tch_hire_date || '',
    experience: apiTeacher.tch_experience_years || 0,
    status: apiTeacher.tch_status || 'active',
    
  // Avatar (đã normalize về web path)
  avatarPath: normalizeAvatarPath(apiTeacher.tch_avtlink),
    
    // Metadata
    createdAt: apiTeacher.created_at || apiTeacher.user_created_at,
    updatedAt: apiTeacher.updated_at || apiTeacher.user_updated_at,
    
    // Additional computed fields
    displayName: apiTeacher.user_name || 'Không có tên',
    isActive: apiTeacher.tch_status === 'active'
  };
};

/**
 * Lấy danh sách giáo viên cho dropdown/select options
 */
export const getTeachersForSelect = async () => {
  try {
    const result = await getTeachers({ 
      page: 1, 
      perPage: 100, // Lấy nhiều để có đủ options
      status: 'active' // Chỉ lấy giáo viên active
    });
    
    return result.teachers.map(teacher => ({
      value: teacher.id,
      label: teacher.displayName,
      email: teacher.email
    }));
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
    const response = await fetch(`${BASE_URL}/check-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        email,
        exclude_id: excludeId 
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return false; // Nếu API chưa có endpoint này, return false
    }

    return result.data?.exists || false;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

// Export default object với tất cả methods
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