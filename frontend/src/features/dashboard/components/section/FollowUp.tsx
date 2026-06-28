import { CallIcon, DropDownIcon } from "@/assets/icons";
import { FormDateInput, FormInputWithUnitSelect, FormUnitInput } from "@/atoms";
import React, { useEffect, useRef } from "react";
import { useFormikContext } from "formik";
import { FollowUpSync } from "../FollowUpSync";
import { ClearFollowUpButton } from "../ClearFollowUp";
import { useLanguage } from "@/language/context/LanguageContext";

interface FollowUpProps {
  extendFollow: boolean;
  setExtendFollow: (value: boolean) => void;
  disabled: boolean;
}

function FollowUp({ extendFollow, setExtendFollow, disabled }: FollowUpProps) {
  const { t } = useLanguage();
  const { values, setFieldValue } = useFormikContext<any>();

  const currentUnit = values?.followup?.day?.unit;
  const prevUnitRef = useRef(currentUnit);

  useEffect(() => {
    if (prevUnitRef.current !== undefined && currentUnit !== prevUnitRef.current) {
      setFieldValue("followup.day.value", "");
      setFieldValue("followup.followdate", "");
    }
    prevUnitRef.current = currentUnit;
  }, [currentUnit, setFieldValue]);

  return (
    <div>
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-[#01030F] text-[16px] flex items-center gap-2 font-semibold mb-2">
            <CallIcon /> {t("casesheet.followUp")}
          </p>
          <DropDownIcon
            className={`transition-transform duration-300 ${extendFollow ? "rotate-180" : ""}`}
            onClick={() => setExtendFollow(!extendFollow)}
          />
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out
                      ${extendFollow ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          {/* Table Header */}
          <div
            className={`grid grid-cols-[1fr_1fr_1fr_60px] bg-[#B8BFFF] text-[#01030F] text-[14px] font-medium py-4 px-2 items-center rounded-md text-center mt-2`}
          >
            <p>{t("casesheet.followUpOn")}</p>
            <p>{t("casesheet.date")}</p>
            <p>{t("casesheet.remarks")}</p>
            <p>{t("casesheet.action")}</p>
          </div>

          {/* Table Inputs */}
          <div className="grid grid-cols-[1fr_1fr_1fr_60px] gap-2 bg-[#FBFBFF] items-center justify-center py-4 mt-2 px-2 rounded-md">
            <FormInputWithUnitSelect
              name="followup.day"
              unitOptions={[
                { label: t("casesheet.days"), value: "days" },
                { label: t("casesheet.weeks"), value: "weeks" },
                { label: t("casesheet.months"), value: "months" },
              ]}
              maxLength={3}
              disabled={disabled}
            />

            <FormDateInput
              name="followup.followdate"
              mindate={new Date().toISOString().split("T")[0]}
              disabled={disabled}
            />
            <FormUnitInput name="followup.followremark" type="text" disabled={disabled} />
            <FollowUpSync />
            {!disabled && (
              <div>
                <ClearFollowUpButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FollowUp;
