import React, { useEffect, useRef, useState } from "react";
import { useField } from "formik";
import { FiChevronDown } from "react-icons/fi";

interface Option {
  label: string;
  value: string | number;
}

interface Props {
  label: string;
  name: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export const SearchableSelect = ({
  label,
  name,
  required = false,
  options,
  placeholder = "Select…",
  disabled = false,
}: Props) => {
  const [field, meta, helpers] = useField(name);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const wraperRef = useRef<HTMLDivElement | null>(null);

  const filtered = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = field.value ? options.find((o) => o.value === field.value)?.label ?? String(field.value) : placeholder;

  const error = meta.touched && meta.error;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wraperRef.current && !wraperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="mb-4 relative" ref={wraperRef}>
      <label className="block mb-1 font-medium text-[12px]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* SELECT BOX */}
      <div
        tabIndex={0}
        className={`
          w-full border rounded-lg px-3 py-2 h-11 bg-white flex justify-between items-center cursor-pointer transition
          ${error ? "border-red-500" : "border-gray-300"}
          focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200
        `}
        onClick={() => (!disabled ? setOpen(!open) : undefined)}
      >
        <span className={`font-medium text-[14px] ${field.value ? "text-gray-700" : "text-[#A1A7B3]"}`}>{selectedLabel}</span>

        <FiChevronDown className="text-gray-500 cursor-pointer" />
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg">
          {/* Search */}
          <input
            type="text"
            placeholder="Search…"
            className="w-full px-3 py-2 border-b border-gray-200 outline-none "
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && <div className="p-3 text-gray-500">No results...</div>}

            {filtered.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${field.value === opt.value ? "bg-blue-50" : ""
                  }`}
                onClick={() => {
                  helpers.setValue(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{meta.error}</p>}
    </div>
  );
};
