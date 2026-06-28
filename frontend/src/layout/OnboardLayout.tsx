import { LogoutIcon } from "@/assets/icons";
import { Button } from "@/atoms";
import Header from "@/components/Header";
import { LangSwitcher } from "@/app/component";
import CommonLoader from "@/app/component/CommonLoader";
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useNetworkStatus } from "@/utils/useNetworkStatus";
import OfflineDialog from "@/components/OfflineDialog";
import { forceLogout } from "@/utils/logout";
import { useAppDispatch, useAppSelector } from "@/app/hook";
import { logout } from "@/features/auth/services/authSlice";
import { selectIsOnboardCompleted } from "@/utils/isOnboardCompleted";

const OnboardLayout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [openLoader, setOpenLoader] = useState(false);
  const isOnboardCompleted = useAppSelector(selectIsOnboardCompleted);

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (isOnboardCompleted) {
      navigate("/appointment", { replace: true });
    }
  }, [isOnboardCompleted, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logout());
    forceLogout();
    navigate("/auth/signin", { replace: true });
  };

  const isOnline = useNetworkStatus();
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#F6F6FE]">
          {/* sticky header */}
          <div className="h-[54px] sticky top-0 z-50 bg-[#FDFDFD] flex gap-4 w-full items-center justify-end p-[22px] shadow shadow-[#e9e6e6]">
            <LangSwitcher />
            <p
              className="text-red-500 font-medium text-sm cursor-pointer flex gap-1 items-center"
              onClick={handleLogout}
            >
              <LogoutIcon /> Logout
            </p>
          </div>

          <main className="">
            <div className="mx-auto max-w-screen-3xl p-4 md:p-6 2xl:p-10">
              <Outlet />
              <OfflineDialog open={!isOnline} />
            </div>
          </main>
        </div>
      </div>
      <CommonLoader
        open={openLoader}
        onClose={() => {
          setOpenLoader(false);
        }}
      />
    </div>
  );
};

export default OnboardLayout;
