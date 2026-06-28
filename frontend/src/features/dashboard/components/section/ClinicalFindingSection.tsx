import React from "react";
import { DropDownIcon } from "@/assets/icons";

type ToothValues = Record<number, any>;

type ToothInputProps = {
  tooth: number;
  fieldName: "upperTeeth" | "lowerTeeth" | "upperChildrenTeeth" | "lowerChildrenTeeth";
  values: ToothValues;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  disabled?: boolean;
  labelPosition?: "top" | "bottom";
};

// If your ToothInput already exists, pass it as prop to keep it decoupled.
type Props = {
  title?: string;

  expanded: boolean;
  onToggle: () => void;

  disabled?: boolean;

  // tooth numbers
  upperTeethRight: number[];
  upperTeethLeft: number[];
  lowerTeethRight: number[];
  lowerTeethLeft: number[];

  // formik teeth values
  upperChildrenTeeth: ToothValues;
  upperTeeth: ToothValues;
  lowerTeeth: ToothValues;
  lowerChildrenTeeth: ToothValues;

  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;

  // Inputs (so component can be reused in other forms too)
  ToothInputComponent: React.ComponentType<ToothInputProps>;
  InputRow: React.ReactNode; // right side inputs block (Attrition, Abrasion...) parent controls it

  abbreviations?: React.ReactNode;
};

export const ClinicalFindingsSection: React.FC<Props> = ({
  title = "Clinical findings",
  expanded,
  onToggle,
  disabled = false,

  upperTeethRight,
  upperTeethLeft,
  lowerTeethRight,
  lowerTeethLeft,

  upperChildrenTeeth,
  upperTeeth,
  lowerTeeth,
  lowerChildrenTeeth,
  setFieldValue,

  ToothInputComponent,
  InputRow,

  abbreviations,
}) => {
  return (
    <div className="bg-white rounded-xl p-4">
      <div className="bg-[#B8BFFF] flex items-center justify-between px-2 py-[15px] rounded-md">
        <p className="text-[#01030F] text-xs font-semibold">{title}</p>

        <DropDownIcon
          className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          onClick={onToggle}
        />
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid grid-cols-2 gap-8 mt-6">
          {/* LEFT: teeth chart */}
          <div className="flex flex-col items-center justify-center">
            {/* Upper children */}
            <div className="mb-2">
              <div className="flex justify-center items-center">
                {[55, 54, 53, 52, 51].map((tooth) => (
                  <ToothInputComponent
                    key={tooth}
                    tooth={tooth}
                    fieldName="upperChildrenTeeth"
                    values={upperChildrenTeeth}
                    setFieldValue={setFieldValue}
                    disabled={disabled}
                  />
                ))}

                {[61, 62, 63, 64, 65].map((tooth) => (
                  <ToothInputComponent
                    key={tooth}
                    tooth={tooth}
                    fieldName="upperChildrenTeeth"
                    values={upperChildrenTeeth}
                    setFieldValue={setFieldValue}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>

            {/* Upper adult */}
            <div className="mb-2">
              <div className="flex justify-center items-center">
                {[...upperTeethRight, ...upperTeethLeft].map((tooth) => (
                  <ToothInputComponent
                    key={tooth}
                    tooth={tooth}
                    labelPosition="bottom"
                    fieldName="upperTeeth"
                    values={upperTeeth}
                    setFieldValue={setFieldValue}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>

            {/* Lower adult */}
            <div className="flex justify-center items-center mb-2">
              {[...lowerTeethRight, ...lowerTeethLeft].map((tooth) => (
                <ToothInputComponent
                  key={tooth}
                  tooth={tooth}
                  labelPosition="top"
                  fieldName="lowerTeeth"
                  values={lowerTeeth}
                  setFieldValue={setFieldValue}
                  disabled={disabled}
                />
              ))}
            </div>

            {/* Lower children */}
            <div className="mb-6">
              <div className="flex justify-center items-center">
                <div className="w-[105px]" />

                {[85, 84, 83, 82, 81].map((tooth) => (
                  <ToothInputComponent
                    key={tooth}
                    tooth={tooth}
                    fieldName="lowerChildrenTeeth"
                    values={lowerChildrenTeeth}
                    setFieldValue={setFieldValue}
                    labelPosition="bottom"
                    disabled={disabled}
                  />
                ))}

                {[71, 72, 73, 74, 75].map((tooth) => (
                  <ToothInputComponent
                    key={tooth}
                    tooth={tooth}
                    fieldName="lowerChildrenTeeth"
                    values={lowerChildrenTeeth}
                    setFieldValue={setFieldValue}
                    labelPosition="bottom"
                    disabled={disabled}
                  />
                ))}

                <div className="w-[105px]" />
              </div>
            </div>
          </div>

          {/* RIGHT: parent-controlled inputs */}
          <div className="space-y-3">{InputRow}</div>
        </div>

        {/* abbreviations */}
        {abbreviations ? (
          <div className="mt-6 text-[12px] text-black">{abbreviations}</div>
        ) : (
          <div className="mt-6 text-[12px] text-black">
            <span className="font-semibold">Abbreviations</span>
            <span className="ml-4">
              D - Decayed &nbsp;&nbsp; M - Missing &nbsp;&nbsp; F - Filled &nbsp;&nbsp; C - Crown &nbsp;&nbsp; FT -
              Fractured Tooth &nbsp;&nbsp; RS - Root Stump
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
