const API_BASE_URL = 'http://localhost:5000/api';

export const fetchLearningPathsWithCourse = async () => {
  const res = await fetch(`${API_BASE_URL}/courses/learning-paths`);
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể tải lộ trình');
  }
  return data.data.learning_paths || [];
};

export const setCourseStatus = async (courseId, status) => {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/status`, {
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
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/toggle`, {
    method: 'PATCH'
  });
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể đổi trạng thái khoá học');
  }
  return data.data.course;
};

export const fetchCoursesSummary = async () => {
  const res = await fetch(`${API_BASE_URL}/courses/summary`);
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể tải danh sách khóa học');
  }
  return data.data.courses || [];
};

export const fetchLearningPathsByCourse = async (courseId) => {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/learning-paths`);
  const data = await res.json();
  if (!res.ok || data.success !== true) {
    throw new Error(data.message || 'Không thể tải lộ trình của khóa học');
  }
  return data.data;
};


