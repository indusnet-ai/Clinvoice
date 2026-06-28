import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import OnboardLayout from "@/layout/OnboardLayout";
import Onboard from "./pages/Onboard";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hook";
import { selectIsOnboardCompleted } from "@/utils/isOnboardCompleted";

// Guard component to prevent access to onboard route if already completed
const OnboardGuard = () => {
  const isCompleted = useAppSelector(selectIsOnboardCompleted);

  // If onboarding is already completed, redirect to dashboard
  if (isCompleted) {
    return <Navigate to="/appointment" replace />;
  }

  return <Onboard />;
};

export const onboardRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/onboard",
        element: <OnboardLayout />,
        children: [{ index: true, element: <OnboardGuard /> }],
      },
    ],
  },
];
