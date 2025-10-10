import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { getCurrentUser } from '../../services/authService';
import { getStudentWeeklySchedules } from '../../services/studentScheduleService';
import './css/StudentSchedule.css';

const HOURS_START = 7;
const HOURS_END = 21;

const formatDateISO = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split('T')[0];
};

const getWeekStart = (referenceDate) => {
  const date = new Date(referenceDate);
  const currentDay = date.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildWeekDays = (startDate) => {
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const next = new Date(startDate);
    next.setDate(startDate.getDate() + i);
    days.push({
      label: next.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      iso: formatDateISO(next),
      date: next
    });
  }
  return days;
};

const buildTimeSlots = () => {
  const slots = [];
  for (let hour = HOURS_START; hour < HOURS_END; hour += 1) {
    const startHour = String(hour).padStart(2, '0');
    const endHour = String(hour + 1).padStart(2, '0');
    slots.push({
      start: `${startHour}:00`,
      end: `${endHour}:00`,
      label: `${startHour}:00`
    });
  }
  return slots;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hour = '0', minute = '0'] = timeStr.split(':');
  return Number(hour) * 60 + Number(minute);
};

const doesSessionCoverSlot = (session, slot) => {
  const sessionStart = parseTimeToMinutes(session.schedule_startime);
  const sessionEnd = parseTimeToMinutes(session.schedule_endtime);
  const slotStart = parseTimeToMinutes(slot.start);
  const slotEnd = parseTimeToMinutes(slot.end);

  if (sessionStart === null || sessionEnd === null || slotStart === null || slotEnd === null) {
    return false;
  }

  return sessionStart < slotEnd && sessionEnd > slotStart;
};

const calculateRowSpan = (session, currentIndex, totalSlots) => {
  const sessionStart = parseTimeToMinutes(session.schedule_startime);
  const sessionEnd = parseTimeToMinutes(session.schedule_endtime);

  if (sessionStart === null || sessionEnd === null) {
    return 1;
  }

  const minutes = Math.max(0, sessionEnd - sessionStart);
  const span = Math.max(1, Math.ceil(minutes / 60));
  return Math.min(span, totalSlots - currentIndex);
};

export default function StudentSchedule() {
  const user = getCurrentUser();
  const studentId = user?.user_id;

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [scheduleItems, setScheduleItems] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Chuẩn hóa các khung giờ 1 tiếng để dựng bảng tuần
  const timeSlots = useMemo(() => buildTimeSlots(), []);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekEnd = weekDays[weekDays.length - 1]?.date ?? weekStart;

  // Gom lịch học theo từng ngày trong tuần đang xem
  const schedulesByDay = useMemo(() => {
    const map = new Map();
    weekDays.forEach((day) => map.set(day.iso, []));

    scheduleItems.forEach((item) => {
      if (!map.has(item.schedule_date)) {
        map.set(item.schedule_date, []);
      }
      map.get(item.schedule_date).push(item);
    });

    weekDays.forEach(({ iso }) => {
      const sessions = map.get(iso) || [];
      sessions.sort((a, b) => {
        const startA = parseTimeToMinutes(a.schedule_startime) ?? 0;
        const startB = parseTimeToMinutes(b.schedule_startime) ?? 0;
        return startA - startB;
      });
      map.set(iso, sessions);
    });

    return map;
  }, [scheduleItems, weekDays]);

  const courseOptions = useMemo(() => {
    const seen = new Map();
    availableClasses.forEach((cls) => {
      if (cls.course_id && !seen.has(cls.course_id)) {
        seen.set(cls.course_id, cls.course_name || cls.course_id);
      }
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [availableClasses]);

  const classOptions = useMemo(() => {
    return availableClasses
      .filter((cls) => !selectedCourse || cls.course_id === selectedCourse)
      .map((cls) => ({ value: cls.class_id, label: cls.class_name || `Lớp ${cls.class_id}` }));
  }, [availableClasses, selectedCourse]);

  useEffect(() => {
    if (!studentId) {
      toast.error('Không tìm thấy thông tin học viên. Vui lòng đăng nhập lại.');
      return;
    }

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await getStudentWeeklySchedules({
          studentId,
          startDate: formatDateISO(weekStart),
          endDate: formatDateISO(weekEnd),
          courseId: selectedCourse || undefined,
          classId: selectedClass || undefined
        });

        setScheduleItems(data.schedules || []);
        setAvailableClasses(data.available_classes || []);
      } catch (error) {
        toast.error(error.message || 'Không thể tải lịch học.');
        setScheduleItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [studentId, weekStart, weekEnd, selectedCourse, selectedClass]);

  const handlePrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const handleResetWeek = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  // Dùng tracker để bỏ qua các ô bị gộp (rowSpan) khi render bảng
  const mergedTracker = useMemo(() => ({}), [scheduleItems, weekDays, timeSlots]);

  const shouldSkipCell = (dayKey, slotIndex) => {
    const dayTracker = mergedTracker[dayKey];
    return dayTracker ? dayTracker.has(slotIndex) : false;
  };

  const markMergedCells = (dayKey, slotIndex, span) => {
    if (!mergedTracker[dayKey]) {
      mergedTracker[dayKey] = new Set();
    }
    for (let offset = 1; offset < span; offset += 1) {
      mergedTracker[dayKey].add(slotIndex + offset);
    }
  };

  return (
    <div className="student-schedule-page">
      <div className="schedule-header">
        <div>
          <h4 className="schedule-title">Lịch học trong tuần</h4>
          <p className="schedule-range">
            {weekDays[0]?.date.toLocaleDateString('vi-VN')} - {weekDays[6]?.date.toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="schedule-actions">
          <button type="button" className="schedule-btn" onClick={handlePrevWeek}>
            <i className="fas fa-chevron-left" /> Tuần trước
          </button>
          <button type="button" className="schedule-btn" onClick={handleResetWeek}>
            <i className="fas fa-calendar-check" /> Tuần này
          </button>
          <button type="button" className="schedule-btn" onClick={handleNextWeek}>
            Tuần sau <i className="fas fa-chevron-right" />
          </button>
        </div>
      </div>

      <div className="schedule-filters">
        <div className="filter-control">
          <label htmlFor="course-filter">Khoá học</label>
          <select
            id="course-filter"
            value={selectedCourse}
            onChange={(event) => {
              setSelectedCourse(event.target.value);
              setSelectedClass('');
            }}
          >
            <option value="">Tất cả khoá học</option>
            {courseOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="class-filter">Lớp học</label>
          <select
            id="class-filter"
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
          >
            <option value="">Tất cả lớp học</option>
            {classOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="time-column">Thời gian</th>
              {weekDays.map((day) => (
                <th key={day.iso} className={`day-column ${day.iso === formatDateISO(new Date()) ? 'today' : ''}`}>
                  <div className="day-label">{day.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, timeIndex) => (
              <tr key={slot.start}>
                <td className="time-cell">{slot.label}</td>
                {weekDays.map((day) => {
                  const sessions = schedulesByDay.get(day.iso) || [];
                  const coveringSessions = sessions.filter((session) => doesSessionCoverSlot(session, slot));

                  if (shouldSkipCell(day.iso, timeIndex)) {
                    return null;
                  }

                  if (coveringSessions.length === 0) {
                    return <td key={`${day.iso}-${slot.start}`} className="empty-cell" />;
                  }

                  const session = coveringSessions[0];
                  const rowSpan = calculateRowSpan(session, timeIndex, timeSlots.length);
                  markMergedCells(day.iso, timeIndex, rowSpan);

                  const className = session.class?.class_name || `Lớp ${session.class?.class_id || ''}`;
                  const courseName = session.course?.course_name || session.course?.course_id || '';
                  const roomName = session.room?.room_name || `Phòng ${session.room?.room_id || ''}`;
                  const teacherName = session.teacher?.user_name || 'Chưa cập nhật';

                  return (
                    <td key={`${day.iso}-${slot.start}`} className="session-cell" rowSpan={rowSpan}>
                      <div className="session-card">
                        <div className="session-title">{className}</div>
                        {courseName && <div className="session-subtitle">{courseName}</div>}
                        <div className="session-time">
                          <i className="fas fa-clock" />
                          <span>
                            {session.schedule_startime?.slice(0, 5)} - {session.schedule_endtime?.slice(0, 5)}
                          </span>
                        </div>
                        <div className="session-meta">
                          <div><i className="fas fa-chalkboard-teacher" /> {teacherName}</div>
                          <div><i className="fas fa-door-open" /> {roomName}</div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && scheduleItems.length === 0 && (
        <div className="schedule-empty">
          <i className="fas fa-calendar-times" />
          <p>Không có buổi học nào trong khoảng thời gian này.</p>
        </div>
      )}

      {loading && (
        <div className="schedule-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      )}
    </div>
  );
}
