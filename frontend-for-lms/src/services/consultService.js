import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/consult-registrations';

const getHeaders = () => {
  const TOKEN = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': TOKEN ? `Bearer ${TOKEN}` : ''
  };
};


export const createConsultRegistration = async (registrationData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/`, registrationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    console.error('Error creating consult registration:', error);
    throw error;
  }
};


export const approvedConsultRegistration = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/approved/${id}`, {}, {
      headers: getHeaders()
    });
    return response;
  } catch (error) {
    console.error('Error approving consult registration:', error);
    throw error;
  }
};
