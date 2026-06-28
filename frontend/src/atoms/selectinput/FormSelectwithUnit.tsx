import React from "react";
import { useField } from "formik";
import { DropDownIcon } from "@/assets/icons";

interface Option {
  label: string;
  value: string | number;
}

interface Props {
  name: string;
  valueOptions: Option[];
  unitOptions?: Option[];
}

export const FormSelectWithUnit: React.FC<Props> = ({ name, valueOptions, unitOptions }) => {
  const [valueField] = useField(`${name}.value`);
  const [unitField] = useField(`${name}.unit`);

  return (
    <div className="flex items-center h-11 rounded-lg border border-gray-300 overflow-hidden bg-white">
      {/* VALUE SELECT */}
      <div className="relative flex-1 h-full">
        <select
          {...valueField}
          className="w-full h-full px-3 pr-8 text-sm text-center bg-white outline-none appearance-none cursor-pointer"
        >
          <option value=""></option>
          {valueOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* CUSTOM ICON */}
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <DropDownIcon />
        </span>
      </div>

      {/* DIVIDER */}
      {unitOptions && <div className="h-6 w-px bg-gray-300" />}

      {/* UNIT SELECT */}
      {unitOptions && (
        <div className="relative max-w-[40%] h-full">
          <select {...unitField} className="h-full px-2 pr-6 text-xs font-medium outline-none appearance-none cursor-pointer">
            {unitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* CUSTOM ICON */}
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2">
            <DropDownIcon />
          </span>
        </div>
      )}
    </div>
  );
};
