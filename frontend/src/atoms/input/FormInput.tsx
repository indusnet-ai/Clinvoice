// components/FormInput.tsx
import React from "react";
import { useField } from "formik";

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean; // default false
  placeholder?: string;
  disabled?: boolean;
  regex?: RegExp;
  className?: string;
  containerClassName?: string;
  hideLabel?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  required = false,
  disabled = false,
  regex,
  className = "",
  containerClassName = "mb-4",
  hideLabel = false,
  ...props
}) => {
  const [field, meta, helpers] = useField(props.name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (regex) {
      val = val
        .split("")
        .filter((char) => regex.test(char))
        .join("");
    }

    helpers.setValue(val);
  };

  return (
    <div className={containerClassName}>
      {!hideLabel && (
        <label className="block mb-1 font-medium text-[12px]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        {...field}
        {...props}
        onChange={handleChange}
        className={`${
          className ||
          `w-full border rounded-lg px-3 h-11 text-gray-700 text-[14px] outline-none ${
            meta.touched && meta.error ? "border-red-500" : "border-gray-300"
          } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`
        } `}
        disabled={disabled}
      />

      {meta.touched && meta.error && <p className="text-sm text-red-500 mt-1">{meta.error}</p>}
    </div>
  );
};
