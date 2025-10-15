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
    // Part metadata for UI context
    part_id: q.part_id ?? null,
    part_order: q.part_order ?? null,
    part_code: q.part_code ?? '',
    part_name: q.part_name ?? '',
    part_section: q.part_section ?? '',
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

export const getTestAttempts = async (testId, userId) => {
  const url = `${BASE_URL}/${testId}/attempts?user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải lịch sử làm bài');
  return data.data || { attempts: [], best_score: null, count: 0 };
};

export const getStudentTestResults = async (classId, userId) => {
  const url = `${BASE_URL}/class/${encodeURIComponent(classId)}/student-results?user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải kết quả bài kiểm tra');
  return data.data || { tests: [], total_tests: 0, student_info: {} };
};

export const checkTestEligibility = async (testId, userId) => {
  const url = `${BASE_URL}/${encodeURIComponent(testId)}/check-eligibility?user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể kiểm tra quyền làm bài');
  return data.data || { can_attempt: false, attempt_count: 0, max_attempts: 2 };
};

