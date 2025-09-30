const BASE_URL = 'http://localhost:5000/api/students';

// Helper function để lấy token
const getHeaders = () => {
  const TOKEN = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': TOKEN ? `Bearer ${TOKEN}` : ''
  };
};

/**
 * Lấy danh sách học viên với phân trang và lọc
 * @param {Object} options - Các tùy chọn lọc và phân trang
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.perPage - Số lượng học viên mỗi trang
 * @param {string} options.search - Từ khóa tìm kiếm
 * @param {string} options.sortBy - Sắp xếp theo trường
 * @param {string} options.sortOrder - Thứ tự sắp xếp (asc/desc)
 * @param {string} options.status - Lọc theo trạng thái
 */
export const getStudents = async (options = {}) => {
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

    const url = `${BASE_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lấy danh sách học viên thất bại');
    }

    return {
      students: result.data?.students || [],
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
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của học viên
 * @param {string} id - ID học viên
 */
export const getStudentById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Lấy thông tin học viên thất bại');
    }

    return result.data?.student || null;
  } catch (error) {
    console.error(`Error fetching student ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo học viên mới
 * @param {Object} studentData - Thông tin học viên
 */
export const createStudent = async (studentData) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Tạo học viên thất bại');
    }

    return result.data?.student || null;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin học viên
 * @param {string} id - ID học viên
 * @param {Object} studentData - Thông tin cập nhật
 */
export const updateStudent = async (id, studentData) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Cập nhật học viên thất bại');
    }

    return result.data?.student || null;
  } catch (error) {
    console.error(`Error updating student ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa học viên
 * @param {string} id - ID học viên
 */
export const deleteStudent = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Xóa học viên thất bại');
    }

    return true;
  } catch (error) {
    console.error(`Error deleting student ${id}:`, error);
    throw error;
  }
};

/**
 * Map API response format sang định dạng frontend
 * @param {Object} apiStudent - Dữ liệu học viên từ API
 */
export const mapStudentFromApi = (apiStudent) => {
  return {
    id: apiStudent.user_id,
    name: apiStudent.user_name,
    email: apiStudent.user_email,
    phone: apiStudent.user_telephone,
    birthday: apiStudent.user_birthday,
    gender: apiStudent.user_gender === 'M' ? 'male' : 
            apiStudent.user_gender === 'F' ? 'female' : 'other',
    startLevel: apiStudent.sd_startlv,
    enrollmentDate: apiStudent.sd_enrollmenttdate,
    createdAt: apiStudent.created_at,
    updatedAt: apiStudent.updated_at
  };
};

/**
 * Map định dạng frontend sang API request format
 * @param {Object} studentData - Dữ liệu học viên từ form frontend
 */
export const mapStudentToApi = (studentData) => {
  return {
    user_name: studentData.name,
    user_email: studentData.email,
    user_telephone: studentData.phone,
    user_birthday: studentData.birthday,
    user_gender: studentData.gender === 'male' ? 'M' : 
                 studentData.gender === 'female' ? 'F' : 'O',
    sd_startlv: studentData.startLevel || 'BEGINNER',
    sd_enrollmenttdate: studentData.enrollmentDate || null
    // Không gửi user_id vì sẽ được tạo bởi backend
  };
};
