import axiosInstance from "@/services/api/axiosInstance";
import { ServiceAxiosRequestConfig } from "@/services/api/axiosTypes";
import { forceLogout } from "@/utils/logout";
import { createApi } from "@reduxjs/toolkit/query/react";

const BASE_MAP: Record<string, string> = {
  ssl: import.meta.env.VITE_SSL_URL,
  backend: import.meta.env.VITE_BACKEND_URL,
  voice: import.meta.env.VITE_VOICE_URL,
  file: import.meta.env.VITE_FILE_UPLOAD_URL,
  clinvoice: import.meta.env.VITE_CLINVOICE_AI_URL,
  abha: import.meta.env.VITE_ABHA_URL || "https://abha-api.clinvoice.com",
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: async ({ url, method, body, params, service = "backend" }) => {
    try {
      const fullUrl = BASE_MAP[service] + url;

      const res = await axiosInstance({
        url: fullUrl,
        method,
        data: body,
        params,
        service,
      } as ServiceAxiosRequestConfig);

      return { data: res.data };
    } catch (err: any) {
      const status = err?.response?.status ?? "FETCH_ERROR";
      const data = err?.response?.data ?? { message: err?.message || "Something went wrong" };

      // Only logout for auth-related endpoints if you want (optional)
      if (status === 401 || status === 403) {
        // Avoid forceLogout for public endpoints like login or forgot-password
        const authEndpoints = ["/user/verify", "/user/forgot-password", "/user/reset-password"];
        if (!authEndpoints.includes(url)) {
          forceLogout();
        }
      }

      return { error: { status, data } };
    }
  },
  tagTypes: [
    "Auth",
    "Patient",
    "Appointment",
    "Audio",
    "OnBoard",
    "hospital",
    "doctor",
    "voice",
    "sign",
    "slots",
    "opd",
    "states",
    "districts",
  ],
  endpoints: () => ({}),
});
