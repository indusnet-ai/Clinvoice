import { CloseIcon, DropDownIcon, UserIcon } from "@/assets/icons";
import { Button } from "@/atoms";
import { CustomDialog, PatientAvatar } from "@/app/component";
import { PatientData } from "@/features/patient/types";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useLanguage } from "@/language/context/LanguageContext";
import { useLocation } from "react-router-dom";

interface PatientSearchDialogProps {
  open: boolean;
  onClose: () => void;
  data: any;
  loading: boolean;
  error: any;
  onAddNew?: any;
}
const PatientSearchDialog: React.FC<PatientSearchDialogProps> = ({ open, onClose, data, loading, error, onAddNew }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const patientData: PatientData[] = data?.data || [];
  const [openAddPatient, setOpenAddPatient] = useState(false);

  useEffect(() => {
    if (open) {
      onClose();
    }
  }, [location.pathname]);

  return (
    <CustomDialog open={open} onClose={onClose} maxWidth="sm">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[16px] font-semibold text-[#01030F]">{t("header.searchPatient")}</h1>
          <CloseIcon onClick={onClose} className="cursor-pointer" color="#98999E" />
        </div>

        {patientData.length === 0 && (
          <div>
            <div className="flex flex-col items-center justify-center h-30 gap-7">
              <p className="text-sm text-gray-600">{t("header.noPatientFound")}</p>
              {/* <Button variant="outlined" label={t("header.addNewPatient")} onClick={() => onAddNew()} /> */}
            </div>
          </div>
        )}
      </div>
      <div className="max-h-[50vh] overflow-y-scroll">
        {patientData?.map((patient, idnex) => {
          return (
            <div
              key={idnex}
              className="p-3 w-full hover:bg-gray-50 cursor-pointer border-b border-[gray] flex gap-2 items-center justify-between"
              onClick={() => {
                navigate(`/consultation?patient_id=${patient?.id}#visit`);
                onClose();
              }}
            >
              <div className="flex gap-2 items-center">
                <PatientAvatar imageName={patient?.image} name={patient?.patient_name} />
                <div>
                  <p className="font-semibold text-[14px] text-[#1C2253]">{patient?.patient_name}</p>
                  <p className="font-medium text-[12px] text-[#1C2253]">
                    {patient?.country_code} {patient?.mobile_no}
                  </p>
                  <p className="font-medium text-[12px] text-[#1C2253] flex items-center gap-1">
                    <span className="text-[#6070FF] text-[14px] font-medium ">
                      {t("label.patientId")} : PT{patient?.id} |{" "}
                    </span>
                    {patient?.age} {t("patient.years")} | {t(`genderLabels.${patient?.gender?.toLowerCase()}`)}
                  </p>
                </div>
              </div>
              <div>
                <DropDownIcon className="-rotate-90" />
              </div>
            </div>
          );
        })}
      </div>
    </CustomDialog>
  );
};

export default PatientSearchDialog;
