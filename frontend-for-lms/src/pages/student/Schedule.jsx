import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getCurrentUser } from '../../services/authService';
import { getStudentWeeklySchedules } from '../../services/studentScheduleService';
import './css/StudentSchedule.css';

const HOURS_START = 7;
const HOURS_END = 21;

// ✨ Optimized: Pre-compute time-related constants
const TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = HOURS_START; hour < HOURS_END; hour += 1) {
    const startHour = String(hour).padStart(2, '0');
    const endHour = String(hour + 1).padStart(2, '0');
    slots.push({
      start: `${startHour}:00`,
      end: `${endHour}:00`,
      label: `${startHour}:00`,
      startMinutes: hour * 60,
      endMinutes: (hour + 1) * 60
    });
  }
  return slots;
})();

// ✨ Optimized: Cache para parseTimeToMinutes
const TIME_CACHE = new Map();

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

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  
  // ✨ Check cache first
  if (TIME_CACHE.has(timeStr)) {
    return TIME_CACHE.get(timeStr);
  }
  
  const [hour = '0', minute = '0'] = timeStr.split(':');
  const result = Number(hour) * 60 + Number(minute);
  TIME_CACHE.set(timeStr, result);
  return result;
};

const doesSessionCoverSlot = (session, slot) => {
  const sessionStart = parseTimeToMinutes(session.schedule_startime);
  const sessionEnd = parseTimeToMinutes(session.schedule_endtime);
  const slotStart = slot.startMinutes;
  const slotEnd = slot.endMinutes;

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

  // ✨ Optimized: Use constant instead of building every time
  const timeSlots = TIME_SLOTS;
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekEnd = weekDays[weekDays.length - 1]?.date ?? weekStart;

  // ✨ Optimized: Pre-build slot-to-session mapping for faster lookup
  const schedulesByDay = useMemo(() => {
    const map = new Map();
    
    // Initialize all days
    weekDays.forEach((day) => {
      map.set(day.iso, {
        sessions: [],
        slotMap: new Map() // Map slot index to sessions covering that slot
      });
    });

    // Group sessions by day and sort
    scheduleItems.forEach((item) => {
      const dayKey = item.schedule_date;
      if (!map.has(dayKey)) {
        map.set(dayKey, { sessions: [], slotMap: new Map() });
      }
      map.get(dayKey).sessions.push(item);
    });

    // Sort sessions and build slot mapping
    weekDays.forEach(({ iso }) => {
      const dayData = map.get(iso);
      if (!dayData) return;

      // Sort sessions by start time
      dayData.sessions.sort((a, b) => {
        const startA = parseTimeToMinutes(a.schedule_startime) ?? 0;
        const startB = parseTimeToMinutes(b.schedule_startime) ?? 0;
        return startA - startB;
      });

      // Build slot mapping for faster rendering
      timeSlots.forEach((slot, slotIndex) => {
        const coveringSessions = dayData.sessions.filter(session => 
          doesSessionCoverSlot(session, slot)
        );
        if (coveringSessions.length > 0) {
          dayData.slotMap.set(slotIndex, coveringSessions[0]);
        }
      });
    });

    return map;
  }, [scheduleItems, weekDays, timeSlots]);

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

  // ✨ Optimized: Use useCallback to prevent function recreation
  const handlePrevWeek = useCallback(() => {
    setWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }, []);

  const handleResetWeek = useCallback(() => {
    setWeekStart(getWeekStart(new Date()));
  }, []);

  // ✨ Optimized: Build merged tracker properly with dependencies
  const mergedTracker = useMemo(() => {
    const tracker = {};
    weekDays.forEach(day => {
      tracker[day.iso] = new Set();
    });
    return tracker;
  }, [weekDays]);

  const shouldSkipCell = useCallback((dayKey, slotIndex) => {
    return mergedTracker[dayKey]?.has(slotIndex) || false;
  }, [mergedTracker]);

  const markMergedCells = useCallback((dayKey, slotIndex, span) => {
    if (!mergedTracker[dayKey]) {
      mergedTracker[dayKey] = new Set();
    }
    for (let offset = 1; offset < span; offset += 1) {
      mergedTracker[dayKey].add(slotIndex + offset);
    }
  }, [mergedTracker]);

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
                  // ✨ Optimized: Use pre-built slot mapping
                  const dayData = schedulesByDay.get(day.iso);
                  
                  if (shouldSkipCell(day.iso, timeIndex)) {
                    return null;
                  }

                  const session = dayData?.slotMap.get(timeIndex);

                  if (!session) {
                    return <td key={`${day.iso}-${slot.start}`} className="empty-cell" />;
                  }

                  const rowSpan = calculateRowSpan(session, timeIndex, timeSlots.length);
                  markMergedCells(day.iso, timeIndex, rowSpan);

                  const className = session.class?.class_name || `Lớp ${session.class?.class_id || ''}`;
                  const courseName = session.course?.course_name || session.course?.course_id || '';
                  const roomName = session.room?.room_name || `Phòng ${session.room?.room_id || ''}`;
                  const teacherName = session.teacher?.user_name || 'Chưa cập nhật';
                  
                  // ✨ Get session status from backend or calculate
                  const status = session.status || 'upcoming';
                  const statusClass = `session-${status}`; // CSS classes: session-completed, session-today, session-upcoming

                  return (
                    <td key={`${day.iso}-${slot.start}`} className={`session-cell ${statusClass}`} rowSpan={rowSpan}>
                      <div className="session-card" title={`${className} - ${courseName}\n${session.schedule_startime?.slice(0, 5)} - ${session.schedule_endtime?.slice(0, 5)}\nGiáo viên: ${teacherName}\nPhòng: ${roomName}`}>
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
                        {/* ✨ Status indicator */}
                        <div className={`session-status-badge status-${status}`}>
                          {status === 'completed' && '✓ Đã học'}
                          {status === 'today' && '● Hôm nay'}
                          {status === 'upcoming' && '○ Sắp tới'}
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
