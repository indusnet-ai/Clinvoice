import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DefaultLayout from "@/layout/DefaultLayout";
import Patient from "./pages/Patient";

export const patientRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DefaultLayout />,
        children: [{ path: "patientlist", element: <Patient /> }],
      },
    ],
  },
];
