import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Lấy thông tin lớp học theo ID
 */
export const getClassById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/classes/${id}`, {
      headers: getAuthHeaders()
    });
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching class ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo lớp học mới
 */
export const createClass = async (classData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/classes`, classData, {
      headers: getAuthHeaders()
    });
    console.log('Class data being sent:', classData);
    console.log('Create class response:', response);
    return response.data;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin lớp học
 */
export const updateClass = async (classId, classData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/classes/${classId}`, classData, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating class ${classId}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách tất cả lớp học
 */
export const getAllClasses = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/classes`, {
      headers: getAuthHeaders(),
      params
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { success: false, data: [] };
  }
};

/**
 * Thêm hàm mới để gọi API mới tạo
 */
export const getClassesList = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/classes/list`, {
      headers: getAuthHeaders(),
      params
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching classes list:', error);
    return { success: false, data: [] };
  }
};

/**
 * Lấy danh sách lớp học cho dropdown select - chỉ lấy các lớp "Chưa lên lịch"
 */
export const getClassesForSelect = async () => {
  try {
    // Sử dụng API list mới thay vì getAllClasses
    const response = await getClassesList();
    
    if (response.success && response.data) {
      // Lọc chỉ lấy các lớp có display_status là "Chưa lên lịch"
      const filteredClasses = response.data.filter(cls => cls.display_status === "Chưa lên lịch");
      
      return filteredClasses.map(cls => ({
        value: cls.class_id,
        label: `${cls.class_name} (${cls.course_name})`,
        data: cls
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error preparing classes for select:', error);
    return [];
  }
};

/**
 * Lấy danh sách lớp học theo khóa học ID
 */
export const getClassesByCourseId = async (courseId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/classes`, {
      headers: getAuthHeaders(),
      params: {
        course_id: courseId,
        page,
        per_page: limit
      }
    });
    
    return {
      classes: response.data.data || [],
      pagination: response.data.pagination || {
        page: 1,
        pages: 1,
        total: 0,
        per_page: limit,
        has_next: false,
        has_prev: false
      }
    };
  } catch (error) {
    console.error(`Error fetching classes for course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Xóa lớp học
 */
export const deleteClass = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/classes/${id}`, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error deleting class ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách học viên trong lớp
 */
export const getClassEnrollments = async (classId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/classes/${classId}/enrollments`, {
      headers: getAuthHeaders(),
      params: {
        page,
        per_page: limit
      }
    });
    
    return {
      enrollments: response.data.data || [],
      pagination: response.data.pagination || {
        page: 1,
        pages: 1,
        total: 0
      }
    };
  } catch (error) {
    console.error(`Error fetching enrollments for class ${classId}:`, error);
    throw error;
  }
};

/**
 * Xóa học viên khỏi lớp học
 */
export const removeStudentFromClass = async (classId, studentId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/classes/${classId}/enrollments/${studentId}`, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error removing student ${studentId} from class ${classId}:`, error);
    throw error;
  }
};

/**
 * Chuyển đổi trạng thái lớp học thành văn bản hiển thị
 */
export const getClassStatusText = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'Đang hoạt động';
    case 'INACTIVE':
      return 'Tạm ngưng';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy';
    case 'UPCOMING':
      return 'Sắp khai giảng';
    default:
      return 'Không xác định';
  }
};

/**
 * Lấy class CSS cho badge hiển thị trạng thái lớp học
 */
export const getClassStatusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'badge-success';
    case 'INACTIVE':
      return 'badge-warning';
    case 'COMPLETED':
      return 'badge-secondary';
    case 'CANCELLED':
      return 'badge-danger';
    case 'UPCOMING':
      return 'badge-info';
    default:
      return 'badge-secondary';
  }
};

/**
 * Lấy class CSS cho badge hiển thị trạng thái chung
 */
export const getDisplayStatusBadgeClass = (status) => {
  switch (status) {
    case 'Đã xác nhận':
      return 'bg-success';
    case 'Đã lên lịch':
      return 'bg-primary';
    case 'Chưa lên lịch':
      return 'bg-warning';
    case 'Đã hoàn thành':
      return 'bg-info';
    case 'ACTIVE':
      return 'bg-success';
    case 'UPCOMING':
      return 'bg-primary';
    case 'COMPLETED':
      return 'bg-info';
    case 'CANCELLED':
      return 'bg-danger';
    case 'INACTIVE':
      return 'bg-secondary';
    default:
      return 'bg-secondary';
  }
};

export default {
  getClassById,
  createClass,
  updateClass,
  getAllClasses,
  getClassesList, // Thêm hàm mới vào export
  getClassesForSelect,
  getClassesByCourseId,
  deleteClass,
  getClassEnrollments,
  removeStudentFromClass,
  getClassStatusText,
  getClassStatusBadgeClass,
  getDisplayStatusBadgeClass
};