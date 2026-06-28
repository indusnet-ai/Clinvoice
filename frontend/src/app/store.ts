import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/services/authSlice";
import consultReducer from "@/features/dashboard/services/ConsultationSlice";
import onboardReducer from "@/features/onboard/services/OnBoardSlice";
import dashboardReducer from "@/features/dashboard/services/DashboardSlice";
import { baseApi } from "./baseApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    consult: consultReducer,
    onboard: onboardReducer,
    dashboard: dashboardReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (g) => g().concat(baseApi.middleware),
});

// Infer the RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
