const BASE_URL = 'http://localhost:5000/api/teachers';

// Helper function để lấy token
const getHeaders = () => {
  const TOKEN = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': TOKEN ? `Bearer ${TOKEN}` : ''
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
      headers: getHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lấy danh sách giáo viên thất bại');
    }

    return {
      teachers: result.data?.teachers || [],
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
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của giáo viên
 * @param {string} id - ID giáo viên
 */
export const getTeacherById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lấy thông tin giáo viên thất bại');
    }

    return result.data?.teacher || null;
  } catch (error) {
    console.error(`Error fetching teacher ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo giáo viên mới
 * @param {Object} teacherData - Thông tin giáo viên
 */
export const createTeacher = async (teacherData) => {
  try {
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(teacherData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Tạo giáo viên thất bại');
    }

    return result.data?.teacher || null;
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin giáo viên
 * @param {string} id - ID giáo viên
 * @param {Object} teacherData - Thông tin cập nhật
 */
export const updateTeacher = async (id, teacherData) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(teacherData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Cập nhật giáo viên thất bại');
    }

    return result.data?.teacher || null;
  } catch (error) {
    console.error(`Error updating teacher ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa giáo viên
 * @param {string} id - ID giáo viên
 */
export const deleteTeacher = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Xóa giáo viên thất bại');
    }

    return true;
  } catch (error) {
    console.error(`Error deleting teacher ${id}:`, error);
    throw error;
  }
};

/**
 * Map định dạng frontend sang API request format
 * @param {Object} teacherData - Dữ liệu giáo viên từ form frontend
 */
export const mapTeacherToApi = (teacherData) => {
  const data = {
    user_name: teacherData.name,
    user_email: teacherData.email,
    user_telephone: teacherData.phone,
    user_birthday: teacherData.birthday,
    user_gender: teacherData.gender === 'male' ? 'M' : 
                 teacherData.gender === 'female' ? 'F' : 'O',
    tch_specialization: teacherData.specialization,
    tch_qualification: teacherData.qualification,
    tch_hire_date: teacherData.hireDate
  };
  
  // Chỉ thêm mật khẩu nếu có (khi tạo mới)
  if (teacherData.password) {
    data.user_password = teacherData.password;
  }
  
  return data;
};

export const mapTeacherFromApi = (apiTeacher) => {
  return {
    id: apiTeacher.user_id,
    name: apiTeacher.user_name,
    email: apiTeacher.user_email,
    phone: apiTeacher.user_telephone,
    birthday: apiTeacher.user_birthday,
    gender: apiTeacher.user_gender === 'M' ? 'male' : 
            apiTeacher.user_gender === 'F' ? 'female' : 'other',
    specialization: apiTeacher.tch_specialization || '',
    qualification: apiTeacher.tch_qualification || '',
    hireDate: apiTeacher.tch_hire_date || '',
    experience: apiTeacher.experience || 0,
    status: apiTeacher.status || 'active',
    createdAt: apiTeacher.created_at,
    updatedAt: apiTeacher.updated_at
  };
};