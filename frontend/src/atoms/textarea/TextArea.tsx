// components/form/TextArea.tsx
import React from "react";
import { useField } from "formik";

interface Props {
  label: string;
  name: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const TextArea = ({ label, required = false, rows = 4,disabled, ...props }: Props) => {
  const [field, meta] = useField(props.name);

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <textarea
        {...field}
        {...props}
        rows={rows}
        disabled={disabled}
        className={`w-full h-full bg-transparent border-0 rounded px-3 py-2 outline-none ${
          meta.touched && meta.error ? "border-red-500" : "border-gray-300"
        } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
      ></textarea>

      {meta.touched && meta.error && <p className="text-red-500 text-sm mt-1">{meta.error}</p>}
    </div>
  );
};
