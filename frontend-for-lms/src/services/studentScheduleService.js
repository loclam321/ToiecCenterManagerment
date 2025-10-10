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

    return response.data?.data || { schedules: [] };
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    const message = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(message);
  }
};

export default {
  getStudentWeeklySchedules
};
