// components/form/SelectInput.tsx
import React from "react";
import { useField } from "formik";

interface Props {
  label: string;
  name: string;
  required?: boolean;
  options: { label: string; value: string | number }[];
}

export const SelectInput = ({ label, required = false, options, ...props }: Props) => {
  const [field, meta] = useField(props.name);

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        {...field}
        {...props}
        className={`w-full border rounded px-3 py-2 outline-none bg-white ${
          meta.touched && meta.error ? "border-red-500" : "border-gray-300"
        } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200`}
      >
        <option value="">Select...</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {meta.touched && meta.error && <p className="text-red-500 text-sm mt-1">{meta.error}</p>}
    </div>
  );
};
