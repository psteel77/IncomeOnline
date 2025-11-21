import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      return response.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
};

export const platformsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await axios.get(`${API}/platforms`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching platforms:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await axios.get(`${API}/platforms/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching platform:', error);
      throw error;
    }
  }
};

export const statsAPI = {
  get: async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

export const seedAPI = {
  seed: async () => {
    try {
      const response = await axios.post(`${API}/seed`);
      return response.data;
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
};