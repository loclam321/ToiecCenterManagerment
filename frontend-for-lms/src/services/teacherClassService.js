const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const BASE_URL = `${API_BASE_URL}/api/teacher/classes`;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchTeacherClasses = async () => {
  const res = await fetch(BASE_URL, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải danh sách lớp học');
  }
  return data.data || [];
};

export default {
  fetchTeacherClasses,
};
