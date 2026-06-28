import { DeleteIcon, DropDownIcon } from "@/assets/icons";
import { FormUnitInput } from "@/atoms";
import { FieldArray } from "formik";
import React from "react";
import { useLanguage } from "@/language/context/LanguageContext";

interface MedicationProps {
  extendMedication: boolean;
  setExtendMedication: (value: boolean) => void;
  height: string | number;
  disabled: boolean;
  ref: React.RefObject<HTMLDivElement>;
}

function Medication({ extendMedication, setExtendMedication, height, disabled, ref }: MedicationProps) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-[#01030F] text-[16px] font-semibold mb-2">{t("casesheet.medication")}</p>
          <DropDownIcon
            className={`transition-transform duration-300 ${extendMedication ? "rotate-180" : ""}`}
            onClick={() => setExtendMedication(!extendMedication)}
          />
        </div>
        <div style={{ maxHeight: height }} className="overflow-hidden transition-[max-height] duration-300">
          <div ref={ref}>
            <FieldArray name="medication">
              {({ push, remove, form }) => (
                <>
                  {/* TABLE HEADER */}
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_60px] bg-[#B8BFFF] text-[#01030F] text-[14px] font-medium py-4 px-2 items-center text-center rounded-md mt-2">
                    <p>{t("casesheet.medicineName")}</p>
                    <p>{t("casesheet.dosage")}</p>
                    <p>{t("casesheet.frequency")}</p>
                    <p>{t("casesheet.timing")}</p>
                    <p>{t("casesheet.duration")}</p>
                    <p>{t("casesheet.quantity")}</p>
                    <p>{t("casesheet.remarks")}</p>
                    <p>{t("casesheet.action")}</p>
                  </div>

                  {/* ROWS */}
                  {form.values.medication.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_60px] gap-2 bg-[#FBFBFF] items-center py-4 mt-2 px-2 rounded-xl"
                    >
                      <FormUnitInput
                        name={`medication.${index}.medicineName`}
                        placeholder={t("consultation.placeholders.medicine")}
                        type="text"
                        disabled={disabled}
                      />
                      <FormUnitInput
                        name={`medication.${index}.dosage`}
                        placeholder={t("consultation.placeholders.dosage")}
                        type="text"
                        disabled={disabled}
                      />
                      <FormUnitInput
                        name={`medication.${index}.frequency`}
                        placeholder={t("consultation.placeholders.frequency")}
                        type="text"
                        disabled={disabled}
                      />
                      <FormUnitInput
                        name={`medication.${index}.timing`}
                        placeholder={t("consultation.placeholders.timing")}
                        type="text"
                        disabled={disabled}
                      />
                      <FormUnitInput
                        name={`medication.${index}.duration`}
                        placeholder={t("consultation.placeholders.duration")}
                        type="text"
                        disabled={disabled}
                      />
                      <FormUnitInput
                        name={`medication.${index}.quantity`}
                        placeholder={t("consultation.placeholders.quantity")}
                        type="text"
                        disabled={disabled}
                      />
                      <FormUnitInput
                        name={`medication.${index}.remarks`}
                        placeholder={t("consultation.placeholders.remarks")}
                        type="text"
                        disabled={disabled}
                      />

                      {/* ACTION */}
                      {!disabled && (
                        <div className="flex justify-center">
                          {form.values.medication.length > 1 && (
                            <DeleteIcon className="cursor-pointer text-red-500" onClick={() => remove(index)} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* ADD NEW */}
                  {!disabled && (
                    <div className="py-3">
                      <button
                        type="button"
                        onClick={() => {
                          push({
                            medicineName: "",
                            dosage: "",
                            frequency: "",
                            timing: "",
                            duration: "",
                            quantity: "",
                            remarks: "",
                          });
                        }}
                        className="text-blue-600 text-sm font-medium"
                      >
                        {t("casesheet.addNew")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </FieldArray>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Medication;
