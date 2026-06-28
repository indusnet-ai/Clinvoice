import { useState } from "react";
import { COUNTRIES } from "../data/countries";
import { useField } from "formik";
import { CountryFlag } from "@/utils";

type ValidationMode = "primary" | "secondary";

interface PhoneInputProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  validationType?: ValidationMode;
  onError?: (error: string) => void;
}

export const PhoneInput = ({ value, onChange, disabled, validationType = "primary", onError }: PhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [error, setError] = useState("");

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setOpen(false);

    onChange({
      dialCode: country.dialCode,
      number: "",
      full: country.dialCode,
    });
    setError("");
    onError?.("");
  };

  const handleNumberChange = (e) => {
    let num = e.target.value.replace(/\D/g, "");
    let errorMsg = "";

    // Determine max length based on validation type
    const maxLen = validationType === "secondary" ? 15 : selectedCountry.maxLength;

    // For primary Indian numbers, validate the first digit
    if (validationType === "primary" && selectedCountry.code === "IN" && num.length > 0) {
      const firstDigit = num[0];
      if (!["6", "7", "8", "9"].includes(firstDigit)) {
        errorMsg = "Mobile number must start with 6, 7, 8, or 9";
        setError(errorMsg);
        onError?.(errorMsg);
        return; // Don't update the value
      }
    }

    // Truncate if exceeds max length
    if (num.length > maxLen) {
      num = num.slice(0, maxLen);
    }

    setError("");
    onError?.("");

    onChange({
      dialCode: selectedCountry.dialCode,
      number: num,
      full: selectedCountry.dialCode + num,
    });
  };

  return (
    <div className="relative w-full">
      {/* SINGLE INPUT WRAPPER */}
      <div className="flex items-center rounded-md bg-white">
        {/* FLAG + CODE SECTION */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 border-r border-gray-300 bg-gray-50 hover:bg-gray-100"
        >
          <CountryFlag code={selectedCountry.code} />
          <span className="text-sm text-gray-700">{selectedCountry?.dialCode}</span>
        </button>

        {/* PHONE NUMBER INPUT PART */}
        <input
          type="tel"
          value={value?.number}
          onChange={handleNumberChange}
          placeholder="Enter mobile number"
          className="w-full text-[14px] px-3 py-2 outline-none"
          disabled={disabled}
        />
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-30 bg-white border rounded-md shadow-lg w-full mt-1 max-h-60 overflow-y-auto">
          {/* Search box */}
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[14px] px-3 py-2 border-b outline-none"
          />

          {COUNTRIES.filter(
            (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search),
          ).map((country) => (
            <div
              key={country.code}
              onClick={() => handleCountrySelect(country)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              <CountryFlag code={country.code} />
              <span>{country.name}</span>
              <span className="ml-auto">{country.dialCode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
type PhoneValue = {
  dialCode: string;
  number: string;
  full: string;
};

interface FormPhoneInputProps {
  label: string;
  required?: boolean;
  name: string;
  disabled?: boolean;
  validationType?: "primary" | "secondary";
}

export const FormPhoneInput: React.FC<FormPhoneInputProps> = ({
  label,
  required,
  name,
  disabled = false,
  validationType = "primary",
  ...props
}) => {
  const [field, meta, helpers] = useField<PhoneValue>(name);
  const [inlineError, setInlineError] = useState("");

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium text-[12px]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div
        className={`w-full border rounded-lg px-1 py-0 bg-white flex items-center gap-2 cursor-text 
          ${meta.touched && (meta.error || inlineError) ? "border-red-500" : "border-gray-300"}
          focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200
        `}
        onBlur={() => helpers.setTouched(true)}
      >
        <PhoneInput
          value={field.value as PhoneValue}
          onChange={(val) => helpers.setValue(val)}
          disabled={disabled}
          validationType={validationType}
          onError={setInlineError}
        />
      </div>
      {inlineError && <p className="text-sm text-red-500 mt-1">{inlineError}</p>}
      {!inlineError && meta.touched && (meta.error as any)?.number && (
        <p className="text-sm text-red-500 mt-1">{(meta.error as any).number}</p>
      )}
    </div>
  );
};
