import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/hook";
import { isAuthenticated } from "@/utils/auth";

const ForcePasswordGuard = () => {
  const userId = useAppSelector((state) => state.auth.user_id);
  const forceChangePassword = useAppSelector((state) => state.auth.forceChangePassword);
  console.log(forceChangePassword, "force password");

  if (!isAuthenticated()) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (!forceChangePassword) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ForcePasswordGuard;
