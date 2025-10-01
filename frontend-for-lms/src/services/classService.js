import { getToken } from './authService';

const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Lấy danh sách lớp học của khóa học
export const getClassesByCourseId = async (courseId) => {
  try {
    const response = await fetch(`${BASE_URL}/classes/by-course/${courseId}`, {
      headers: getHeaders()
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tải danh sách lớp học');
    }

    return {
      classes: result.data,
    };
  } catch (error) {
    console.error(`Error fetching classes for course ${courseId}:`, error);
    throw error;
  }
};

// Lấy thông tin chi tiết lớp học
export const getClassById = async (classId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
      headers: getHeaders()
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tải thông tin lớp học');
    }

    return result.data;
  } catch (error) {
    console.error(`Error fetching class ${classId}:`, error);
    throw error;
  }
};

// Thêm lớp học mới cho khóa học
export const createClass = async (courseId, classData) => {
  try {
    // Chỉ gửi các thông tin cần thiết theo API
    const payload = {
      course_id: courseId,
      class_name: classData.class_name,
      class_startdate: classData.class_startdate,
      class_enddate: classData.class_enddate,
      class_maxstudents: parseInt(classData.class_maxstudents),
      class_currentenrollment: 0, // Mặc định khi tạo mới
      class_status: classData.class_status
    };

    const response = await fetch(`http://localhost:5000/api/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tạo lớp học mới');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

// Cập nhật lớp học
export const updateClass = async (classId, classData) => {
  try {
    const response = await fetch(`${BASE_URL}/classes/${classId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(classData)
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể cập nhật lớp học');
    }

    return result.data;
  } catch (error) {
    console.error(`Error updating class ${classId}:`, error);
    throw error;
  }
};

// Xóa lớp học
export const deleteClass = async (classId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể xóa lớp học');
    }

    return true;
  } catch (error) {
    console.error(`Error deleting class ${classId}:`, error);
    throw error;
  }
};

// Thêm các hàm helper cho việc xử lý trạng thái

export const getClassStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'badge-success';
    case 'upcoming':
      return 'badge-warning';
    case 'completed':
      return 'badge-secondary';
    case 'cancelled':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};

export const getClassStatusText = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'Đang diễn ra';
    case 'upcoming':
      return 'Sắp khai giảng';
    case 'completed':
      return 'Đã kết thúc';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

// Thêm hàm mới để lấy danh sách học viên đã đăng ký trong lớp học
export const getClassEnrollments = async (classId, page = 1, limit = 10) => {
  try {
    const response = await fetch(`${BASE_URL}/classes/${classId}/enrollments?page=${page}&limit=${limit}`, {
      headers: getHeaders()
    });
    
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tải danh sách học viên đã đăng ký');
    }

    return {
      enrollments: result.data,
      pagination: result.meta || {
        page: page,
        pages: 1,
        total: result.data.length,
        per_page: limit,
        has_next: false,
        has_prev: false
      }
    };
  } catch (error) {
    console.error(`Error fetching enrollments for class ${classId}:`, error);
    throw error;
  }
};

// Thêm hàm xóa học viên khỏi lớp
export const removeStudentFromClass = async (classId, studentId) => {
  try {
    const response = await fetch(`${BASE_URL}/classes/${classId}/enrollments/${studentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể xóa học viên khỏi lớp');
    }

    return true;
  } catch (error) {
    console.error(`Error removing student ${studentId} from class ${classId}:`, error);
    throw error;
  }
};