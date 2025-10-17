const BASE_URL = 'http://localhost:5000/api/teacher/tests';

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

export const fetchTeacherTestSetup = async () => {
  const res = await fetch(`${BASE_URL}/setup`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải dữ liệu thiết lập bài kiểm tra');
  }
  return data.data || { classes: [], parts: [] };
};

export const listTeacherTests = async (classId) => {
  const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(classId)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải danh sách bài kiểm tra');
  }
  return data.data || { tests: [], class: {} };
};

export const createTeacherTest = async (payload) => {
  const res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tạo bài kiểm tra');
  }
  return data.data || {};
};

export const fetchTeacherTestDetail = async (testId) => {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(testId)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải chi tiết bài kiểm tra');
  }
  return data.data || { test: {}, items: [] };
};

export const updateTeacherTest = async (testId, payload) => {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(testId)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể cập nhật bài kiểm tra');
  }
  return data.data || {};
};

export const deleteTeacherTest = async (testId) => {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(testId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể xóa bài kiểm tra');
  }
  return data.data || {};
};

export const fetchTeacherTestScoreboard = async (testId) => {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(testId)}/scoreboard`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải bảng điểm bài kiểm tra');
  }
  return data.data || { scoreboard: [], test: {}, total_questions: 0 };
};
