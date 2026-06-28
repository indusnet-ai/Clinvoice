import { useEffect, useState } from "react";

import DropdownUser from "./DropdownUser";
import { BurgerMenuIcon, SearchIcon, SidebarCloseIcon } from "@/assets/icons";
import { LangSwitcher } from "@/app/component";
import {
  useGetPatientByMobileQuery,
  useLazyGetPatientByMobileQuery,
} from "@/features/dashboard/services/ConsultationApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PatientSearchDialog from "./PatientSearchDialog";
import * as Yup from "yup";
import AddPatientDialog from "@/features/patient/pages/AddPatientDialog";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";
import { useLanguage } from "@/language/context/LanguageContext";

const Header = (props: { isCollapsed: boolean; onToggleCollapse: () => void }) => {
  const { isCollapsed, onToggleCollapse } = props;
  const [openScanModal, setOpenScanModal] = useState(false);
  const handleQROpen = () => {
    setOpenScanModal(true);
  };
  const [openPatient, setOpenPatient] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [openAddPatient, setOpenAddPatient] = useState(false);
  const { isBlocked } = useNavigationGuard();
  const { t } = useLanguage();

  const [triggerSearch, { data, isFetching, error }] = useLazyGetPatientByMobileQuery();
  const handleSearch = async () => {
    if (isBlocked) {
      return;
    }
    const raw = mobileNumber.trim();
    if (!raw) return;

    // Normalize patient ID like "PT108" -> "108"
    let searchValue = raw;
    const ptMatch = /^PT\s*(\d+)$/i.exec(raw);
    if (ptMatch) {
      searchValue = ptMatch[1];
    }

    try {
      await PatientSearchSchema.validate({ search: searchValue });

      const res = await triggerSearch({ mobile_no: searchValue });
      setPatientData(res?.data);
      setOpenPatient(true);
    } catch (err: any) {
      alert(err.errors[0]);
    }
  };

  const PatientSearchSchema = Yup.object({
    search: Yup.string()
      .required(t("header.validationRequired"))
      .max(50, t("header.validationFormat"))
      .test("only-allowed-chars", t("header.validationFormat"), (value) => {
        if (!value) return false;
        // allow letters, numbers and spaces only
        return /^[a-zA-Z0-9 ]+$/.test(value);
      }),
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only letters, numbers and spaces, max 50 chars
    if (value === "" || (/^[a-zA-Z0-9 ]+$/.test(value) && value.length <= 50)) {
      setMobileNumber(value);
    }
  };

  const searchHints = [t("header.searchID"), t("header.searchName"), t("header.searchMobile")];

  const [hintIndex, setHintIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (mobileNumber) return;

    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % searchHints.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [mobileNumber]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  const formattedMobile = mobileNumber?.length === 10 ? mobileNumber : "";
  return (
    <header className="sticky top-0 z-30 flex w-full bg-white text-black drop-shadow-1 dark:bg-white dark:text-black dark:drop-shadow-none shadow-sm">
      <div className="flex grow items-center justify-between px-4 py-3 shadow-2 md:px-6 2xl:px-11">
        {/* Left side - Burger/Close Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? (
              <SidebarCloseIcon className="w-5 h-5 text-gray-700" />
            ) : (
              <BurgerMenuIcon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>

        <div className="flex grow items-center justify-end gap-6 px-4  shadow-2 md:px-6 2xl:px-11 ">
          <LangSwitcher />
          {/* <DropdownNotification /> */}

          <div className="relative w-full max-w-sm md:max-w-md">
            {/* Animated placeholder */}
            {!mobileNumber && (
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 overflow-hidden mask-fade">
                <div
                  className="transition-transform duration-700 ease-in-out"
                  style={{
                    transform: `translateY(-${hintIndex * 1.25}rem)`,
                  }}
                >
                  {searchHints.map((hint, index) => (
                    <div key={index} className="h-5 text-[#6B7280] text-sm">
                      {hint}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              type="text"
              value={mobileNumber}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              aria-label={t("header.searchID")}
              className="bg-[#F0F0FF] pr-10 pl-4 py-2 rounded-full text-black border-none focus:outline-none focus:ring-0 w-full"
            />

            <button className="absolute top-1.5 right-6 mt-2" type="submit" onClick={handleSearch}>
              <SearchIcon />
            </button>
          </div>

          <div className="flex items-center gap-3 2xsm:gap-7">
            <ul className="flex items-center gap-2 2xsm:gap-4"></ul>
            <DropdownUser />
          </div>
        </div>
        <PatientSearchDialog
          open={openPatient}
          onClose={() => {
            setOpenPatient(false);
            setMobileNumber("");
          }}
          data={patientData}
          loading={isFetching}
          error={error}
          onAddNew={() => {
            if (isBlocked) return;
            // setOpenAddPatient(true);
            setOpenPatient(false);
          }}
        />
        <AddPatientDialog
          open={openAddPatient}
          onClose={() => {
            setOpenPatient(false);
            setOpenAddPatient(false);
            setMobileNumber("");
          }}
          prefillValue={{ dialCode: "91", number: formattedMobile }}
        />
      </div>
    </header>
  );
};

export default Header;
