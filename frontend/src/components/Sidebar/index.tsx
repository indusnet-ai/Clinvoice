import React, { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import IconLogoo from "@/assets/imgs/icon-logo.png";
import {
  HospitalIcon,
  DoctorIcon,
  VoiceSignatureIcon,
  SlotsIcon,
  DashboardIcon,
  PatientIcon,
  SettingsIcon,
} from "@/assets/icons";

import { ArrowLeft, Menu } from "lucide-react";
import SidebarData from "./sidebar.json";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";
import { useLanguage } from "@/language/context/LanguageContext";
import { useGetHospitalInfoQuery } from "@/features/onboard/services/OnBoardApi";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import { base64ToBlobUrl } from "@/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const iconMap: Record<string, any> = {
  SettingsIcon,
  PatientIcon,
  DashboardIcon,
  HospitalIcon,
  DoctorIcon,
  VoiceSignatureIcon,
  SlotsIcon,
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { requestNavigation } = useNavigationGuard();
  const { t } = useLanguage();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Main nested menu stack
  const [menuStack, setMenuStack] = useState([{ items: SidebarData, parent: null }]);

  const currentMenu = menuStack[menuStack.length - 1];
  const { items: visibleItems, parent } = currentMenu;

  const [hospitalLogo, setHospitalLogo] = useState("");
  const [iconLogo, setIconLogo] = useState("");
  const { data: hospitalData } = useGetHospitalInfoQuery({ limit: 1, page: 1 }, { refetchOnMountOrArgChange: true });
  const [downloadFile, { isLoading }] = useDownloadFileMutation();
  // -------------------------------
  // FETCH LOGO
  // -------------------------------
  // console.log(hospitalData?.data[0]?.logo);

  useEffect(() => {
    let objectUrl = "";

    const fetchLogo = async () => {
      try {
        const imageName = hospitalData?.data?.[0]?.logo;
        if (!imageName) return;

        const res = await downloadFile(imageName).unwrap();
        // console.log(res, "res");

        if (res) {
          objectUrl = base64ToBlobUrl(res?.fileBase64);
          setHospitalLogo(objectUrl);
        }
      } catch (error) {
        console.error("Failed to fetch hospital logo:", error);
      }
    };

    fetchLogo();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hospitalData?.data?.[0]?.logo, downloadFile]);
  // -------------------------------
  // NESTED MENU HANDLER
  // -------------------------------
  const handleMenuClick = (item: any) => {
    // If no submenu
    if (!item?.children || item.children.length === 0) return;

    setMenuStack((prev) => [
      ...prev,
      {
        items: item.children,
        parent: item,
      },
    ]);
  };

  const goBack = () => {
    setMenuStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const findParentMenu = (items: any[], path: string) => {
    for (const item of items) {
      if (item.children?.some((child: any) => child.route === path)) {
        return item;
      }
    }
    return null;
  };
  useEffect(() => {
    const parentMenu = findParentMenu(SidebarData, pathname);

    if (parentMenu) {
      setMenuStack([
        { items: SidebarData, parent: null },
        {
          items: parentMenu.children,
          parent: parentMenu,
        },
      ]);
    } else {
      // reset to root if not inside nested menu
      setMenuStack([{ items: SidebarData, parent: null }]);
    }
  }, [pathname]);

  return (
    <aside
      ref={sidebarRef}
      className={`shadow-md left-0 top-0 z-50 flex h-screen flex-col bg-white dark:bg-boxdark-2
      transition-all duration-300 ease-in-out
      ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* TOP LOGO */}
      <div className="flex h-[68px] items-center justify-center border-b border-gray-200 px-3">
        {isCollapsed ? (
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
            <img
              src={hospitalLogo || "/fallback-logo.png"}
              alt="Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-14 w-full items-center justify-center overflow-hidden">
            <img
              src={hospitalLogo || "/fallback-logo.png"}
              alt="Logo"
              className="max-h-full max-w-[85%] object-contain"
            />
          </div>
        )}
      </div>
      {/* MENU CONTENT */}
      <div className="flex flex-col overflow-y-auto px-4 mt-4 hide-scrollbar">
        {/* BACK BUTTON */}
        {parent && !isCollapsed && (
          <button
            onClick={goBack}
            className="mb-4 flex items-center gap-3 px-4 text-gray-700 hover:text-indigo-500 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {t(parent.translationKey || parent.name)}
          </button>
        )}
        <ul className="flex flex-col gap-1.5 hide-scrollbar">
          {visibleItems.map((item: any) => {
            const isLeaf = !!item.route; // has a valid route
            const isActive = isLeaf && pathname === item.route;
            const isParentActive = item.children?.some((child) => child.route === pathname);

            return (
              <li key={item.name}>
                <NavLink
                  to={item.children && item.children.length > 0 ? "#" : item.route}
                  className={`group flex items-center gap-3 py-2 rounded-lg font-medium transition-all duration-300 hide-scrollbar
                 ${isCollapsed ? "px-2 justify-center" : "px-4"}
                 ${
                   isActive || isParentActive ? "bg-indigo-100 text-indigo-600" : "text-gray-600 hover:text-indigo-600"
                 }`}
                  // onClick={(e) => {
                  //   if (item.children && item.children.length > 0) {
                  //     e.preventDefault(); // prevent navigation
                  //     handleMenuClick(item); // open submenu
                  //   }
                  // }}
                  onClick={(e) => {
                    if (item.children && item.children.length > 0) {
                      e.preventDefault();
                      handleMenuClick(item);
                    } else {
                      e.preventDefault();
                      requestNavigation(() => navigate(item.route));
                    }
                  }}
                  title={isCollapsed ? t(item.translationKey || item.name) : ""}
                >
                  {item.icon && (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {typeof iconMap[item.icon] === "string" ? (
                        <img src={iconMap[item.icon]} className="w-full h-full object-contain" alt="icon" />
                      ) : (
                        React.createElement(iconMap[item.icon], { className: "w-full h-full" })
                      )}
                    </div>
                  )}

                  {!isCollapsed && <span>{t(item.translationKey || item.name)}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
        <p
          className={`fixed bottom-3 ${
            isCollapsed ? `text-[10px] left-1` : `left-8 text-[13px]`
          } text-indigo-500 font-medium`}
        >
          ClinVoice AI | V1.1
        </p>
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
