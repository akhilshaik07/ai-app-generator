import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api/v1",
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token = localStorage.getItem("jwt_token");
    if (token && token !== "null" && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize axios errors to standard Error objects to avoid [object Object] in UI
    const message = error.response?.data?.error || error.response?.data?.message || error.message || "An unexpected error occurred";
    const customError = new Error(message);
    
    // Attach additional info for components that need it
    (customError as any).status = error.response?.status;
    (customError as any).data = error.response?.data;
    (customError as any).isAxiosError = true;
    
    return Promise.reject(customError);
  }
);
