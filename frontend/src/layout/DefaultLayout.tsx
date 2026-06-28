// import React, { useState, ReactNode } from "react";
// import Header from "../components/Header/index";
// import Sidebar from "../components/Sidebar/index";
// import { useWindowType } from "../hooks/useWindowType";

// const DefaultLayout: React.FC<{ children?: ReactNode }> = ({ children }) => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const { isMobile } = useWindowType();
//   return (
//     <div className="dark:bg-boxdark-2 dark:text-bodydark">
//       {/* <!-- ===== Page Wrapper Start ===== --> */}
//       <div className="flex h-screen overflow-hidden">
//         {/* <!-- ===== Sidebar Start ===== --> */}
//         {!isMobile && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
//         {/* <!-- ===== Sidebar End ===== --> */}

//         {/* <!-- ===== Content Area Start ===== --> */}
//         <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
//           {/* <!-- ===== Header Start ===== --> */}
//           <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
//           {/* <!-- ===== Header End ===== --> */}

//           {/* <!-- ===== Main Content Start ===== --> */}
//           <main className="bg-white">
//             <div className="mx-auto max-w-screen-3xl p-4 md:p-6 2xl:p-10">{children}</div>
//           </main>
//           {/* <!-- ===== Main Content End ===== --> */}
//         </div>
//         {/* <!-- ===== Content Area End ===== --> */}
//       </div>
//       {/* <!-- ===== Page Wrapper End ===== --> */}
//     </div>
//   );
// };

// export default DefaultLayout;
import React, { useState } from "react";
import Header from "../components/Header/index";
// import Sidebar from "../components/Sidebar/index";
import { useWindowType } from "../hooks/useWindowType";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";
import { NavigateConfirmDialog } from "@/features/dashboard/components/NavigateConfirmDialog";
import { useNetworkStatus } from "@/utils/useNetworkStatus";
import OfflineDialog from "@/components/OfflineDialog";

const DefaultLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobile } = useWindowType();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  //for dialog - prevent data loss
  const isOnline = useNetworkStatus();
  const { isDialogOpen, dialogConfig, confirmNavigation, cancelNavigation } = useNavigationGuard();
  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleSidebar} />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#F6F6FE]">
          <Header isCollapsed={isCollapsed} onToggleCollapse={toggleSidebar} />

          <main className="">
            <div className="mx-auto max-w-screen-3xl p-4 md:p-6 2xl:p-10">
              <Outlet /> {/* <-- CHILDREN COME HERE */}
              {dialogConfig && (
                <NavigateConfirmDialog
                  open={isDialogOpen}
                  title={dialogConfig.title}
                  message={dialogConfig.message}
                  confirmText={dialogConfig.confirmText}
                  cancelText={dialogConfig.cancelText}
                  onClose={cancelNavigation}
                  onConfirm={confirmNavigation}
                />
              )}
              <OfflineDialog open={!isOnline} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;
