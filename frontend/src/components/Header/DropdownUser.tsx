import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ClickOutside from "../ClickOutside";
import { FiUser, FiKey, FiLogOut } from "react-icons/fi"; // React Icons
import { useAppSelector, useAppDispatch } from "@/app/hook";
import { useGetDoctorInfoQuery } from "@/features/onboard/services/OnBoardApi";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import { MyProfileIcon, UserIcon } from "@/assets/icons";
import { forceLogout } from "@/utils/logout";
import { showToast } from "@/utils";
import { logout } from "@/features/auth/services/authSlice";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";
import { useLanguage } from "@/language/context/LanguageContext";

const DropdownUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [docData, setDocData] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const docotrName = useAppSelector((state) => state.auth.doctor?.doctor_name);
  const docotrEmail =
    useAppSelector((state) => state.auth.doctor?.doctor_email) || localStorage.getItem("doctor_email");
  const { requestNavigation } = useNavigationGuard();
  const { data: docotrData } = useGetDoctorInfoQuery({ limit: 1, page: 1 }, { refetchOnMountOrArgChange: true });
  const [fileDownload, { isLoading }] = useDownloadFileMutation();

  useEffect(() => {
    if (docotrData) {
      setDocData(docotrData?.data?.[0]);
      fetchPatientImage(docotrData?.data?.[0]?.image);
    }
  }, [docotrData]);

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const fetchPatientImage = async (imageName: string) => {
    if (!imageName) return;

    try {
      const res = await fileDownload(imageName).unwrap();
      const base64 = res.fileBase64;

      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);

      setProfileImage(imageUrl);
    } catch (err) {
      console.error("Image download failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logout());
    window.location.href = "/auth/signin?logout=success";
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2">
        {profileImage ? (
          <div className="flex items-center gap-2">
            <img src={profileImage} className="w-10 h-10 rounded-full" alt="User Avatar" />
            <p className="text-[#01030F] text-[14px] font-semibold">{docData?.name ?? ""}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className=" bg-[#a6d9e9a9] rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <p className="text-[#01030F] text-[14px] font-semibold">{docData?.name ?? ""}</p>
          </div>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-4 w-md bg-white rounded-xl shadow-xl z-50 p-6">
          <div className="flex flex-col items-center text-center mb-6">
            {profileImage ? (
              <img src={profileImage} alt="Avatar" className="w-16 h-16 rounded-full bg-gray-100" />
            ) : (
              <UserIcon className="h-10 w-10" />
            )}
            <p className="text-base font-semibold text-gray-800 mt-3">{docData?.name ?? docotrName ?? ""}</p>
            <p className="text-sm text-gray-500 mt-1 break-all">{docData?.email ?? docotrEmail ?? ""}</p>
          </div>

          {/* Options */}
          <div className="flex items-center justify-center gap-4 text-[12px] font-normal text-[#5B657A]">
            <Link
              onClick={(e) => {
                e.preventDefault();
                requestNavigation(() => navigate("/settings/doctor-info"));
              }}
              to="/settings/doctor-info"
              className="flex items-center gap-3 hover:text-gray-900 transition"
            >
              <MyProfileIcon />
              {t("profileMenu.myProfile")}
            </Link>
            <Link
              to="/changepassword"
              onClick={(e) => {
                e.preventDefault();
                requestNavigation(() => navigate("/changepassword"));
              }}
              className="flex items-center gap-3 hover:text-gray-900 transition"
            >
              <FiKey className="text-[11px] font-normal text-[#5B657A]" />
              {t("profileMenu.changePassword")}
            </Link>

            <button
              onClick={() => {
                requestNavigation(() => handleLogout());
              }}
              className="flex items-center gap-3 text-red-500 hover:text-red-600 transition"
            >
              <FiLogOut className="text-lg" />
              {t("profileMenu.logout")}
            </button>
          </div>
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownUser;
