import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Lấy danh sách lịch học
 */
export const getSchedules = async (options = {}) => {
  try {
    // Xử lý params trực tiếp trong config của axios thay vì dùng URLSearchParams
    const response = await axios.get(`${API_BASE_URL}/api/schedules/by-date/${options.date}`, {
      headers: getAuthHeaders(),
      params: {
        ...(options.class_id && { class_id: options.class_id }),
        ...(options.teacher_id && { teacher_id: options.teacher_id }),
        ...(options.room_id && { room_id: options.room_id })
      }
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
};

/**
 * Tạo lịch học mới (một buổi)
 */
export const createSchedule = async (scheduleData) => {
  try {
    // Nếu có weekdays, sử dụng createRecurringSchedule
    if (scheduleData.weekdays && Array.isArray(scheduleData.weekdays) && scheduleData.weekdays.length > 0) {
      return createRecurringSchedule(scheduleData);
    }

    const payload = {
      class_id: scheduleData.class_id,
      room_id: scheduleData.room_id,
      user_id: scheduleData.user_id,
      schedule_date: scheduleData.schedule_date,
      schedule_startime: scheduleData.schedule_startime,
      schedule_endtime: scheduleData.schedule_endtime,
      title: scheduleData.title || '',
      description: scheduleData.description || '',
      status: scheduleData.status || 'SCHEDULED',
      is_makeup_class: scheduleData.is_makeup_class || false
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/schedules`, payload, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

/**
 * Tạo lịch học định kỳ theo các ngày trong tuần
 */
export const createRecurringSchedule = async (scheduleData) => {
  try {
    const payload = {
      class_id: scheduleData.class_id,
      room_id: scheduleData.room_id,
      user_id: scheduleData.user_id,
      weekdays: scheduleData.weekdays,
      schedule_startime: scheduleData.schedule_startime,
      schedule_endtime: scheduleData.schedule_endtime,
      title: scheduleData.title || '',
      description: scheduleData.description || '',
      status: scheduleData.status || 'SCHEDULED',
      start_date: scheduleData.start_date || scheduleData.schedule_date,
      end_date: scheduleData.end_date
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/schedules`, payload, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating recurring schedule:', error);
    throw error;
  }
};

/**
 * Cập nhật lịch học
 */
export const updateSchedule = async (scheduleId, scheduleData) => {
  try {
    const payload = {
      class_id: scheduleData.class_id,
      room_id: scheduleData.room_id,
      user_id: scheduleData.user_id,
      schedule_date: scheduleData.schedule_date,
      schedule_startime: scheduleData.schedule_startime,
      schedule_endtime: scheduleData.schedule_endtime,
      title: scheduleData.title || '',
      description: scheduleData.description || '',
      status: scheduleData.status || 'SCHEDULED',
      is_makeup_class: scheduleData.is_makeup_class || false
    };
    
    const response = await axios.put(`${API_BASE_URL}/api/schedules/${scheduleId}`, payload, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating schedule ${scheduleId}:`, error);
    throw error;
  }
};

/**
 * Xóa lịch học
 */
export const deleteSchedule = async (scheduleId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error deleting schedule ${scheduleId}:`, error);
    throw error;
  }
};

export default {
  getSchedules,
  createSchedule,
  createRecurringSchedule,
  updateSchedule,
  deleteSchedule
};