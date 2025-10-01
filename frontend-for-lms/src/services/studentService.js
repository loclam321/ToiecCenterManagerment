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



// Lấy danh sách học viên với các tùy chọn lọc và phân trang
export const getStudentsforEnrollment = async (filters = {}, page = 1, limit = 20) => {
  try {
    // Xây dựng query string từ các tùy chọn lọc
    const queryParams = new URLSearchParams();
    
    // Thêm các tham số lọc
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.email) queryParams.append('email', filters.email);
    if (filters.status) queryParams.append('status', filters.status);
    
    // Thêm tham số phân trang
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await fetch(`${BASE_URL}?${queryParams.toString()}`, {
      headers: getHeaders()
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tải danh sách học viên');
    }

    return {
      students: result.data,
      pagination: result.pagination || {
        currentPage: page,
        totalPages: Math.ceil((result.total || 0) / limit),
        totalItems: result.total || 0,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Error fetching filtered students:', error);
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
// Thêm học viên vào lớp học - Xử lý trường hợp học viên đã đăng ký
export const enrollStudentsToClass = async (classId, studentIds) => {
  try {
    // Mảng lưu các kết quả
    const results = {
      success: [], // Học viên đăng ký thành công
      alreadyEnrolled: [], // Học viên đã đăng ký trước đó
      failed: [] // Lỗi khác
    };

    // Xử lý tuần tự từng học viên
    for (const studentId of studentIds) {
      try {
        const response = await fetch(`http://localhost:5000/api/classes/${classId}/enroll`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ student_id: studentId })
        });
        
        const result = await response.json();

        if (result.success) {
          // Đăng ký thành công
          results.success.push(studentId);
        } else if (result.message && result.message.includes("already enrolled")) {
          // Học viên đã đăng ký trước đó
          results.alreadyEnrolled.push(studentId);
        } else {
          // Lỗi khác
          results.failed.push({
            id: studentId,
            message: result.message || 'Lỗi không xác định'
          });
        }
      } catch (error) {
        results.failed.push({
          id: studentId,
          message: error.message || 'Lỗi kết nối'
        });
      }
    }

    // Tạo thông báo kết quả
    const message = [];
    if (results.success.length > 0) {
      message.push(`Đã thêm ${results.success.length} học viên vào lớp thành công.`);
    }
    if (results.alreadyEnrolled.length > 0) {
      message.push(`${results.alreadyEnrolled.length} học viên đã đăng ký lớp học này trước đó.`);
    }
    if (results.failed.length > 0) {
      message.push(`${results.failed.length} học viên không thể thêm vào lớp do lỗi.`);
    }

    // Luôn trả về một đối tượng kết quả thay vì ném lỗi
    return {
      message: message.join(' '),
      results,
      // Thêm thông tin về trạng thái chung
      status: results.success.length > 0 ? 'success' : 
              results.alreadyEnrolled.length > 0 ? 'alreadyEnrolled' : 'failed',
      isFullSuccess: results.success.length === studentIds.length,
      isAllAlreadyEnrolled: results.alreadyEnrolled.length === studentIds.length && results.success.length === 0,
      isAllFailed: results.failed.length === studentIds.length && results.success.length === 0
    };
  } catch (error) {
    console.error('Error enrolling students:', error);
    // Trả về đối tượng lỗi thay vì ném ngoại lệ
    return {
      message: error.message || 'Không thể thêm học viên vào lớp học.',
      results: {
        success: [],
        alreadyEnrolled: [],
        failed: studentIds.map(id => ({ id, message: error.message || 'Lỗi kết nối' }))
      },
      status: 'error'
    };
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
