const BASE_URL = 'http://localhost:5000/api/student/lessons';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchStudentLessons = async (classId) => {
  const query = classId ? `?class_id=${encodeURIComponent(classId)}` : '';
  const res = await fetch(`${BASE_URL}${query}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải danh sách bài học');
  }
  return data.data || { lessons: [], classes: [] };
};

export const fetchLessonDetail = async (lessonId) => {
  const res = await fetch(`${BASE_URL}/${lessonId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải thông tin bài học');
  }
  return data.data || { lesson: null, questions: [] };
};

export const submitLessonQuiz = async (lessonId, responses) => {
  const res = await fetch(`${BASE_URL}/${lessonId}/quiz`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ responses }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể nộp bài luyện tập');
  }
  return data.data || data;
};
