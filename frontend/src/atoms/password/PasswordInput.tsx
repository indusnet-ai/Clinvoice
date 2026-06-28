// components/form/PasswordInput.tsx
import React, { useState } from "react";
import { useField } from "formik";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface Props {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}

export const PasswordInput = ({ label, required = false, ...props }: Props) => {
  const [visible, setVisible] = useState(false);
  const [field, meta] = useField(props.name);

  return (
    <div className="mb-4 relative">
      <label className="block mb-1 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        {...field}
        {...props}
        type={visible ? "text" : "password"}
        className={`w-full border rounded px-3 py-2 pr-10 outline-none ${
          meta.touched && meta.error ? "border-red-500" : "border-gray-300"
        } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
      />

      <span className="absolute right-3 top-[38px] cursor-pointer text-gray-600" onClick={() => setVisible(!visible)}>
        {visible ? <FiEyeOff /> : <FiEye />}
      </span>

      {meta.touched && meta.error && <p className="text-red-500 text-sm mt-1">{meta.error}</p>}
    </div>
  );
};
