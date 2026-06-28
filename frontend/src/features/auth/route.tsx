import { RouteObject } from "react-router-dom";
import PublicRoute from "@/routes/PublicRoute";
import AuthLayout from "@/layout/AuthLayout";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";

export const authRoutes: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/auth",
        element: <AuthLayout />,
        children: [
          { path: "signin", element: <SignIn /> },
          { path: "signup", element: <SignUp /> },
          { path: "forgotpassword", element: <ForgotPassword /> },
          // { path: "resetpassword", element: <ResetPassword /> },
          { path: "changepassword", element: <ResetPassword /> },
          { path: "change-password", element: <ChangePassword /> },
        ],
      },
    ],
  },
];
