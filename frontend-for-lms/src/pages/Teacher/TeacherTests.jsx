import { useEffect, useMemo, useState } from 'react';
import {
  fetchTeacherTestSetup,
  createTeacherTest,
  fetchTeacherTestDetail,
  updateTeacherTest,
  deleteTeacherTest,
  fetchTeacherTestScoreboard,
} from '../../services/teacherTestService';
import './css/TeacherTests.css';

const defaultChoiceLabels = ['A', 'B', 'C', 'D'];

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildEmptyChoice = (idx) => ({
  id: `choice-${idx}-${generateId()}`,
  label: defaultChoiceLabels[idx] || String.fromCharCode(65 + idx),
  content: '',
  is_correct: idx === 0,
});

const buildEmptyItem = (partId, order) => ({
  id: `item-${order}-${generateId()}`,
  part_id: partId || '',
  stimulus_text: '',
  question_text: '',
  image_path: '',
  audio_path: '',
  choices: defaultChoiceLabels.map((_, idx) => buildEmptyChoice(idx)),
});

const normalizeDateTimeInput = (value) => {
  if (!value) return '';
  try {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '';
    const iso = dt.toISOString();
    return iso.slice(0, 16);
  } catch (err) {
    return '';
  }
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  try {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  } catch (err) {
    return null;
  }
};

function TeacherTests() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [classes, setClasses] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [items, setItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);
  const [editingTestId, setEditingTestId] = useState(null);
  const [form, setForm] = useState({
    test_name: '',
    test_description: '',
    test_duration_min: '',
    max_attempts: 2,
    time_limit_min: '',
    available_from: '',
    due_at: '',
    test_status: 'DRAFT',
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [scoreboardModalOpen, setScoreboardModalOpen] = useState(false);
  const [scoreboardData, setScoreboardData] = useState(null);

  const defaultPartId = useMemo(() => (parts.length ? parts[0].part_id : ''), [parts]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const setup = await fetchTeacherTestSetup();
        if (!mounted) return;
        setClasses(setup.classes || []);
        setParts(setup.parts || []);
        const initialClassId = String(setup.classes?.[0]?.class_id || '');
        setSelectedClassId(initialClassId);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setForm({
      test_name: '',
      test_description: '',
      test_duration_min: '',
      max_attempts: 2,
      time_limit_min: '',
      available_from: '',
      due_at: '',
      test_status: 'DRAFT',
    });
    setItems([]);
    setExpandedItems([]);
    setEditingTestId(null);
    setDetailData(null);
    setDetailModalOpen(false);
  };

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const partId = defaultPartId || parts[0]?.part_id || '';
    setItems((prev) => [...prev, buildEmptyItem(partId, prev.length + 1)]);
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const toggleExpandedItem = (itemId) => {
    setExpandedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  };

  const updateItemField = (itemId, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  };

  const updateChoiceField = (itemId, choiceId, field, value) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        choices: item.choices.map((choice) => (choice.id === choiceId ? { ...choice, [field]: value } : choice)),
      };
    }));
  };

  const addChoice = (itemId) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const newChoice = buildEmptyChoice(item.choices.length);
      return { ...item, choices: [...item.choices, newChoice] };
    }));
  };

  const removeChoice = (itemId, choiceId) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      if (item.choices.length <= 2) return item;
      const filtered = item.choices.filter((choice) => choice.id !== choiceId);
      if (!filtered.some((choice) => choice.is_correct)) {
        filtered[0] = { ...filtered[0], is_correct: true };
      }
      return {
        ...item,
        choices: filtered.map((choice, idx) => ({
          ...choice,
          label: defaultChoiceLabels[idx] || String.fromCharCode(65 + idx),
        })),
      };
    }));
  };

  const toggleCorrectChoice = (itemId, choiceId) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        choices: item.choices.map((choice) => ({
          ...choice,
          is_correct: choice.id === choiceId,
        })),
      };
    }));
  };

  const buildSubmitPayload = () => {
    const { test_name, test_description, test_duration_min, max_attempts, time_limit_min, available_from, due_at, test_status } = form;
    if (!test_name.trim()) {
      setError('Vui lòng nhập tên bài kiểm tra');
      return null;
    }
    if (!selectedClassId) {
      setError('Vui lòng chọn lớp phụ trách');
      return null;
    }
    if (!items.length) {
      setError('Vui lòng thêm ít nhất một câu hỏi');
      return null;
    }

    const processedItems = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.part_id) {
        setError(`Câu hỏi ${index + 1}: vui lòng chọn Part`);
        return null;
      }
      const cleanedChoices = item.choices.filter((choice) => choice.content.trim());
      if (!cleanedChoices.length) {
        setError(`Câu hỏi ${index + 1}: vui lòng nhập nội dung đáp án`);
        return null;
      }
      if (!cleanedChoices.some((choice) => choice.is_correct)) {
        setError(`Câu hỏi ${index + 1}: cần chọn ít nhất một đáp án đúng`);
        return null;
      }
      processedItems.push({
        order: index + 1,
        part_id: Number(item.part_id),
        stimulus_text: item.stimulus_text.trim() || null,
        question_text: item.question_text.trim() || null,
        image_path: item.image_path.trim() || null,
        audio_path: item.audio_path.trim() || null,
        choices: cleanedChoices.map((choice) => ({
          label: choice.label,
          content: choice.content.trim(),
          is_correct: Boolean(choice.is_correct),
        })),
      });
    }

    return {
      class_id: Number(selectedClassId),
      test_name: test_name.trim(),
      test_description: test_description.trim() || null,
      test_duration_min: test_duration_min ? Number(test_duration_min) : null,
      max_attempts: max_attempts ? Number(max_attempts) : 2,
      time_limit_min: time_limit_min ? Number(time_limit_min) : null,
      available_from: toIsoOrNull(available_from),
      due_at: toIsoOrNull(due_at),
      test_status,
      items: processedItems,
    };
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError('');
    setSuccessMessage('');
    const payload = buildSubmitPayload();
    if (!payload) return;

    try {
      setSubmitting(true);
      if (editingTestId) {
        await updateTeacherTest(editingTestId, payload);
        setSuccessMessage('Cập nhật bài kiểm tra thành công');
      } else {
        await createTeacherTest(payload);
        setSuccessMessage('Tạo bài kiểm tra thành công');
      }
      resetForm();
    } catch (err) {
      setError(err.message || (editingTestId ? 'Không thể cập nhật bài kiểm tra' : 'Không thể tạo bài kiểm tra mới'));
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (testId, mode = 'view') => {
    setError('');
    try {
      const detail = await fetchTeacherTestDetail(testId);
      if (mode === 'view') {
        setDetailData(detail);
        setDetailModalOpen(true);
      } else if (mode === 'edit') {
        setEditingTestId(testId);
        const { test, items: sourceItems } = detail;
        setSelectedClassId(String(test.class_id || selectedClassId));
        setForm({
          test_name: test.test_name || '',
          test_description: test.test_description || '',
          test_duration_min: test.test_duration_min ?? '',
          max_attempts: test.max_attempts ?? 2,
          time_limit_min: test.time_limit_min ?? '',
          available_from: normalizeDateTimeInput(test.available_from),
          due_at: normalizeDateTimeInput(test.due_at),
          test_status: test.test_status || 'DRAFT',
        });
        setItems((sourceItems || []).map((item, idx) => ({
          id: `item-edit-${idx}-${generateId()}`,
          part_id: item.part_id || defaultPartId || '',
          stimulus_text: item.stimulus_text || '',
          question_text: item.question_text || '',
          image_path: item.image_path || '',
          audio_path: item.audio_path || '',
          choices: (item.choices || []).map((choice) => ({
            id: `choice-edit-${choice.choice_id || generateId()}`,
            label: choice.label || '',
            content: choice.content || '',
            is_correct: Boolean(choice.is_correct),
          })),
        })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết bài kiểm tra');
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này?')) return;
    try {
      await deleteTeacherTest(testId);
      setSuccessMessage('Đã xóa bài kiểm tra');
    } catch (err) {
      setError(err.message || 'Không thể xóa bài kiểm tra');
    }
  };

  const openScoreboard = async (testId) => {
    setError('');
    try {
      const data = await fetchTeacherTestScoreboard(testId);
      setScoreboardData(data);
      setScoreboardModalOpen(true);
    } catch (err) {
      setError(err.message || 'Không thể tải bảng điểm');
    }
  };

  if (loading) {
    return <div className="teacher-tests card p-4 text-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="teacher-tests">
      <form className="card test-form" onSubmit={handleSubmit}>
        <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              {editingTestId ? (
                <>
                  Chỉnh sửa bài kiểm tra <span className="badge bg-warning text-dark ms-2">Đang sửa</span>
                </>
              ) : (
                'Thêm bài kiểm tra mới'
              )}
            </h5>
            <small className="text-muted">Chọn lớp phụ trách để bắt đầu</small>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetForm} disabled={submitting}>
              {editingTestId ? 'Hủy chỉnh sửa' : 'Đặt lại'}
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Đang lưu...' : (editingTestId ? 'Cập nhật bài kiểm tra' : 'Lưu bài kiểm tra')}
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger small mb-3">{error}</div>}
          {successMessage && <div className="alert alert-success small mb-3">{successMessage}</div>}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Lớp phụ trách</label>
              <select
                className="form-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                required
              >
                {(classes || []).map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name || cls.class_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Tên bài kiểm tra</label>
              <input
                type="text"
                className="form-control"
                value={form.test_name}
                onChange={(e) => updateFormField('test_name', e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-select"
                value={form.test_status}
                onChange={(e) => updateFormField('test_status', e.target.value)}
              >
                <option value="DRAFT">Nháp</option>
                <option value="ACTIVE">Mở cho học sinh</option>
                <option value="INACTIVE">Tạm khóa</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.test_description}
                onChange={(e) => updateFormField('test_description', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Thời lượng (phút)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.test_duration_min}
                onChange={(e) => updateFormField('test_duration_min', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Giới hạn lượt làm</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={form.max_attempts}
                onChange={(e) => updateFormField('max_attempts', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <label className="form-label">Thời gian giới hạn (phút)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.time_limit_min}
                onChange={(e) => updateFormField('time_limit_min', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Mở từ (YYYY-MM-DD HH:MM)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.available_from}
                onChange={(e) => updateFormField('available_from', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Đóng lúc (YYYY-MM-DD HH:MM)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.due_at}
                onChange={(e) => updateFormField('due_at', e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h6 className="mb-0">Câu hỏi ({items.length})</h6>
              <small className="text-muted">Thêm các câu hỏi trắc nghiệm với đáp án đúng</small>
            </div>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItem} disabled={submitting}>
              + Thêm câu hỏi
            </button>
          </div>

          {!items.length ? (
            <div className="card border-0 bg-light-subtle text-muted text-center py-4">
              Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
            </div>
          ) : (
            items.map((item, idx) => {
              const isExpanded = expandedItems.includes(item.id);
              return (
                <div key={item.id} className="test-item card shadow-sm mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span>Câu hỏi #{idx + 1}</span>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => toggleExpandedItem(item.id)}
                      >
                        {isExpanded ? 'Thu gọn' : 'Mở rộng'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeItem(item.id)}
                        disabled={submitting}
                      >
                        Xóa câu hỏi
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Part TOEIC</label>
                        <select
                          className="form-select"
                          value={item.part_id}
                          onChange={(e) => updateItemField(item.id, 'part_id', e.target.value)}
                        >
                          {(parts || []).map((part) => (
                            <option key={part.part_id} value={part.part_id}>
                              {part.part_section} · {part.part_code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">Nội dung câu hỏi</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={item.question_text}
                          onChange={(e) => updateItemField(item.id, 'question_text', e.target.value)}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="expanded-section">
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Mô tả tình huống</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={item.stimulus_text}
                              onChange={(e) => updateItemField(item.id, 'stimulus_text', e.target.value)}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Đường dẫn hình ảnh</label>
                            <input
                              type="text"
                              className="form-control"
                              value={item.image_path}
                              onChange={(e) => updateItemField(item.id, 'image_path', e.target.value)}
                              placeholder="/img-test/question.png"
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Đường dẫn audio</label>
                            <input
                              type="text"
                              className="form-control"
                              value={item.audio_path}
                              onChange={(e) => updateItemField(item.id, 'audio_path', e.target.value)}
                              placeholder="/audio-for-test/file.mp3"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="choice-grid">
                      {item.choices.map((choice) => (
                        <div key={choice.id} className={`choice-card ${choice.is_correct ? 'correct' : ''}`}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`correct-${item.id}`}
                                checked={choice.is_correct}
                                onChange={() => toggleCorrectChoice(item.id, choice.id)}
                              />
                              <label className="form-check-label">Đáp án đúng</label>
                            </div>
                            <button
                              type="button"
                              className="btn btn-link text-danger p-0"
                              onClick={() => removeChoice(item.id, choice.id)}
                              disabled={item.choices.length <= 2 || submitting}
                            >
                              Xóa
                            </button>
                          </div>
                          <div className="mb-2">
                            <label className="form-label small">Nhãn</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={choice.label}
                              onChange={(e) => updateChoiceField(item.id, choice.id, 'label', e.target.value.toUpperCase().slice(0, 2))}
                            />
                          </div>
                          <div>
                            <label className="form-label small">Nội dung</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={choice.content}
                              onChange={(e) => updateChoiceField(item.id, choice.id, 'content', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-end mt-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addChoice(item.id)}>
                        + Thêm đáp án
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </form>

      {/* History section removed per latest requirements */}

      {detailModalOpen && detailData && (
        <div className="tests-modal-backdrop" role="dialog" aria-modal="true">
          <div className="tests-modal card shadow-lg">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Chi tiết bài kiểm tra</h5>
                <small className="text-muted">Xem lại nội dung câu hỏi và đáp án</small>
              </div>
              <button type="button" className="btn-close" onClick={() => setDetailModalOpen(false)} aria-label="Đóng" />
            </div>
            <div className="card-body tests-modal-body">
              <h5 className="mb-3">{detailData.test?.test_name || 'Bài kiểm tra'}</h5>
              {detailData.test?.test_description && <p className="text-muted">{detailData.test.test_description}</p>}
              <div className="d-flex flex-wrap gap-3 mb-3 text-muted small">
                <span>Thời lượng: {detailData.test?.test_duration_min ?? '—'} phút</span>
                <span>Giới hạn lượt: {detailData.test?.max_attempts ?? 2}</span>
                {detailData.test?.available_from && <span>Mở từ: {new Date(detailData.test.available_from).toLocaleString('vi-VN')}</span>}
                {detailData.test?.due_at && <span>Đóng lúc: {new Date(detailData.test.due_at).toLocaleString('vi-VN')}</span>}
              </div>
              <div className="test-preview-questions">
                {(detailData.items || []).map((item, idx) => (
                  <div key={item.item_id || idx} className="preview-question-card border rounded mb-3 p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-semibold">Câu {idx + 1}</div>
                        {item.question_text ? <p className="mb-2">{item.question_text}</p> : <p className="text-muted mb-2">(Chưa có nội dung)</p>}
                      </div>
                      {item.part_id && <span className="badge bg-secondary">Part #{item.part_id}</span>}
                    </div>
                    {item.stimulus_text && <p className="text-muted small mb-2">{item.stimulus_text}</p>}
                    {(item.image_path || item.audio_path) && (
                      <div className="mb-3">
                        {item.image_path && <div className="text-muted small">Hình: {item.image_path}</div>}
                        {item.audio_path && <div className="text-muted small">Audio: {item.audio_path}</div>}
                      </div>
                    )}
                    <ul className="list-unstyled mb-0">
                      {(item.choices || []).map((choice, choiceIdx) => (
                        <li key={choice.choice_id || choiceIdx} className={`preview-choice ${choice.is_correct ? 'preview-choice-correct' : ''}`}>
                          <strong className="me-2">{choice.label || String.fromCharCode(65 + choiceIdx)}.</strong>
                          {choice.content || <span className="text-muted">(Trống)</span>}
                          {choice.is_correct && <span className="badge bg-success ms-2">Đúng</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-footer text-end">
              <button type="button" className="btn btn-secondary" onClick={() => setDetailModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {scoreboardModalOpen && scoreboardData && (
        <div className="tests-modal-backdrop" role="dialog" aria-modal="true">
          <div className="tests-modal card shadow-lg">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Bảng điểm bài kiểm tra</h5>
                <small className="text-muted">Thống kê lượt làm và điểm cao nhất của học viên</small>
              </div>
              <button type="button" className="btn-close" onClick={() => setScoreboardModalOpen(false)} aria-label="Đóng" />
            </div>
            <div className="card-body tests-modal-body">
              <h5 className="mb-3">{scoreboardData.test?.test_name || 'Bài kiểm tra'}</h5>
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Học viên</th>
                      <th>Lượt làm</th>
                      <th>Điểm cao nhất (0-10)</th>
                      <th>Điểm (%)</th>
                      <th>Lần cuối</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(scoreboardData.scoreboard || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">Chưa có học viên nào làm bài.</td>
                      </tr>
                    ) : (
                      scoreboardData.scoreboard.map((row, idx) => (
                        <tr key={row.user_id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="fw-semibold">{row.student_name || row.user_id}</div>
                            {row.enrollment_status && <div className="text-muted small">Trạng thái: {row.enrollment_status}</div>}
                          </td>
                          <td>{row.attempt_count}</td>
                          <td>{typeof row.best_score_10 === 'number' ? row.best_score_10.toFixed(row.best_score_10 % 1 === 0 ? 0 : 2) : '—'}</td>
                          <td>{typeof row.best_percentage === 'number' ? `${row.best_percentage.toFixed(1)}%` : '—'}</td>
                          <td>{row.last_submitted_at ? new Date(row.last_submitted_at).toLocaleString('vi-VN') : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {(scoreboardData.scoreboard || []).length > 0 && (
                <div className="scoreboard-note text-muted small mt-3">
                  * Điểm cao nhất được tính theo số câu đúng / tổng số câu hỏi ({scoreboardData.total_questions || '—'}).
                </div>
              )}
            </div>
            <div className="card-footer text-end">
              <button type="button" className="btn btn-secondary" onClick={() => setScoreboardModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherTests;
