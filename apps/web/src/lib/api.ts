import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const newAccessToken = response.headers["new-access-token"];
    const newRefreshToken = response.headers["new-refresh-token"];

    if (newAccessToken && newRefreshToken) {
      console.log("🔄 Received new tokens from server");
      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      console.log("✅ Updated local tokens and headers");
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log("🚫 Response error:", error.response?.status);
    console.log("📝 Request URL:", originalRequest?.url);

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🔄 Starting token refresh flow");
      if (isRefreshing) {
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refresh_token = localStorage.getItem("refresh_token");
        const device_id = localStorage.getItem("current_device_id");

        if (!refresh_token || !device_id) {
          throw new Error("Missing authentication tokens");
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          {
            headers: {
              "refresh-token": refresh_token,
              "device-id": device_id,
            },
          }
        );

        const { access_token: newAccessToken, refresh_token: newRefreshToken } =
          response.data;

        localStorage.setItem("access_token", newAccessToken);
        localStorage.setItem("refresh_token", newRefreshToken);
        api.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (!originalRequest.url.includes("/auth/refresh-token")) {
          localStorage.clear();
          window.location.href = "/auth";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { api };
