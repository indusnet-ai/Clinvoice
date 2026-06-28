import { forceLogout } from "@/utils/logout";
import axios from "axios";

const baseURL = import.meta.env.VITE_BACKEND_URL;

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use((config: any) => {
  config.headers = config.headers ?? {};
  const service = config.service;
  // Remove content-type for FormData
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  // Backend auth token
  if (service === "backend" || service === "ssl") {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("temp_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // ClinVoice AI API key
  if (service === "clinvoice") {
    config.headers["x-api-key"] = import.meta.env.VITE_CLINVOICE_API_KEY;
  }

  return config;
});

// --- REFRESH TOKEN LOGIC ---
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const refresh = localStorage.getItem("refresh_token");
    const email = localStorage.getItem("email");
    const status = error.respose?.status;
    if (error.response?.status === 403 && !original._retry) {
      original._retry = true;

      const res = await axios.post(`${baseURL}/getAccessToken?username=${email}`, { refreshToken: refresh });

      const newToken = res.data.access_token;
      localStorage.setItem("access_token", newToken);

      original.headers.Authorization = newToken;
      return axiosInstance(original);
    }
    if (status === 401 || status === 403) {
      forceLogout();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
