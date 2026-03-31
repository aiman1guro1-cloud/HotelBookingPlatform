import axios from "axios";

// Default ASP.NET Core dev port (check appsettings or launchSettings.json for exact port later)
const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7240/api";

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
      const isAuthRequest = error.config.url.includes('/Auth/');
      
      if (isAuthRequest) {
        console.error("Authentication failed.");
      } else {
        console.warn("Unauthorized access to " + error.config.url + ". Token might be expired or insufficient permissions.");
        // Don't automatically clear token or redirect here.
        // Token validity is managed by useAuthStore.verifyAuth() on app start.
        // Individual components should handle 401 errors gracefully.
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
