// import React from "react";
// import { useField } from "formik";

// interface FormUnitInputProps {
//   name: string;
//   unit?: string;
//   placeholder?: string;
//   type?: "text" | "number";
//   min?: number;
//   max?: number;
//   maxLength?: number;
// }

// export const FormUnitInput: React.FC<FormUnitInputProps> = ({
//   name,
//   unit = "",
//   placeholder,
//   type = "number",
//   min,
//   max,
//   maxLength,
// }) => {
//   const [field, meta, helpers] = useField(name);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;

//     if (type === "number") {
//       value = value.replace(/[^0-9.]/g, "");
//     }

//     if (maxLength && value.length > maxLength) return;

//     helpers.setValue(value);
//   };

//   return (
//     <div
//       className={`flex items-center h-11 rounded-lg border overflow-hidden bg-white
//         ${meta.touched && meta.error ? "border-red-500" : "border-gray-300"}`}
//     >
//       {/* VALUE */}
//       <input
//         value={field.value}
//         onChange={handleChange}
//         onBlur={field.onBlur}
//         placeholder={placeholder}
//         inputMode="decimal"
//         type="text"
//         min={min}
//         max={max}
//         className="flex-1 px-3 w-10 outline-none text-sm text-left"
//       />

//       {/* DIVIDER */}
//       {unit && <div className="h-6 w-px bg-gray-300" />}

//       {/* UNIT */}
//       {unit && <div className="px-3 text-xs text-gray-600 whitespace-nowrap">{unit}</div>}
//     </div>
//   );
// };

import React from "react";
import { useField } from "formik";

interface FormUnitInputProps {
  name: string;
  unit?: string;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  maxLength?: number;
  disabled?: boolean;
}

export const FormUnitInput: React.FC<FormUnitInputProps> = ({
  name,
  unit = "",
  placeholder,
  type = "text",
  min,
  max,
  maxLength,
  disabled,
}) => {
  const [field, meta, helpers] = useField(name);
  const showError = Boolean(meta.touched && meta.error);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let value = e.target.value;

    // Special handling for frequency field
    if (name.includes("frequency")) {
      // allow only 0 or 1
      value = value.replace(/[^01]/g, "");

      // max 4 digits allowed
      value = value.slice(0, 4);

      // add hyphen automatically
      value = value.split("").join("-");
    } else {
      // normal input
      if (type === "number") {
        value = value.replace(/[^0-9.]/g, "");
      }

      if (maxLength && value.length > maxLength) return;
    }
    // if (value === field.value) return;
    helpers.setValue(value);
  };

  return (
    <div className="w-full">
      <div
        className={`flex items-center h-11 rounded-lg border overflow-hidden bg-white
        ${meta.touched && meta.error ? "border-red-500" : "border-gray-300"}`}
      >
        <input
          value={field.value || ""}
          onChange={handleChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          type="text"
          min={min}
          max={max}
          disabled={disabled}
          className="flex-1 px-3 w-10 outline-none text-sm text-left"
        />

        {unit && <div className="h-6 w-px bg-gray-300" />}
        {unit && <div className="px-3 text-xs text-gray-600 whitespace-nowrap">{unit}</div>}
      </div>

      {showError && <p className="mt-1 text-xs text-red-500">{meta.error}</p>}
    </div>
  );
};
