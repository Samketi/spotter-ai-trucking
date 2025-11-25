import axios from "axios";


const httpClient = axios.create({
  baseURL: "https://spotter-ai-trucking.onrender.com/api/",
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
