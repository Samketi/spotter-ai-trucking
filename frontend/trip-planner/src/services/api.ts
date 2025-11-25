import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const httpClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiService = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const response = await httpClient.get(endpoint);
    return response.data as T;
  },

  post: async <T = any>(endpoint: string, payload: any): Promise<T> => {
    const response = await httpClient.post(endpoint, payload);
    return response.data as T;
  },

  put: async <T = any>(endpoint: string, payload: any): Promise<T> => {
    const response = await httpClient.put(endpoint, payload);
    return response.data as T;
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await httpClient.delete(endpoint);
    return response.data as T;
  },
};
