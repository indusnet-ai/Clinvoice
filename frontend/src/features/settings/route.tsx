import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DefaultLayout from "@/layout/DefaultLayout";
import HospitalInfoSet from "./pages/HospitalInfoSet";
import DoctorInfoSet from "./pages/DoctorInfoSet";
import VoiceSignSet from "./pages/VoiceSignSet";
import SlotSetting from "./pages/SlotSetting";

export const settingRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DefaultLayout />,
        children: [
          { path: "settings/hospital-info", element: <HospitalInfoSet /> },
          { path: "settings/doctor-info", element: <DoctorInfoSet /> },
          { path: "settings/voice-address", element: <VoiceSignSet /> },
          { path: "settings/slots", element: <SlotSetting /> },
        ],
      },
    ],
  },
];
