const BASE_URL = 'http://localhost:5000/api/tests';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const listTests = async () => {
  const res = await fetch(`${BASE_URL}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách bài kiểm tra');
  // Backend success_response wraps payload in data
  return data.data || [];
};

export const getTestMeta = async (testId) => {
  const res = await fetch(`${BASE_URL}/${testId}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải thông tin bài kiểm tra');
  return data.data || null;
};

export const getTestQuestions = async (testId) => {
  const res = await fetch(`${BASE_URL}/${testId}/questions`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải câu hỏi');
  // The API returns an array directly in data
  const questions = data.data || [];
  // Defensive mapping to unified shape for UI
  return questions.map((q, idx) => ({
    order: q.order ?? idx + 1,
    qs_index: q.qs_index, // item_id
    qs_desciption: q.qs_desciption || q.item_question_text || '',
    item_stimulus_text: q.item_stimulus_text || '',
    item_image_path: q.item_image_path || null,
    item_audio_path: q.item_audio_path || null,
    answers: (q.answers || []).map((a, i) => ({
      as_index: a.as_index, // choice_id
      as_content: a.as_content || '',
      choice_label: a.choice_label || String.fromCharCode(65 + i),
    })),
  }));
};

export const submitTest = async (testId, { user_id, class_id, responses }) => {
  const res = await fetch(`${BASE_URL}/${testId}/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ user_id, class_id, responses }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Nộp bài thất bại');
  return data.data || data;
};

