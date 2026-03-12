import axios from "axios";

// Default ASP.NET Core dev port (check appsettings or launchSettings.json for exact port later)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5062/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login or clear store)
      console.error("Unauthorized! Token might be expired.");
      localStorage.removeItem("token");
      // Optionally emit a custom event to force the app to log out globally
      window.dispatchEvent(new Event("auth-unauthorized"));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
