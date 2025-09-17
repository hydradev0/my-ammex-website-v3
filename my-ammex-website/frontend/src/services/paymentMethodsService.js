import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export const fetchPaymentMethods = async () => {
  const res = await axios.get(`${API_BASE_URL}/payment-methods`);
  return res.data?.data || [];
};

export const createPaymentMethod = async (payload) => {
  const res = await axios.post(`${API_BASE_URL}/payment-methods`, payload);
  return res.data?.data;
};

export const updatePaymentMethod = async (id, payload) => {
  const res = await axios.put(`${API_BASE_URL}/payment-methods/${id}`, payload);
  return res.data?.data;
};

export const deletePaymentMethod = async (id) => {
  await axios.delete(`${API_BASE_URL}/payment-methods/${id}`);
};


