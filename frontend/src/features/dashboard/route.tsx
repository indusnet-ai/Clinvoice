import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DefaultLayout from "@/layout/DefaultLayout";
import Appointment from "./pages/Dashboard";
import Consultation from "./pages/Consultation";
import ResetPassword from "../auth/pages/ResetPassword";
import ChangePassword from "../auth/pages/ChangePassword";

export const dashboardRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DefaultLayout />,
        children: [
          { path: "appointment", element: <Appointment /> },
          { path: "consultation", element: <Consultation /> },
          { path: "changepassword", element: <ChangePassword /> },
        ],
      },
    ],
  },
];
