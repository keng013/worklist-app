import axios from "axios";

const apiClient = axios.create({});

// ตัวอย่าง Interceptor สำหรับ Auth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if ([401, 403].includes(error.response?.status)) {
      if (typeof window !== "undefined") {
        window.location.hash = "login";
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
