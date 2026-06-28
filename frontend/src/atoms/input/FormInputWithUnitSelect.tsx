import React from "react";
import { useField } from "formik";
import { DropDownIcon } from "@/assets/icons";

interface Option {
  label: string;
  value: string | number;
}

interface Props {
  name: string; // e.g. "temperature"
  placeholder?: string;
  type?: "text" | "number";
  maxLength?: number;
  unitOptions: Option[];
  isLeftUnit?: boolean;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  regex?: RegExp;
}

export const FormInputWithUnitSelect: React.FC<Props> = ({
  name,
  placeholder,
  type = "number",
  maxLength,
  unitOptions,
  isLeftUnit = false,
  label,
  disabled = false,
  required = false,
  regex,
}) => {
  const [valueField, valueMeta, valueHelpers] = useField(`${name}.value`);
  const [unitField, unitMeta] = useField(`${name}.unit`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (regex) {
      val = val
        .split("")
        .filter((char) => regex.test(char))
        .join("");
    }

    if (type === "number" && !regex) {
      val = val.replace(/[^0-9.]/g, "");
    }

    if (maxLength && val.length > maxLength) return;

    valueHelpers.setValue(val);
  };
  const hasError = (valueMeta.touched && !!valueMeta.error) || (unitMeta.touched && !!unitMeta.error);

  return (
    <div className="flex flex-col gap-1">
      {/* LABEL (only if provided) */}
      {label && (
        <label className="block text-[12px] font-medium ">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`flex items-center h-11 rounded-lg border overflow-hidden bg-white ${
          hasError ? "border-red-500" : "border-gray-300"
        }`}
      >
        {/* LEFT UNIT SELECT */}
        {isLeftUnit && (
          <>
            <div className="relative h-full min-w-10 shrink-0 bg-gray-50">
              <select
                {...unitField}
                className="h-full w-full px-2 pr-5 text-xs bg-gray-50 outline-none appearance-none cursor-pointer"
                disabled={disabled}
              >
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2">
                <DropDownIcon />
              </span>
            </div>

            <div className="h-6 w-px bg-gray-300" />
          </>
        )}

        {/* INPUT */}
        <input
          value={valueField.value}
          onChange={handleChange}
          onBlur={valueField.onBlur}
          placeholder={placeholder}
          type="text"
          className="flex-1 min-w-0 px-3 text-sm outline-none"
          disabled={disabled}
        />

        {/* RIGHT UNIT SELECT */}
        {!isLeftUnit && (
          <>
            <div className="h-6 w-px bg-gray-300" />

            <div className="relative h-full min-w-10 shrink-0 bg-gray-50">
              <select
                {...unitField}
                className="h-full w-full px-2 pr-5 text-xs bg-gray-50 outline-none appearance-none cursor-pointer"
                disabled={disabled}
              >
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2">
                <DropDownIcon />
              </span>
            </div>
          </>
        )}
      </div>
      {valueMeta.touched && valueMeta.error && <p className="text-sm text-red-500 mt-1">{valueMeta.error}</p>}
    </div>
  );
};
