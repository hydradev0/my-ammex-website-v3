import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export const fetchBanks = async () => {
  const res = await axios.get(`${API_BASE_URL}/banks`);
  return res.data?.data || [];
};

export const createBank = async (payload) => {
  const res = await axios.post(`${API_BASE_URL}/banks`, payload);
  return res.data?.data;
};

export const updateBank = async (id, payload) => {
  const res = await axios.put(`${API_BASE_URL}/banks/${id}`, payload);
  return res.data?.data;
};

export const deleteBank = async (id) => {
  await axios.delete(`${API_BASE_URL}/banks/${id}`);
};


