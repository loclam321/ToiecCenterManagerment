import { getToken } from './authService';

const BASE_URL = 'http://localhost:5000/api/courses';

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Lấy danh sách khóa học
export const getCourses = async (options = {}) => {
  try {
    const { page = 1, perPage = 10, search = '', sortBy = '', sortOrder = '', status = '', level = '', mode = '' } = options;
    
    let url = `${BASE_URL}/page?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sortBy) url += `&sort_by=${sortBy}`;
    if (sortOrder) url += `&sort_order=${sortOrder}`;
    if (status) url += `&status=${status}`;
    if (level) url += `&level=${level}`;

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tải danh sách khóa học');
    }

    return {
      courses: result.data.courses,
      pagination: result.data.pagination
    };
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Lấy thông tin chi tiết khóa học
export const getCourseById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tải thông tin khóa học');
    }

    return result.data; // Trả về result.data thay vì result.data.course
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

// Tạo khóa học mới
export const createCourse = async (courseData) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData)
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tạo khóa học mới');
    }

    return result.data.course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Cập nhật khóa học
export const updateCourse = async (id, courseData) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData)
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể cập nhật khóa học');
    }

    return result.data.course;
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    throw error;
  }
};

// Xóa khóa học
export const deleteCourse = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể xóa khóa học');
    }

    return true;
  } catch (error) {
    console.error(`Error deleting course ${id}:`, error);
    throw error;
  }
};

// Chuyển đổi trạng thái
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'OPEN': return 'badge-success';
    case 'CLOSED': return 'badge-danger';
    case 'UPCOMING': return 'badge-warning';
    case 'COMPLETED': return 'badge-secondary';
    default: return 'badge-secondary';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'OPEN': return 'Đang mở';
    case 'CLOSED': return 'Đã đóng';
    case 'UPCOMING': return 'Sắp mở';
    case 'COMPLETED': return 'Đã kết thúc';
    default: return 'Không xác định';
  }
};

// Chuyển đổi trình độ
export const getLevelText = (level) => {
  switch (level) {
    case 'BEGINNER': return 'Cơ bản';
    case 'INTERMEDIATE': return 'Trung cấp';
    case 'ADVANCED': return 'Nâng cao';
    default: return level;
  }
};

// Format hiển thị tiền tệ
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Format hiển thị ngày tháng
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

export const fetchLearningPathsWithCourse = async () => {
  const res = await fetch(`${BASE_URL}/learning-paths`);
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể tải lộ trình');
  }
  return data.data.learning_paths || [];
};

export const setCourseStatus = async (courseId, status) => {
  const res = await fetch(`${BASE_URL}/${courseId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_status: status })
  });
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể cập nhật trạng thái khoá học');
  }
  return data.data.course;
};

export const toggleCourseStatus = async (courseId) => {
  const res = await fetch(`${BASE_URL}/${courseId}/toggle`, {
    method: 'PATCH'
  });
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể đổi trạng thái khoá học');
  }
  return data.data.course;
};

export const fetchCoursesSummary = async () => {
  const res = await fetch(`${BASE_URL}/summary`);
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể tải danh sách khóa học');
  }
  return data.data.courses || [];
};

export const fetchLearningPathsByCourse = async (courseId) => {
  const res = await fetch(`${BASE_URL}/${courseId}/learning-paths`);
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể tải lộ trình của khóa học');
  }
  return data.data;
};
