import React from "react";
import { Tabs } from "@/app/component/Tabs";
import { ExportIcon } from "@/assets/icons";
import { ProfileData } from "../types";
import { ProfileBar } from "./ProfileBar";

type Tab = { label: string; value: string };

type Props = {
  isMaximize: boolean;
  expandProfile: boolean;
  setExpandProfile: (v: boolean) => void;

  profileDetails: ProfileData | null;

  t: (k: string) => string;

  Profile_Tabs: Tab[];
  Consult_Tabs: Tab[];

  activeTab: string;
  setActiveTab: (v: string) => void;

  consultTab: string;
  setConsultTab: (v: string) => void;

  onExportPdf: () => void;
  onOpenOpd: () => void;

  onManualTabSelected: () => void; // keep your manualSeedVersion logic in parent
};

export const ConsultationTopBar: React.FC<Props> = ({
  isMaximize,
  expandProfile,
  setExpandProfile,
  profileDetails,
  t,
  Profile_Tabs,
  Consult_Tabs,
  activeTab,
  setActiveTab,
  consultTab,
  setConsultTab,
  onExportPdf,
  onOpenOpd,
  onManualTabSelected,
}) => {
  return (
    <div
      className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isMaximize ? "opacity-0 -translate-y-6 pointer-events-none max-h-0" : "opacity-100 translate-y-0 max-h-[500px]"
      }`}
    >
      <div>
        <ProfileBar PatientData={profileDetails} expandProfile={expandProfile} setExpandProfile={setExpandProfile} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Tabs tabs={Profile_Tabs} value={activeTab} defaultTab={activeTab} onChange={(e) => setActiveTab(e.value)} />

        {activeTab === "#casesheet" ? (
          <div className="flex items-center gap-2">
            <p className="text-[#01030F] text-[14px] font-medium">{t("consultation.consultType")}</p>
            <Tabs
              tabs={Consult_Tabs}
              value={consultTab}
              syncWithUrl={false}
              buttonClassName="!w-[50px] text-[12px] font-medium"
              onChange={(e) => {
                setConsultTab(e.value);
                if (e.value === "#manual") onManualTabSelected();
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <button
                className="py-2.5 text-[#6070FF] text-[14px] font-medium px-[17px] border border-[#6070FF] rounded-lg flex gap-1 items-center"
                onClick={onExportPdf}
              >
                {t("appointment.actions.export")} <ExportIcon />
              </button>
            </div>

            <button
              onClick={onOpenOpd}
              className="py-2.5 text-[#FFFFFF] text-[14px] font-medium px-[30px] border bg-[#6070FF] rounded-lg flex gap-1 items-center"
            >
              + {t("appointment.actions.createOpd")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
