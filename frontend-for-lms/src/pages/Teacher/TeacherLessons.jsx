import { useEffect, useMemo, useState } from 'react';
import { fetchTeacherLessonSetup, createTeacherLesson, fetchTeacherMedia, uploadTeacherMedia } from '../../services/teacherLessonService';
import './css/TeacherLessons.css';

const defaultChoiceLabels = ['A', 'B', 'C', 'D'];

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildEmptyChoice = (label, idx) => ({
  id: `${label}-${idx}-${generateId()}`,
  label,
  content: '',
  is_correct: idx === 0,
});

const buildEmptyItem = (index) => ({
  id: `item-${index}-${generateId()}`,
  stimulus_text: '',
  question_text: '',
  image_path: '',
  audio_path: '',
  choices: defaultChoiceLabels.map((label, idx) => buildEmptyChoice(label, idx)),
});

function TeacherLessons() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [classes, setClasses] = useState([]);
  const [parts, setParts] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState({
    video: [],
    audio: [],
    image: [],
  });
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [form, setForm] = useState({
    class_id: '',
    part_id: '',
    lesson_name: '',
    available_from: '',
    video_link: '',
  });
  const [items, setItems] = useState([buildEmptyItem(1)]);

  const selectedClass = useMemo(
    () => classes.find((cls) => Number(cls.class_id) === Number(form.class_id)),
    [classes, form.class_id]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchTeacherLessonSetup();
        if (!mounted) return;
        setClasses(data.classes || []);
        setParts(data.parts || []);
        if ((data.classes || []).length && !form.class_id) {
          setForm((prev) => ({ ...prev, class_id: data.classes[0].class_id }));
        }
        if ((data.parts || []).length && !form.part_id) {
          setForm((prev) => ({ ...prev, part_id: data.parts[0].part_id }));
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Không thể tải dữ liệu thiết lập');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [video, audio, image] = await Promise.all([
          fetchTeacherMedia('video'),
          fetchTeacherMedia('audio'),
          fetchTeacherMedia('image'),
        ]);
        if (!mounted) return;
        setMediaLibrary({ video, audio, image });
      } catch (err) {
        if (!mounted) return;
        setError((prev) => prev || err.message || 'Không thể tải thư viện media');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItemField = (itemId, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  };

  const updateChoiceField = (itemId, choiceId, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          choices: item.choices.map((choice) =>
            choice.id === choiceId ? { ...choice, [field]: value } : choice
          ),
        };
      })
    );
  };

  const toggleCorrectChoice = (itemId, choiceId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          choices: item.choices.map((choice) => ({
            ...choice,
            is_correct: choice.id === choiceId,
          })),
        };
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, buildEmptyItem(prev.length + 1)]);
  };

  const removeItem = (itemId) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== itemId) : prev));
  };

  const addChoice = (itemId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextLabel = String.fromCharCode(65 + item.choices.length);
        const newChoice = buildEmptyChoice(nextLabel, item.choices.length);
        return {
          ...item,
          choices: [...item.choices, newChoice],
        };
      })
    );
  };

  const removeChoice = (itemId, choiceId) => {
    setItems((prev) =>
      prev.map((item) => {
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
            label: String.fromCharCode(65 + idx),
          })),
        };
      })
    );
  };

  const resetForm = () => {
    setForm({
      class_id: classes[0]?.class_id || '',
      part_id: parts[0]?.part_id || '',
      lesson_name: '',
      available_from: '',
      video_link: '',
    });
    setItems([buildEmptyItem(1)]);
  };

  const refreshMediaType = async (type) => {
    try {
      const list = await fetchTeacherMedia(type);
      setMediaLibrary((prev) => ({ ...prev, [type]: list }));
    } catch (err) {
      setError((prev) => prev || err.message || `Không thể làm mới thư viện ${type}`);
    }
  };

  const handleFileUpload = async (mediaType, file, itemId = null) => {
    if (!file) return;
    setError('');
    setSuccessMessage('');
    const targetKey = { mediaType, itemId };
    try {
      setUploadingTarget(targetKey);
      const result = await uploadTeacherMedia(mediaType, file);
      const appliedPath = result.path;
      if (mediaType === 'video') {
        updateFormField('video_link', appliedPath);
      } else if (mediaType === 'image' && itemId) {
        updateItemField(itemId, 'image_path', appliedPath);
      } else if (mediaType === 'audio' && itemId) {
        updateItemField(itemId, 'audio_path', appliedPath);
      }
      await refreshMediaType(mediaType);
      setSuccessMessage(`Đã tải lên "${result.original_name || file.name}". Đường dẫn: ${appliedPath}`);
    } catch (err) {
      setError(err.message || 'Tải tệp lên thất bại');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!form.lesson_name.trim()) {
      setError('Vui lòng nhập tên bài học');
      return;
    }

    const preparedItems = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const filteredChoices = item.choices.filter((choice) => choice.content.trim());
      if (!filteredChoices.length) {
        setError(`Item ${index + 1}: nhập nội dung cho ít nhất một lựa chọn`);
        return;
      }
      if (!filteredChoices.some((choice) => choice.is_correct)) {
        setError(`Item ${index + 1}: cần có đáp án đúng`);
        return;
      }
      preparedItems.push({
        order: index + 1,
        stimulus_text: item.stimulus_text.trim() || null,
        question_text: item.question_text.trim() || null,
        image_path: item.image_path.trim() || null,
        audio_path: item.audio_path.trim() || null,
        choices: filteredChoices.map((choice) => ({
          label: choice.label,
          content: choice.content.trim(),
          is_correct: Boolean(choice.is_correct),
        })),
      });
    }

    const payload = {
      class_id: Number(form.class_id),
      part_id: Number(form.part_id),
      lesson_name: form.lesson_name.trim(),
      available_from: form.available_from || null,
      video_link: form.video_link.trim() || null,
      items: preparedItems,
    };

    try {
      setSubmitting(true);
      await createTeacherLesson(payload);
      setSuccessMessage('Tạo bài học thành công');
      resetForm();
    } catch (err) {
      setError(err.message || 'Không thể tạo bài học mới');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="teacher-lessons card p-4 text-center">Đang tải dữ liệu...</div>;
  }

  if (error && !submitting && !successMessage && !items.length) {
    return <div className="teacher-lessons card p-4 text-danger">{error}</div>;
  }

  return (
    <div className="teacher-lessons">
      <form className="card lesson-form" onSubmit={handleSubmit}>
        <div className="card-header d-flex flex-column flex-md-row justify-content-between gap-2">
          <div>
            <h5 className="mb-1">Thêm bài học mới</h5>
            {selectedClass ? (
              <small className="text-muted">
                Lớp {selectedClass.class_name || selectedClass.class_id} · Khóa {selectedClass.course_name || selectedClass.course_id}
              </small>
            ) : (
              <small className="text-muted">Chọn lớp phụ trách để bắt đầu</small>
            )}
          </div>
          <div className="d-flex gap-2 align-items-center">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetForm} disabled={submitting}>
              Đặt lại
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu bài học'}
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
                value={form.class_id}
                onChange={(e) => updateFormField('class_id', e.target.value)}
                required
              >
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name || cls.class_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Part TOEIC</label>
              <select
                className="form-select"
                value={form.part_id}
                onChange={(e) => updateFormField('part_id', e.target.value)}
                required
              >
                {parts.map((part) => (
                  <option key={part.part_id} value={part.part_id}>
                    {part.part_section} · {part.part_code}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Ngày mở (YYYY-MM-DD)</label>
              <input
                type="date"
                className="form-control"
                value={form.available_from}
                onChange={(e) => updateFormField('available_from', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label">Tên bài học</label>
              <input
                type="text"
                className="form-control"
                value={form.lesson_name}
                onChange={(e) => updateFormField('lesson_name', e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Video bài học (lưu tại public/video → đường dẫn /video/...)</label>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  list="teacher-video-options"
                  placeholder="/video/ten_file.mp4"
                  value={form.video_link}
                  onChange={(e) => updateFormField('video_link', e.target.value)}
                />
                <label className="btn btn-outline-secondary mb-0" style={{ minWidth: '110px' }}>
                  {uploadingTarget?.mediaType === 'video' ? 'Đang tải...' : 'Chọn tệp'}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    hidden
                    disabled={uploadingTarget?.mediaType === 'video'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleFileUpload('video', file);
                      if (e.target) e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <small className="text-muted">Các tệp sẽ được lưu trên server tại frontend-for-lms/public/video</small>
              <datalist id="teacher-video-options">
                {mediaLibrary.video.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.name}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Câu hỏi luyện tập ({items.length})</h6>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItem} disabled={submitting}>
              + Thêm câu hỏi
            </button>
          </div>

          <div className="lesson-items">
            {items.map((item, idx) => (
              <div key={item.id} className="lesson-item card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>Câu hỏi #{idx + 1}</span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => addChoice(item.id)}
                      disabled={submitting}
                    >
                      + Thêm lựa chọn
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeItem(item.id)}
                      disabled={submitting || items.length === 1}
                    >
                      Xóa câu hỏi
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Mô tả tình huống (stimulus)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={item.stimulus_text}
                        onChange={(e) => updateItemField(item.id, 'stimulus_text', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nội dung câu hỏi</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={item.question_text}
                        onChange={(e) => updateItemField(item.id, 'question_text', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Hình minh hoạ (lưu tại public/img-test → đường dẫn /img-test/...)</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="/img-test/hinh.png"
                          list={`image-options-${item.id}`}
                          value={item.image_path}
                          onChange={(e) => updateItemField(item.id, 'image_path', e.target.value)}
                        />
                        <label className="btn btn-outline-secondary mb-0" style={{ minWidth: '110px' }}>
                          {uploadingTarget?.mediaType === 'image' && uploadingTarget?.itemId === item.id ? 'Đang tải...' : 'Chọn tệp'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            hidden
                            disabled={uploadingTarget?.mediaType === 'image' && uploadingTarget?.itemId === item.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleFileUpload('image', file, item.id);
                              if (e.target) e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <small className="text-muted">Ảnh được phục vụ từ thư mục frontend-for-lms/public/img-test</small>
                      <datalist id={`image-options-${item.id}`}>
                        {mediaLibrary.image.map((file) => (
                          <option key={file.path} value={file.path}>
                            {file.name}
                          </option>
                        ))}
                      </datalist>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Audio luyện nghe (lưu tại public/audio-for-test → đường dẫn /audio-for-test/...)</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="/audio-for-test/file.mp3"
                          list={`audio-options-${item.id}`}
                          value={item.audio_path}
                          onChange={(e) => updateItemField(item.id, 'audio_path', e.target.value)}
                        />
                        <label className="btn btn-outline-secondary mb-0" style={{ minWidth: '110px' }}>
                          {uploadingTarget?.mediaType === 'audio' && uploadingTarget?.itemId === item.id ? 'Đang tải...' : 'Chọn tệp'}
                          <input
                            type="file"
                            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/m4a,audio/aac"
                            hidden
                            disabled={uploadingTarget?.mediaType === 'audio' && uploadingTarget?.itemId === item.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleFileUpload('audio', file, item.id);
                              if (e.target) e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <small className="text-muted">Âm thanh sẽ được lưu tại frontend-for-lms/public/audio-for-test</small>
                      <datalist id={`audio-options-${item.id}`}>
                        {mediaLibrary.audio.map((file) => (
                          <option key={file.path} value={file.path}>
                            {file.name}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="choice-grid">
                    {item.choices.map((choice) => (
                      <div key={choice.id} className={`choice-card ${choice.is_correct ? 'correct' : ''}`}>
                        <div className="choice-header d-flex justify-content-between mb-2">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

export default TeacherLessons;
