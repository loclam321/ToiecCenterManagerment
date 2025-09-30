const API_BASE_URL = 'http://localhost:5000/api';

export async function fetchTestMeta(testId) {
  const res = await fetch(`${API_BASE_URL}/tests/${testId}`);
  if (!res.ok) {
    throw new Error('Không thể tải thông tin bài kiểm tra');
  }
  return await res.json();
}

export async function fetchTestQuestions(testId) {
  const res = await fetch(`${API_BASE_URL}/tests/${testId}/questions`);
  if (!res.ok) {
    throw new Error('Không thể tải danh sách câu hỏi');
  }
  return await res.json();
}

export async function submitTest(testId, payload) {
  const res = await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || 'Nộp bài thất bại';
    throw new Error(msg);
  }
  return data;
}


