import { DropDownIcon, UserIcon } from "@/assets/icons";
import { useLanguage } from "@/language/context/LanguageContext";
import React, { useState } from "react";
import { ProfileData } from "../types";
import { formatDateForDisplay } from "@/utils";
import { ProfileImageView } from "@/app/component";

interface ProfileBarProps {
  PatientData: ProfileData | null;
  expandProfile: boolean;
  setExpandProfile: (_data: boolean) => void;
}

const InfoBlock = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[#4E54C8] text-[12px] font-medium">{label}</p>
    <p className="text-[#01030F] text-[16px] font-semibold">{value}</p>
  </div>
);

const Divider = () => <div className="bg-[#929AC8] w-px h-11" />;

export const ProfileBar: React.FC<ProfileBarProps> = ({ PatientData, expandProfile, setExpandProfile }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-xl p-2">
      {/* -------- TOP BAR -------- */}
      <div
        className={`flex items-center justify-between gap-6 p-4 rounded-xl transition-colors duration-300 ${
          expandProfile ? "bg-[#EDEFFE]" : "bg-white"
        }`}
      >
        {/* Profile */}
        <div className="flex gap-4 items-center min-w-[220px]">
          {PatientData?.image ? (
            <div className="rounded-full">
              <ProfileImageView fileKey={PatientData?.image} />
            </div>
          ) : (
            <div className="bg-[#D7DBFF] rounded-full p-2">
              <UserIcon className="h-9 w-9" />
            </div>
          )}
          <InfoBlock label={t("label.name")} value={PatientData?.patient_name || ""} />
        </div>

        <InfoBlock label={t("label.patientId")} value={`PT${PatientData?.id || ""}`} />

        <div className="flex items-center gap-4">
          <Divider />
          <InfoBlock
            label={t("label.ageGender")}
            value={`${PatientData?.age || ""} ${t("patient.years")} | ${PatientData?.gender || ""}`}
          />
        </div>

        <div className="flex items-center gap-4">
          <Divider />
          <InfoBlock label={t("label.mobile")} value={PatientData?.mobile_no || ""} />
        </div>

        <div className="flex items-center gap-4">
          <Divider />
          <InfoBlock label={t("label.emailId")} value={PatientData?.email || ""} />
        </div>

        {/* Toggle */}
        <DropDownIcon
          onClick={() => setExpandProfile(!expandProfile)}
          className={`cursor-pointer h-5 w-5 transition-transform duration-300 ${expandProfile ? "rotate-180" : ""}`}
        />
      </div>

      {/* -------- EXPANDABLE SECTION -------- */}
      <div
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${expandProfile ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}
        `}
      >
        <div
          className={`
            grid md:grid-cols-4 gap-y-6 p-4
            transform transition-transform duration-500
            ${expandProfile ? "translate-y-0" : "-translate-y-4"}
          `}
        >
          <div>
            <p className="text-[#666666] text-[12px]">{t("label.blood")}</p>
            <p className="text-[#333333] text-[14px] font-semibold">{PatientData?.blood_group || ""}</p>
          </div>

          {/* <div>
            <p className="text-[#666666] text-[12px]">{t("label.secondaryPhone")}</p>
            <p className="text-[#333333] text-[14px] font-semibold">{PatientData?.mobile_no}</p>
          </div> */}

          <div>
            <p className="text-[#666666] text-[12px]">{t("label.dob")}</p>
            <p className="text-[#333333] text-[14px] font-semibold">{formatDateForDisplay(PatientData?.dob) || ""}</p>
          </div>

          <div>
            <p className="text-[#666666] text-[12px]">{t("label.dateofVisit")}</p>
            <p className="text-[#333333] text-[14px] font-semibold">
              {formatDateForDisplay(PatientData?.updated_at) || ""}
            </p>
          </div>

          <div>
            <p className="text-[#666666] text-[12px]">{t("label.address")}</p>
            <p className="text-[#333333] text-[14px] font-semibold">{PatientData?.address || ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
