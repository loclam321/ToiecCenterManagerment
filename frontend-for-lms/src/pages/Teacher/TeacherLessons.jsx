import { useEffect, useMemo, useState } from 'react';
import { 
  fetchTeacherLessonSetup, 
  createTeacherLesson, 
  fetchTeacherMedia, 
  uploadTeacherMedia,
  fetchTeacherLessonHistory,
  fetchTeacherLessonDetail,
  updateTeacherLesson,
  deleteTeacherLesson,
} from '../../services/teacherLessonService';
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
  const [bulkRaw, setBulkRaw] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [inputMode, setInputMode] = useState('manual');
  const [form, setForm] = useState({
    class_id: '',
    part_id: '',
    lesson_name: '',
    available_from: '',
    video_link: '',
  });
  const [items, setItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [lessonHistory, setLessonHistory] = useState([]);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [detailLesson, setDetailLesson] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((cls) => Number(cls.class_id) === Number(form.class_id)),
    [classes, form.class_id]
  );
  const selectedPart = useMemo(
    () => parts.find((part) => Number(part.part_id) === Number(form.part_id)),
    [parts, form.part_id]
  );
  const classDateConstraints = useMemo(() => {
    if (!selectedClass) return null;
    const rawStart = selectedClass.class_startdate;
    const rawEnd = selectedClass.class_enddate;
    const normalize = (value) => {
      if (!value) return '';
      const [datePart] = value.split('T');
      return datePart || value;
    };
    const min = normalize(rawStart);
    const max = normalize(rawEnd);
    if (!min && !max) return null;
    return { min: min || '', max: max || '' };
  }, [selectedClass]);

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

  useEffect(() => {
    if (!classDateConstraints) return;
    const { min, max } = classDateConstraints;
    setForm((prev) => {
      let nextDate = prev.available_from || '';
      if (!nextDate && min) {
        nextDate = min;
      }
      if (nextDate && min && nextDate < min) {
        nextDate = min;
      }
      if (nextDate && max && nextDate > max) {
        nextDate = max;
      }
      if (nextDate === prev.available_from) return prev;
      return { ...prev, available_from: nextDate };
    });
  }, [classDateConstraints?.min, classDateConstraints?.max]);

  useEffect(() => {
    if (!form.class_id) return;
    let mounted = true;
    (async () => {
      try {
        const data = await fetchTeacherLessonHistory(form.class_id);
        if (!mounted) return;
        setLessonHistory(data.lessons || []);
      } catch (err) {
        if (!mounted) return;
        console.error('Không thể tải lịch sử bài học:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [form.class_id]);

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
    setItems((prev) => prev.filter((item) => item.id !== itemId));
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
    setItems([]);
    setExpandedItems([]);
    setPreviewOpen(false);
    setPendingPayload(null);
    setEditingLessonId(null);
  };

  const mapLessonItemsToForm = (items) => {
    return items.map((item, idx) => ({
      id: `item-${idx}-${generateId()}`,
      stimulus_text: item.stimulus_text || '',
      question_text: item.question_text || '',
      image_path: item.image_path || '',
      audio_path: item.audio_path || '',
      choices: (item.choices || []).map((choice) => ({
        id: `${choice.label}-${generateId()}`,
        label: choice.label || '',
        content: choice.content || '',
        is_correct: Boolean(choice.is_correct),
      })),
    }));
  };

  const populateFormFromLesson = (lessonData, { mode = 'edit' } = {}) => {
    const { lesson, part, items } = lessonData;
    
    setForm({
      class_id: form.class_id,
      part_id: part?.part_id || lesson?.part_id || '',
      lesson_name: mode === 'clone' ? `${lesson?.lesson_name || ''} (Bản sao)` : (lesson?.lesson_name || ''),
      available_from: lesson?.available_from || '',
      video_link: lesson?.video_link || '',
    });

    setItems(mapLessonItemsToForm(items || []));
    setExpandedItems([]);
  };

  const handleViewLesson = async (lessonId) => {
    setError('');
    try {
      const data = await fetchTeacherLessonDetail(lessonId);
      setDetailLesson(data);
      setDetailModalOpen(true);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết bài học');
    }
  };

  const handleCloneLesson = async (lessonId) => {
    setError('');
    setSuccessMessage('');
    try {
      const data = await fetchTeacherLessonDetail(lessonId);
      populateFormFromLesson(data, { mode: 'clone' });
      setEditingLessonId(null);
      setSuccessMessage('Đã sao chép bài học vào form. Bạn có thể chỉnh sửa và lưu.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Không thể sao chép bài học');
    }
  };

  const handleEditLesson = async (lessonId) => {
    setError('');
    setSuccessMessage('');
    try {
      const data = await fetchTeacherLessonDetail(lessonId);
      populateFormFromLesson(data, { mode: 'edit' });
      setEditingLessonId(lessonId);
      setSuccessMessage('Đã tải bài học vào form chỉnh sửa.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Không thể tải bài học để chỉnh sửa');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    const lesson = lessonHistory.find((l) => l.lesson_id === lessonId);
    const confirmMsg = lesson 
      ? `Bạn có chắc muốn xóa bài học "${lesson.lesson_name}"?\n\nLưu ý: Tất cả câu hỏi liên quan sẽ bị xóa vĩnh viễn.`
      : 'Bạn có chắc muốn xóa bài học này?';
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setError('');
    setSuccessMessage('');
    try {
      await deleteTeacherLesson(lessonId);
      setSuccessMessage('Đã xóa bài học thành công');
      
      // Refresh history
      const data = await fetchTeacherLessonHistory(form.class_id);
      setLessonHistory(data.lessons || []);
      
      // Reset form if editing the deleted lesson
      if (editingLessonId === lessonId) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || 'Không thể xóa bài học');
    }
  };

  const refreshMediaType = async (type) => {
    try {
      const list = await fetchTeacherMedia(type);
      setMediaLibrary((prev) => ({ ...prev, [type]: list }));
    } catch (err) {
      setError((prev) => prev || err.message || `Không thể làm mới thư viện ${type}`);
    }
  };

  const switchInputMode = (mode) => {
    setInputMode(mode);
    if (mode !== 'bulk') {
      setBulkError('');
    }
    setExpandedItems([]);
  };

  const isBulkMode = inputMode === 'bulk';

  const toggleExpandedItem = (itemId) => {
    setExpandedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  };

  const formatPreviewDate = (value) => {
    if (!value) return 'Không thiết lập';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Không hợp lệ';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const renderMediaInputs = (item, { idSuffix = 'default' } = {}) => {
    const imageListId = `image-options-${idSuffix}-${item.id}`;
    const audioListId = `audio-options-${idSuffix}-${item.id}`;
    return (
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Hình minh hoạ (lưu tại public/img-test → đường dẫn /img-test/...)</label>
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control"
              placeholder="/img-test/hinh.png"
              list={imageListId}
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
          <datalist id={imageListId}>
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
              list={audioListId}
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
          <datalist id={audioListId}>
            {mediaLibrary.audio.map((file) => (
              <option key={file.path} value={file.path}>
                {file.name}
              </option>
            ))}
          </datalist>
        </div>
      </div>
    );
  };

  const renderItemEditor = (item) => (
    <>
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
      {renderMediaInputs(item, { idSuffix: 'manual' })}

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
    </>
  );

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

  const isUpperCaseAnswer = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const hasLetter = /[A-ZÀ-Ỵ]/.test(trimmed);
    return hasLetter && trimmed === trimmed.toUpperCase();
  };

  const normalizeCorrectAnswer = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const handleBulkImport = () => {
    setBulkError('');
    setError('');
    setSuccessMessage('');

    const lines = bulkRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!lines.length) {
      setBulkError('Vui lòng nhập ít nhất một dòng dữ liệu.');
      return;
    }

    const importedItems = [];

    try {
      lines.forEach((line, lineIndex) => {
        const segments = line.split(',').map((segment) => segment.trim()).filter((segment) => segment.length > 0);
        if (segments.length < 2) {
          throw new Error(`Dòng ${lineIndex + 1}: cần tối thiểu câu hỏi và một đáp án.`);
        }

        const [question, ...answerSegments] = segments;

        if (answerSegments.length === 0) {
          throw new Error(`Dòng ${lineIndex + 1}: thiếu đáp án.`);
        }

        const choices = answerSegments.map((answer, idx) => {
          const isUpper = isUpperCaseAnswer(answer);
          const label = defaultChoiceLabels[idx] || String.fromCharCode(65 + idx);
          const content = isUpper ? normalizeCorrectAnswer(answer) : answer;
          return {
            id: `${label}-${generateId()}`,
            label,
            content,
            is_correct: isUpper,
          };
        });

        if (!choices.some((choice) => choice.is_correct)) {
          throw new Error(`Dòng ${lineIndex + 1}: cần ít nhất một đáp án ghi HOA toàn bộ để xác định đáp án đúng.`);
        }

        importedItems.push({
          id: `item-bulk-${generateId()}`,
          stimulus_text: '',
          question_text: question,
          image_path: '',
          audio_path: '',
          choices,
        });
      });

      setItems((prev) => [...prev, ...importedItems]);
      setBulkRaw('');
      setBulkError('');
      setSuccessMessage(`Đã thêm ${importedItems.length} câu hỏi từ nhập nhanh.`);
    } catch (importError) {
      setBulkError(importError.message);
    }
  };

  const buildLessonPayload = () => {
    const lessonName = form.lesson_name.trim();
    if (!lessonName) {
      setError('Vui lòng nhập tên bài học');
      return null;
    }

    if (!items.length) {
      setError('Vui lòng thêm ít nhất một câu hỏi.');
      return null;
    }

    const toTimestamp = (value) => {
      if (!value) return null;
      const ts = new Date(value).getTime();
      if (Number.isNaN(ts)) return null;
      return ts;
    };

    const preparedItems = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const filteredChoices = item.choices.filter((choice) => choice.content.trim());
      if (!filteredChoices.length) {
        setError(`Item ${index + 1}: nhập nội dung cho ít nhất một lựa chọn`);
        return null;
      }
      if (!filteredChoices.some((choice) => choice.is_correct)) {
        setError(`Item ${index + 1}: cần có đáp án đúng`);
        return null;
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
      lesson_name: lessonName,
      available_from: form.available_from || null,
      video_link: form.video_link.trim() || null,
      items: preparedItems,
    };

    if (classDateConstraints) {
      const minTs = toTimestamp(classDateConstraints.min);
      const maxTs = toTimestamp(classDateConstraints.max);
      const availableTs = toTimestamp(payload.available_from);
      if (availableTs !== null) {
        if (minTs !== null && availableTs < minTs) {
          setError('Ngày mở phải bắt đầu từ ngày khai giảng của lớp.');
          return null;
        }
        if (maxTs !== null && availableTs > maxTs) {
          setError('Ngày mở không được vượt quá ngày kết thúc của lớp.');
          return null;
        }
      }
    }

    return payload;
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    setError('');
    setSuccessMessage('');
    const payload = buildLessonPayload();
    if (!payload) return;
    setPendingPayload(payload);
    setPreviewOpen(true);
  };

  const confirmSubmitLesson = async () => {
    if (!pendingPayload) return;
    setError('');
    setSuccessMessage('');
    try {
      setSubmitting(true);
      
      if (editingLessonId) {
        await updateTeacherLesson(editingLessonId, pendingPayload);
        setSuccessMessage('Cập nhật bài học thành công');
      } else {
        await createTeacherLesson(pendingPayload);
        setSuccessMessage('Tạo bài học thành công');
      }
      
      resetForm();
      
      // Refresh history
      const data = await fetchTeacherLessonHistory(form.class_id);
      setLessonHistory(data.lessons || []);
    } catch (err) {
      setError(err.message || (editingLessonId ? 'Không thể cập nhật bài học' : 'Không thể tạo bài học mới'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPreview = () => {
    if (submitting) return;
    setPreviewOpen(false);
    setPendingPayload(null);
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
            <h5 className="mb-1">
              {editingLessonId ? (
                <>
                  Chỉnh sửa bài học <span className="badge bg-warning text-dark ms-2">Đang sửa</span>
                </>
              ) : (
                'Thêm bài học mới'
              )}
            </h5>
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
              {editingLessonId ? 'Hủy chỉnh sửa' : 'Đặt lại'}
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Đang lưu...' : (editingLessonId ? 'Cập nhật bài học' : 'Lưu bài học')}
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
                min={classDateConstraints?.min || undefined}
                max={classDateConstraints?.max || undefined}
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

          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
            <span className="text-muted small">Chọn cách nhập câu hỏi:</span>
            <div className="btn-group btn-group-sm" role="group" aria-label="Chọn cách nhập câu hỏi">
              <button
                type="button"
                className={`btn ${inputMode === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => switchInputMode('manual')}
              >
                <span className="me-1" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 1a1 1 0 0 1 .7.3l1.5 1.5a1 1 0 0 1 0 1.4l-8.5 8.5-3.2.7.7-3.2 8.5-8.5A1 1 0 0 1 12.5 1Z" />
                    <path d="M2 12.6V15h2.4l7.8-7.8-2.4-2.4L2 12.6Z" />
                  </svg>
                </span>
                Nhập từng câu
              </button>
              <button
                type="button"
                className={`btn ${inputMode === 'bulk' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => switchInputMode('bulk')}
              >
                <span className="me-1" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 3h12v1H2V3Z" />
                    <path d="M2 7h12v1H2V7Z" />
                    <path d="M2 11h12v1H2v-1Z" />
                    <circle cx="1" cy="3.5" r="0.6" />
                    <circle cx="1" cy="7.5" r="0.6" />
                    <circle cx="1" cy="11.5" r="0.6" />
                  </svg>
                </span>
                Nhập nhanh
              </button>
            </div>
          </div>

          {inputMode === 'bulk' && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <strong>Nhập nhanh câu hỏi (mỗi dòng một câu):</strong>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-2">
                  Cấu trúc: <code>Câu hỏi, Đáp án A, Đáp án B, ...</code>. Đáp án đúng viết HOA TOÀN BỘ. Sau khi phân tích bạn có thể đính kèm hình/audio cho từng câu ở phần xem trước bên dưới.
                </p>
                <pre className="bulk-example mb-3">How old are you?, I'M 12 YEARS OLD, people call me Loc, fine, ok</pre>
                <textarea
                  className="form-control mb-2"
                  rows={4}
                  placeholder="Câu hỏi, Đáp án A, Đáp án B, Đáp án C, Đáp án D"
                  value={bulkRaw}
                  onChange={(e) => setBulkRaw(e.target.value)}
                />
                {bulkError && <div className="alert alert-warning small mb-2">{bulkError}</div>}
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setBulkRaw('');
                      setBulkError('');
                    }}
                    disabled={!bulkRaw}
                  >
                    Xóa nội dung
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleBulkImport}
                    disabled={!bulkRaw.trim()}
                  >
                    Thêm câu hỏi
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center flex-column flex-md-row gap-2 mb-3">
            <div className="text-center text-md-start">
              <h6 className="mb-0">Câu hỏi luyện tập ({items.length})</h6>
              <small className="text-muted">Dữ liệu chỉ được lưu khi bạn bấm "Lưu bài học".</small>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={addItem}
              disabled={submitting || isBulkMode}
            >
              + Thêm câu hỏi
            </button>
          </div>

          <div className="lesson-items">
            {!items.length ? (
              <div className="card border-0 bg-light-subtle text-muted text-center py-4">
                {isBulkMode ? 'Chưa có câu hỏi nào. Dùng "Nhập nhanh" để dán danh sách câu hỏi.' : 'Chưa có câu hỏi nào. Nhấn "+ Thêm câu hỏi" để bắt đầu.'}
              </div>
            ) : (
              items.map((item, idx) => {
                const isExpanded = expandedItems.includes(item.id);
                return (
                  <div key={item.id} className="lesson-item card shadow-sm mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <span>Câu hỏi #{idx + 1}</span>
                      <div className="d-flex gap-2">
                        {!isBulkMode && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => addChoice(item.id)}
                            disabled={submitting}
                          >
                            + Thêm lựa chọn
                          </button>
                        )}
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
                      {isBulkMode ? (
                        <>
                          <div className="bulk-preview">
                            <div className="bulk-preview-section mb-3">
                              <strong className="d-block mb-1">Nội dung câu hỏi</strong>
                              <p className="mb-0">{item.question_text || <span className="text-muted">(Chưa có nội dung)</span>}</p>
                            </div>
                            {(item.stimulus_text || item.image_path || item.audio_path) && (
                              <div className="bulk-preview-section mb-3">
                                <strong className="d-block mb-1">Thông tin bổ sung</strong>
                                {item.stimulus_text && <p className="mb-1">Mô tả: {item.stimulus_text}</p>}
                                {item.image_path && <p className="mb-1">Hình: {item.image_path}</p>}
                                {item.audio_path && <p className="mb-0">Audio: {item.audio_path}</p>}
                              </div>
                            )}
                            <div className="bulk-preview-media border rounded p-3 bg-light-subtle mb-3">
                              <h6 className="mb-2">Đính kèm media</h6>
                              <p className="text-muted small mb-3">Chọn ảnh/audio nếu cần cập nhật lại trước khi lưu bài học.</p>
                              {renderMediaInputs(item, { idSuffix: 'bulk' })}
                            </div>
                            <div className="bulk-preview-section">
                              <strong className="d-block mb-2">Danh sách đáp án</strong>
                              <ul className="list-unstyled mb-0 bulk-choice-list">
                                {item.choices.map((choice) => (
                                  <li key={choice.id} className={`bulk-choice-item ${choice.is_correct ? 'bulk-choice-correct' : ''}`}>
                                    <span className="bulk-choice-label">{choice.label}.</span>
                                    <span className="bulk-choice-content">{choice.content || <span className="text-muted">(Trống)</span>}</span>
                                    {choice.is_correct && <span className="ms-2 badge bg-success">Đúng</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="d-flex justify-content-end mt-3">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => toggleExpandedItem(item.id)}
                            >
                              {isExpanded ? 'Thu gọn' : 'Chỉnh sửa chi tiết'}
                            </button>
                          </div>
                          {isExpanded && <div className="mt-3 pt-3 border-top">{renderItemEditor(item)}</div>}
                        </>
                      ) : (
                        renderItemEditor(item)
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </form>

      {lessonHistory.length > 0 && (
        <div className="card lesson-history mt-4">
          <div className="card-header">
            <h5 className="mb-0">Lịch sử bài học đã tạo ({lessonHistory.length})</h5>
            <small className="text-muted">
              Danh sách các bài học đã được tạo cho lớp {selectedClass?.class_name || 'này'}
            </small>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {lessonHistory.map((lesson) => (
                <div key={lesson.lesson_id} className="col-md-6 col-lg-4">
                  <div className="card shadow-sm h-100 lesson-history-card">
                    <div className="card-body">
                      <h6 className="card-title mb-2">{lesson.lesson_name}</h6>
                      <div className="lesson-meta text-muted small mb-3">
                        <div className="mb-1">
                          <strong>Part:</strong> {lesson.part?.part_section || 'N/A'} - {lesson.part?.part_code || 'N/A'}
                        </div>
                        <div className="mb-1">
                          <strong>Ngày mở:</strong> {lesson.available_from ? new Date(lesson.available_from).toLocaleDateString('vi-VN') : 'Chưa đặt'}
                        </div>
                        <div>
                          <strong>Số câu hỏi:</strong> {lesson.item_count || 0}
                        </div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewLesson(lesson.lesson_id)}
                          disabled={submitting}
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleCloneLesson(lesson.lesson_id)}
                          disabled={submitting}
                        >
                          Sao chép
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleEditLesson(lesson.lesson_id)}
                          disabled={submitting}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteLesson(lesson.lesson_id)}
                          disabled={submitting}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {previewOpen && pendingPayload && (
        <div className="lesson-preview-backdrop" role="dialog" aria-modal="true">
          <div className="lesson-preview-modal card shadow-lg">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Xem trước bài học</h5>
                <small className="text-muted">Kiểm tra lại nội dung trước khi xuất bản cho học viên.</small>
              </div>
              <button type="button" className="btn-close" onClick={cancelPreview} disabled={submitting} aria-label="Đóng xem trước" />
            </div>
            <div className="card-body lesson-preview-body">
              {error && (
                <div className="alert alert-danger small">
                  {error}
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
                <span className="badge bg-primary">
                  {selectedPart ? `${selectedPart.part_section} · ${selectedPart.part_code}` : 'Part chưa xác định'}
                </span>
                <span className="badge bg-secondary">
                  {selectedClass ? `Lớp ${selectedClass.class_name || selectedClass.class_id}` : 'Chưa chọn lớp'}
                </span>
                <span className="text-muted small">Ngày mở: {formatPreviewDate(pendingPayload.available_from)}</span>
              </div>

              <h5 className="mb-3">{pendingPayload.lesson_name}</h5>
              {pendingPayload.video_link && (
                <div className="mb-4">
                  <video controls src={pendingPayload.video_link} className="w-100 rounded" style={{ maxHeight: 320, objectFit: 'cover' }} />
                </div>
              )}

              <div className="lesson-preview-questions">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Câu hỏi luyện tập ({pendingPayload.items.length})</h6>
                  <span className="text-muted small">Xem lại đáp án đúng và media đi kèm</span>
                </div>

                {pendingPayload.items.map((item) => {
                  const hasMedia = Boolean(item.image_path || item.audio_path);
                  return (
                    <div key={item.order} className="preview-question-card border rounded shadow-sm mb-4">
                      <div className="preview-question-header d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">Câu {item.order}</div>
                          {item.question_text ? (
                            <p className="mb-2">{item.question_text}</p>
                          ) : (
                            <p className="text-muted mb-2">(Chưa có nội dung câu hỏi)</p>
                          )}
                        </div>
                        {item.stimulus_text && <span className="badge bg-info text-dark">Stimulus</span>}
                      </div>

                      {item.stimulus_text && <p className="text-muted small mb-3">{item.stimulus_text}</p>}

                      {hasMedia && (
                        <div className="preview-media mb-3">
                          {item.image_path && (
                            <img
                              src={item.image_path}
                              alt="Xem trước hình minh hoạ"
                              className="img-fluid rounded"
                              style={{ maxHeight: 220, objectFit: 'cover' }}
                            />
                          )}
                          {item.audio_path && (
                            <div className="mt-2">
                              <audio controls src={item.audio_path} style={{ width: '100%' }} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="preview-choice-list">
                        {item.choices.map((choice, choiceIndex) => (
                          <div key={`${item.order}-${choiceIndex}`} className={`preview-choice border rounded p-2 ${choice.is_correct ? 'preview-choice-correct' : ''}`}>
                            <strong className="me-2">{choice.label}.</strong>
                            {choice.content || <span className="text-muted">(Trống)</span>}
                            {choice.is_correct && <span className="badge bg-success ms-2">Đáp án đúng</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card-footer d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div className="text-muted small">Nếu phát hiện sai sót hãy đóng cửa sổ này để chỉnh sửa trước khi xác nhận.</div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={cancelPreview} disabled={submitting}>
                  Quay lại chỉnh sửa
                </button>
                <button type="button" className="btn btn-primary" onClick={confirmSubmitLesson} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Xác nhận tạo bài học'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && detailLesson && (
        <div className="lesson-preview-backdrop" role="dialog" aria-modal="true">
          <div className="lesson-preview-modal card shadow-lg">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Chi tiết bài học</h5>
                <small className="text-muted">Xem trước nội dung bài học đã lưu</small>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setDetailModalOpen(false)} 
                aria-label="Đóng chi tiết" 
              />
            </div>
            <div className="card-body lesson-preview-body">
              <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
                <span className="badge bg-primary">
                  {detailLesson.part ? `${detailLesson.part.part_section} · ${detailLesson.part.part_code}` : 'Part chưa xác định'}
                </span>
                <span className="text-muted small">
                  Ngày mở: {detailLesson.lesson?.available_from ? new Date(detailLesson.lesson.available_from).toLocaleDateString('vi-VN') : 'Không thiết lập'}
                </span>
              </div>

              <h5 className="mb-3">{detailLesson.lesson?.lesson_name || 'Bài học'}</h5>
              
              {detailLesson.lesson?.video_link && (
                <div className="mb-4">
                  <video 
                    controls 
                    src={detailLesson.lesson.video_link} 
                    className="w-100 rounded" 
                    style={{ maxHeight: 320, objectFit: 'cover' }} 
                  />
                </div>
              )}

              <div className="lesson-preview-questions">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Câu hỏi luyện tập ({(detailLesson.items || []).length})</h6>
                </div>

                {(detailLesson.items || []).map((item, idx) => {
                  const hasMedia = Boolean(item.image_path || item.audio_path);
                  return (
                    <div key={item.item_id || idx} className="preview-question-card border rounded shadow-sm mb-4">
                      <div className="preview-question-header d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">Câu {idx + 1}</div>
                          {item.question_text ? (
                            <p className="mb-2">{item.question_text}</p>
                          ) : (
                            <p className="text-muted mb-2">(Chưa có nội dung câu hỏi)</p>
                          )}
                        </div>
                        {item.stimulus_text && <span className="badge bg-info text-dark">Stimulus</span>}
                      </div>

                      {item.stimulus_text && <p className="text-muted small mb-3">{item.stimulus_text}</p>}

                      {hasMedia && (
                        <div className="preview-media mb-3">
                          {item.image_path && (
                            <img
                              src={item.image_path}
                              alt="Hình minh hoạ"
                              className="img-fluid rounded"
                              style={{ maxHeight: 220, objectFit: 'cover' }}
                            />
                          )}
                          {item.audio_path && (
                            <div className="mt-2">
                              <audio controls src={item.audio_path} style={{ width: '100%' }} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="preview-choice-list">
                        {(item.choices || []).map((choice, choiceIndex) => (
                          <div 
                            key={choice.choice_id || choiceIndex} 
                            className={`preview-choice border rounded p-2 ${choice.is_correct ? 'preview-choice-correct' : ''}`}
                          >
                            <strong className="me-2">{choice.label}.</strong>
                            {choice.content || <span className="text-muted">(Trống)</span>}
                            {choice.is_correct && <span className="badge bg-success ms-2">Đáp án đúng</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
              <div className="text-muted small">Bạn có thể chỉnh sửa bài học bằng nút "Sửa" trong danh sách</div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDetailModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherLessons;
