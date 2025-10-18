import axios from 'axios';
import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Helper to compute session status similar to backend student schedule logic
const computeStatus = (schedule) => {
  try {
    const today = new Date();
    const dateStr = schedule.schedule_date;
    const endStr = schedule.schedule_endtime;
    if (!dateStr) return 'upcoming';

    const [y, m, d] = dateStr.split('-').map(Number);
    const sessionDate = new Date(y, (m || 1) - 1, d || 1);

    // Compare only by date for past
    const sessionDateOnly = new Date(sessionDate);
    sessionDateOnly.setHours(0, 0, 0, 0);
    const todayOnly = new Date(today);
    todayOnly.setHours(0, 0, 0, 0);

    if (sessionDateOnly < todayOnly) {
      return 'completed';
    }
    if (sessionDateOnly.getTime() === todayOnly.getTime()) {
      if (!endStr) return 'today';
      const [hh = 0, mm = 0, ss = 0] = String(endStr).split(':').map(Number);
      const endDt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
      return today > endDt ? 'completed' : 'today';
    }
    return 'upcoming';
  } catch {
    return 'upcoming';
  }
};

/**
 * Lấy lịch dạy của giáo viên trong khoảng thời gian theo tuần
 * Trả về cùng shape dữ liệu với getStudentWeeklySchedules để tái sử dụng UI
 */
export const getTeacherWeeklySchedules = async ({
  teacherId,
  startDate,
  endDate,
  courseId,
  classId
}) => {
  try {
    if (!teacherId) throw new Error('teacherId is required');

    // Prefer teacher-availability endpoint to support date range
    const resp = await axios.get(
      `${API_BASE_URL}/api/schedules/teacher-availability/${encodeURIComponent(teacherId)}`,
      {
        headers: getAuthHeaders(),
        params: {
          start_date: startDate,
          end_date: endDate,
          ...(courseId ? { course_id: courseId } : {}),
          ...(classId ? { class_id: classId } : {})
        }
      }
    );

    const payload = resp.data?.data || {};
    const schedulesByDate = payload.schedules_by_date || {};

    // Flatten schedules and reshape to match student schedule items
    const schedules = [];
    const classSet = new Map(); // key: class_id -> {class_id, class_name}

    Object.values(schedulesByDate).forEach((arr) => {
      (arr || []).forEach((s) => {
        const item = {
          schedule_id: s.schedule_id,
          schedule_date: s.schedule_date, // YYYY-MM-DD
          schedule_startime: s.schedule_startime, // HH:MM:SS
          schedule_endtime: s.schedule_endtime, // HH:MM:SS
          status: computeStatus(s),
          room: {
            room_id: s.room_id,
            room_name: s.room_name || null,
            room_location: s.room_location || null
          },
          teacher: {
            user_id: s.user_id,
            user_name: s.teacher_name || null
          },
          class: {
            class_id: s.class_id,
            class_name: s.class_name || null,
            class_startdate: null,
            class_enddate: null
          },
          course: {
            course_id: null,
            course_name: null
          }
        };
        schedules.push(item);

        if (s.class_id && !classSet.has(s.class_id)) {
          classSet.set(s.class_id, {
            class_id: s.class_id,
            class_name: s.class_name || null,
            course_id: null,
            course_name: null
          });
        }
      });
    });

    // Optional: filter by course/class on client if provided
    const filteredSchedules = schedules.filter((it) => {
      if (classId && it.class?.class_id !== Number(classId)) return false;
      if (courseId && it.course?.course_id !== courseId) return false;
      return true;
    });

    return {
      schedules: filteredSchedules,
      schedules_by_day: payload.schedules_by_date || {},
      available_classes: Array.from(classSet.values()),
      summary: {
        total_sessions: filteredSchedules.length
      }
    };
  } catch (error) {
    console.error('Error fetching teacher schedules:', error);
    const message = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(message);
  }
};

export default {
  getTeacherWeeklySchedules
};
