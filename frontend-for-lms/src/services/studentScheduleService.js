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

// FIX: Helper để tính status đồng bộ với backend (sử dụng ISO date string comparison)
const computeStatus = (schedule) => {
  try {
    const dateStr = schedule.schedule_date; // Backend trả về ISO: "YYYY-MM-DD"
    const endStr = schedule.schedule_endtime;
    if (!dateStr) return 'upcoming';

    // Lấy ngày hiện tại theo local timezone (dạng "YYYY-MM-DD")
    const now = new Date();
    const todayStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');

    // So sánh string trực tiếp (timezone-safe)
    if (dateStr < todayStr) {
      return 'completed';
    }
    if (dateStr === todayStr) {
      if (!endStr) return 'today';
      // So sánh thời gian kết thúc với giờ hiện tại
      const nowTime = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
      ].join(':');
      return endStr <= nowTime ? 'completed' : 'today';
    }
    return 'upcoming';
  } catch {
    return 'upcoming';
  }
};

/**
 * Lấy lịch học của học viên theo khoảng thời gian
 */
export const getStudentWeeklySchedules = async ({
  studentId,
  startDate,
  endDate,
  courseId,
  classId
}) => {
  try {
    if (!studentId) {
      throw new Error('studentId is required');
    }

    const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}/schedules`, {
      headers: getAuthHeaders(),
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(courseId ? { course_id: courseId } : {}),
        ...(classId ? { class_id: classId } : {})
      }
    });

    const data = response.data?.data || { schedules: [] };
    
    // FIX: Tính lại status cho mỗi schedule nếu backend chưa có hoặc để đảm bảo đồng bộ
    if (data.schedules && Array.isArray(data.schedules)) {
      data.schedules = data.schedules.map(schedule => ({
        ...schedule,
        status: schedule.status || computeStatus(schedule) // Ưu tiên backend, fallback client-side
      }));
    }

    return data;
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    const message = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(message);
  }
};

export default {
  getStudentWeeklySchedules
};
