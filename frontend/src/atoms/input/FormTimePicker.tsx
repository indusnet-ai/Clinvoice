import React, { useMemo } from "react";
import { useField } from "formik";

interface FormTimePickerProps {
  label: string;
  name: string;
  required?: boolean;
}

/** Convert 24-hour time (HH:mm) to 12-hour format with AM/PM */
const convertTo12Hour = (time24: string): string => {
  if (!time24) return "";

  const [hours24, minutes] = time24.split(":").map(Number);

  if (isNaN(hours24) || isNaN(minutes)) return "";

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export const FormTimePicker: React.FC<FormTimePickerProps> = ({ label, name, required = false }) => {
  const [field, meta, helpers] = useField(name);

  /** Get 12-hour formatted display value */
  const displayValue = useMemo(() => {
    return convertTo12Hour(field.value);
  }, [field.value]);

  return (
    <div className="mb-4">
      <label className="block font-medium text-[12px] mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {/* Hidden native time input for picking */}
        <input
          type="time"
          {...field}
          onChange={(e) => {
            field.onChange(e);
            helpers.setValue(e.target.value);
          }}
          onInput={(e) => {
            helpers.setValue(e.currentTarget.value);
          }}
          step={60}
          className={`w-full border rounded-lg px-3 pr-5 h-11 outline-none ${
            meta.touched && meta.error ? "border-red-500" : "border-gray-300"
          } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
          style={{ caretColor: "black" }}
        />

        {/* Display overlay showing 12-hour format */}
        {/* <div
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[14px]"
          style={{ color: field.value ? "#000" : "#9ca3af" }}
        >
          {displayValue || "Select time"}
        </div> */}
      </div>

      {meta.touched && meta.error && <p className="text-sm text-red-500 mt-1">{meta.error}</p>}
    </div>
  );
};
