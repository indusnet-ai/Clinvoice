import { authRoutes } from "@/features/auth";
import { dashboardRoutes } from "@/features/dashboard";
import { onboardRoutes } from "@/features/onboard";
import { patientRoutes } from "@/features/patient";
import { settingRoutes } from "@/features/settings";
import { visitRoutes } from "@/features/visithistory";

const enabledFeatures = {
  auth: true,
  onboard: true,
  dashboard: true, // subscription disabled
  patient: true,
  setting: true,
};

export const featureRoutes = [
  ...(enabledFeatures.auth ? authRoutes : []),
  ...(enabledFeatures.onboard ? onboardRoutes : []),
  ...(enabledFeatures.dashboard ? dashboardRoutes : []),
  ...(enabledFeatures.dashboard ? visitRoutes : []),
  ...(enabledFeatures.patient ? patientRoutes : []),
  ...(enabledFeatures.setting ? settingRoutes : []),
];
