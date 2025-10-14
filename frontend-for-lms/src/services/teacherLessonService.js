const BASE_URL = 'http://localhost:5000/api/teacher/lessons';

const authHeaders = (options = {}) => {
  const { json = true } = options;
  const token = localStorage.getItem('token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const fetchTeacherLessonSetup = async () => {
  const res = await fetch(`${BASE_URL}/setup`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải dữ liệu thiết lập bài học');
  }
  return data.data || { classes: [], parts: [] };
};

export const createTeacherLesson = async (payload) => {
  const res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tạo bài học mới');
  }
  return data.data || {};
};

export const fetchTeacherMedia = async (type) => {
  const res = await fetch(`${BASE_URL}/media?type=${encodeURIComponent(type)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải thư viện media');
  }
  return data.data?.files || [];
};

export const uploadTeacherMedia = async (type, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/upload?type=${encodeURIComponent(type)}`, {
    method: 'POST',
    headers: authHeaders({ json: false }),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải tệp lên');
  }
  return data.data || {};
};
