import { useState, useEffect } from 'react';
import { createSchedule, updateSchedule } from '../../services/scheduleService';
import { getTeachersForSelect } from '../../services/teacherService';
import { roomService } from '../../services/roomService';
import { getClassesForSelect, getClassById } from '../../services/classService';
import { toast } from 'react-toastify';
import './css/ScheduleFormModal.css';

function ScheduleFormModal({ show, onClose, onSuccess, editData, selectedDate }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currentStep, setCurrentStep] = useState(editData?.class_id ? 'details' : 'selectClass');
  const [isRecurring, setIsRecurring] = useState(!editData?.schedule_id);
  // Thêm state này vào
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);

  const weekdays = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 0, label: 'Chủ nhật' },
  ];

  const [formData, setFormData] = useState({
    class_id: editData?.class_id || '',
    room_id: editData?.room_id || '',
    user_id: editData?.user_id || '',
    schedule_date: editData?.schedule_date || selectedDate.toISOString().split('T')[0],
    schedule_startime: editData?.schedule_startime || '08:00',
    schedule_endtime: editData?.schedule_endtime || '10:00',
    title: editData?.title || '',
    description: editData?.description || '',
    status: editData?.status || 'SCHEDULED',
    is_makeup_class: editData?.is_makeup_class || false,
    weekdays: [], // Mặc định có thể chọn thứ 2,4,6
    start_date: editData?.schedule_date || selectedDate.toISOString().split('T')[0],
    end_date: ''
  });

  // Thêm mã khởi tạo các ngày trong tuần mặc định (thứ 2, 4, 6)
  useEffect(() => {
    if (isRecurring && formData.weekdays.length === 0) {
      setFormData(prev => ({
        ...prev,
        weekdays: [1, 3, 5] // Thứ 2, 4, 6
      }));
    }
  }, [isRecurring]);

  // Tải dữ liệu cho các dropdown
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoadingData(true);

        // Tải danh sách lớp học từ API
        const classesData = await getClassesForSelect();
        setClasses(classesData);

        // Tải danh sách giáo viên
        const teachersData = await getTeachersForSelect();
        setTeachers(teachersData);

        // Tải danh sách phòng học
        const roomsResponse = await roomService.getAllRooms();
        if (roomsResponse.success && roomsResponse.data) {
          setRooms(roomsResponse.data);
        }
      } catch (error) {
        console.error("Error loading form data:", error);
        toast.error("Không thể tải dữ liệu form");
      } finally {
        setLoadingData(false);
      }
    };

    if (show) {
      loadFilterOptions();
    }
  }, [show]);

  // Tính ngày kết thúc mặc định (3 tháng sau ngày bắt đầu)
  useEffect(() => {
    if (isRecurring && formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);

      setFormData(prev => ({
        ...prev,
        end_date: endDate.toISOString().split('T')[0]
      }));
    }
  }, [isRecurring, formData.start_date]);

  // Tự động điền tiêu đề buổi học dựa trên tên lớp được chọn
  useEffect(() => {
    if (formData.class_id && classes.length > 0) {
      const selectedClass = classes.find(cls => cls.value.toString() === formData.class_id.toString());
      if (selectedClass) {
        setFormData(prev => ({
          ...prev,
          title: `Buổi học ${selectedClass.label.split(' (')[0]}`
        }));
      }
    }
  }, [formData.class_id, classes]);

  // 3. Thêm hàm fetchClassDetails để gọi API lấy thông tin lớp học
  const fetchClassDetails = async (classId) => {
    try {
      const classDetails = await getClassById(classId);
      setSelectedClassDetails(classDetails);

      console.log("Class details:", classDetails);
    } catch (error) {
      console.error("Error fetching class details:", error);
    }
  };
  console.log("Selected class details:", selectedClassDetails);
  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Xử lý chọn ngày trong tuần
  const handleWeekdayToggle = (weekdayValue) => {
    setFormData(prev => {
      const currentWeekdays = [...prev.weekdays];
      if (currentWeekdays.includes(weekdayValue)) {
        return {
          ...prev,
          weekdays: currentWeekdays.filter(day => day !== weekdayValue)
        };
      } else {
        return {
          ...prev,
          weekdays: [...currentWeekdays, weekdayValue].sort()
        };
      }
    });
  };

  // Xử lý khi chọn lớp học trong bước 1
  const handleClassSelect = (classId, className) => {
    setFormData(prev => ({
      ...prev,
      class_id: classId,
      title: `Buổi học ${className}`
    }));
    // 4. Cập nhật handleClassSelect để gọi fetchClassDetails
    fetchClassDetails(classId);
    setCurrentStep('details');
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Kiểm tra nếu là lịch định kỳ thì phải chọn ít nhất 1 ngày trong tuần
      if (isRecurring && formData.weekdays.length === 0) {
        toast.error('Vui lòng chọn ít nhất một ngày trong tuần');
        setLoading(false);
        return;
      }

      let result;
      const dataToSubmit = { ...formData };

      // Nếu là lịch định kỳ, gửi weekdays và các thông tin liên quan
      if (isRecurring) {
        if (!dataToSubmit.end_date) {
          toast.error('Vui lòng chọn ngày kết thúc');
          setLoading(false);
          return;
        }
      } else {
        // Nếu không phải lịch định kỳ, loại bỏ các trường không cần thiết
        delete dataToSubmit.weekdays;
        delete dataToSubmit.start_date;
        delete dataToSubmit.end_date;
      }

      if (editData && editData.schedule_id) {
        // Cập nhật lịch học
        result = await updateSchedule(editData.schedule_id, dataToSubmit);
        if (result.success) {
          toast.success('Cập nhật lịch học thành công!');
          onSuccess(result.data);
          onClose();
        } else {
          toast.error(`Lỗi: ${result.message}`);
        }
      } else {
        // Tạo lịch học mới
        result = await createSchedule(dataToSubmit);
        if (result.success) {
          let successMessage = 'Thêm lịch học thành công!';
          if (isRecurring && result.data.total_created) {
            successMessage = `Đã tạo ${result.data.total_created} buổi học thành công!`;
          }
          toast.success(successMessage);
          onSuccess(result.data);
          onClose();
        } else {
          toast.error(`Lỗi: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Thêm useEffect để lấy chi tiết lớp khi formData.class_id thay đổi
  useEffect(() => {
    if (formData.class_id) {
      fetchClassDetails(formData.class_id);
    }
  }, [formData.class_id]);

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="schedule-form-modal">
        <div className="modal-header">
          <h2>
            {editData?.schedule_id ? 'Chỉnh sửa lịch học' :
              currentStep === 'selectClass' ? 'Chọn lớp học' : 'Thêm lịch học định kỳ'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {loadingData ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : currentStep === 'selectClass' ? (
            // Bước 1: Chọn lớp học
            <div className="class-selection">
              <p className="selection-instruction">
                Chọn lớp học để tạo lịch học mới cho ngày {formData.schedule_date}
              </p>

              {classes.length === 0 ? (
                <div className="no-classes-message">
                  <i className="fas fa-school"></i>
                  <p>Không có lớp học nào. Vui lòng tạo lớp học trước.</p>
                </div>
              ) : (
                <div className="class-grid">
                  {classes.map(cls => (
                    <div
                      key={cls.value}
                      className="class-card"
                      onClick={() => handleClassSelect(cls.value, cls.data.class_name)}
                    >
                      <i className="fas fa-users-class"></i>
                      <div className="class-card-name">{cls.label}</div>
                      <div className="class-card-date">
                        {`${new Date(cls.data.class_startdate).toLocaleDateString('vi-VN')} - ${new Date(cls.data.class_enddate).toLocaleDateString('vi-VN')}`}
                      </div>
                      <div className="class-card-action">
                        <i className="fas fa-plus-circle"></i> Chọn lớp học
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Bước 2: Điền thông tin lịch học
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Lớp học</label>
                  
                  {selectedClassDetails && selectedClassDetails.data ? (
                    <div className="selected-class-info">
                      <div className="class-name">{selectedClassDetails.data.class_name}</div>
                      <div className="class-dates">
                        <span className="date-label">Thời gian khóa học:</span> 
                        {new Date(selectedClassDetails.data.class_startdate).toLocaleDateString('vi-VN')} - 
                        {new Date(selectedClassDetails.data.class_enddate).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="class-status">
                        <span className="status-label">Trạng thái:</span>
                        <span className={`status-value ${selectedClassDetails.data.display_status}`}>
                          {selectedClassDetails.data.display_status}
                        </span>
                      </div>
                      <button 
                        type="button"
                        className="btn-change-class"
                        onClick={() => setCurrentStep('selectClass')}
                      >
                        <i className="fas fa-exchange-alt"></i> Đổi lớp học
                      </button>
                    </div>
                  ) : (
                    <select
                      id="class_id"
                      name="class_id"
                      value={formData.class_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Chọn lớp học</option>
                      {classes.map(cls => (
                        <option key={cls.value} value={cls.value}>{cls.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Ẩn checkbox chuyển đổi kiểu lịch vì mặc định là lịch định kỳ */}
                {editData?.schedule_id && (
                  <div className="form-group info-text">
                    <div className="notice-badge">
                      <i className="fas fa-info-circle"></i> Chỉnh sửa áp dụng cho buổi học này
                    </div>
                  </div>
                )}
              </div>

              {!editData?.schedule_id ? (
                <>
                  {/* UI cho lịch định kỳ - luôn hiển thị khi không phải là edit */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="start_date">Ngày bắt đầu</label>
                      <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="end_date">Ngày kết thúc</label>
                      <input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        min={formData.start_date}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Chọn các ngày trong tuần</label>
                      <div className="weekdays-selector">
                        {weekdays.map(day => (
                          <div
                            key={day.value}
                            className={`weekday-item ${formData.weekdays.includes(day.value) ? 'selected' : ''}`}
                            onClick={() => handleWeekdayToggle(day.value)}
                          >
                            {day.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* UI cho lịch đơn - chỉ hiển thị khi đang edit */}
                  {editData?.schedule_id && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="schedule_date">Ngày học</label>
                          <input
                            type="date"
                            id="schedule_date"
                            name="schedule_date"
                            value={formData.schedule_date}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        {/* Thêm phần kiểm tra trạng thái và hiển thị UI tương ứng */}
                        <div className="form-group">
                          <label>Trạng thái lịch học</label>

                          {/* Thêm kiểm tra selectedClassDetails tồn tại trước khi truy cập */}
                          {!selectedClassDetails ? (
                            <div className="loading-status">
                              <span>Đang tải thông tin...</span>
                            </div>
                          ) : selectedClassDetails.display_status === 'Đã lên lịch' ? (
                            <div className="status-actions">
                              <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="status-select"
                              >
                                <option value="SCHEDULED">Đã lên lịch</option>
                                <option value="CONFIRMED">Xác nhận</option>
                                <option value="CANCELLED">Hủy</option>
                              </select>
                            </div>
                          ) : selectedClassDetails.display_status === 'Đã xác nhận' ? (
                            /* Nếu đã xác nhận thì hiển thị badge và button hủy */
                            <div className="status-actions">
                              <span className="status-badge confirmed">
                                <i className="fas fa-check-circle"></i> Đã xác nhận
                              </span>
                              <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setFormData({ ...formData, status: 'CANCELLED' })}
                              >
                                <i className="fas fa-times-circle"></i> Hủy lịch
                              </button>
                            </div>
                          ) : (
                            /* Nếu đã hủy thì hiển thị badge */
                            <div className="status-actions">
                              <span className="status-badge cancelled">
                                <i className="fas fa-times-circle"></i> Đã hủy
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="schedule_startime">Thời gian bắt đầu</label>
                      <input
                        type="time"
                        id="schedule_startime"
                        name="schedule_startime"
                        value={formData.schedule_startime}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="schedule_endtime">Thời gian kết thúc</label>
                      <input
                        type="time"
                        id="schedule_endtime"
                        name="schedule_endtime"
                        value={formData.schedule_endtime}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="user_id">Giáo viên</label>
                      <select
                        id="user_id"
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Chọn giáo viên</option>
                        {teachers.map(teacher => (
                          <option key={teacher.value} value={teacher.value}>
                            {teacher.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="room_id">Phòng học</label>
                      <select
                        id="room_id"
                        name="room_id"
                        value={formData.room_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Chọn phòng học</option>
                        {rooms.map(room => (
                          <option key={room.room_id} value={room.room_id}>
                            {room.room_name} - {room.room_location || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label htmlFor="description">Ghi chú (không bắt buộc)</label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  {editData?.schedule_id && (
                    <div className="form-row">
                      <div className="form-group checkbox-group">
                        <input
                          type="checkbox"
                          id="is_makeup_class"
                          name="is_makeup_class"
                          checked={formData.is_makeup_class}
                          onChange={handleChange}
                        />
                        <label htmlFor="is_makeup_class">Đây là buổi học bù</label>
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    {currentStep === 'details' && !editData?.schedule_id && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCurrentStep('selectClass')}
                        disabled={loading}
                      >
                        <i className="fas fa-arrow-left"></i> Chọn lại lớp
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</>
                      ) : (
                        <>{editData?.schedule_id ? 'Cập nhật' : 'Tạo lịch định kỳ'}</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScheduleFormModal;