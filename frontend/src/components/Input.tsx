import React from "react";
import { FaRegCheckCircle } from "react-icons/fa";

interface Option {
  value: string;
  label: string;
}

interface InputComponentProps {
  label?: string;
  placeholder?: string;
  type: "text" | "date" | "select" | "number" | "email" | "time" | "textarea" | "datetime-local" | "file";
  name: string;
  value?: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  options?: Option[];
  onFocus?: () => void;
  onClick?: () => void;
  onBlur?: (arg: any) => void;
  required?: boolean;
  isVerify?: string;
  handleVerifyOTP?: (arg1: string) => void;
  maxLength?: number;
  disabled?: boolean;
  id?: any;
}

export default function Input({
  label,
  placeholder,
  type,
  name,
  value,
  onChange,
  onClick,
  options = [],
  onFocus,
  onBlur,
  required,
  isVerify,
  handleVerifyOTP = () => {},
  maxLength,
  disabled,
  id,
}: InputComponentProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === "number") {
      if (e.key.length === 1 && !/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    }
  };
  return (
    <div>
      <label className="mb-3 block text-black text-sm font-medium ">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border-[1.5px] bg-white border-stroke bg-transparent py-2.5 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border-[1.5px] bg-white border-stroke bg-transparent py-2.5 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          placeholder={placeholder}
          // onFocus={onFocus}
          // onBlur={onBlur}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </textarea>
      ) : type === "file" ? (
        <input
          type={type}
          placeholder={placeholder}
          name={name}
          // value={value ? value : ''}
          onChange={onChange}
          id={id}
          // placeholder="Default Input"
          className={`w-full rounded-lg border-[1.5px] bg-white border-stroke bg-transparent px-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
        />
      ) : (
        <>
          <input
            type={type}
            placeholder={placeholder}
            name={name}
            value={value ? value : ""}
            onChange={onChange}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={`${
              isVerify && !(isVerify === "Verified") ? "w-[274px] rounded-l-lg" : "w-full rounded-lg"
            } border-[1.5px] bg-white border-stroke bg-transparent py-2.5 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
            onFocus={onFocus}
            onBlur={onBlur}
            maxLength={maxLength}
            disabled={disabled}
            id={id}
          />
          {isVerify === "Abha_Addr" && (
            <button
              onClick={() => handleVerifyOTP?.("aabha")}
              className="me-2 inline-flex items-center justify-center gap-2  border border-primary py-2.5 px-6 text-center font-medium text-primary hover:bg-opacity-90 lg:px-6 xl:px-6 relative right-0.5 bg-[#6070FF33] rounded-r-md"
            >
              Verify
            </button>
          )}
          {isVerify === "Aadhar_Addr" && (
            <button
              onClick={() => handleVerifyOTP?.("aadhar")}
              className="me-2 inline-flex items-center justify-center gap-2  border border-primary py-2.5 px-6 text-center font-medium text-primary hover:bg-opacity-90 lg:px-6 xl:px-6 relative right-0.5 bg-[#6070FF33] rounded-r-md"
            >
              Verify
            </button>
          )}
          {isVerify === "Mobile_No" && (
            <button
              onClick={() => handleVerifyOTP?.("mobile")}
              className="me-2 inline-flex items-center justify-center gap-2  border border-primary py-2.5 px-6 text-center font-medium text-primary hover:bg-opacity-90 lg:px-6 xl:px-6 relative right-0.5 bg-[#6070FF33] rounded-r-md"
            >
              Verify
            </button>
          )}
          {isVerify === "Abha_Number" && (
            <button
              onClick={() => handleVerifyOTP?.("abha_number")}
              className="me-2 inline-flex items-center justify-center gap-2  border border-primary py-2.5 px-6 text-center font-medium text-primary hover:bg-opacity-90 lg:px-6 xl:px-6 relative right-0.5 bg-[#6070FF33] rounded-r-md"
            >
              Verify
            </button>
          )}
          {isVerify === "Verified" && <FaRegCheckCircle className="text-green-400 absolute mt-[-30px] ml-[348px]" />}
        </>
      )}
    </div>
  );
}
