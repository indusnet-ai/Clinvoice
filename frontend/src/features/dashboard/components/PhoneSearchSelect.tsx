import React, { useEffect, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";
import { SearchIcon, UserIcon } from "@/assets/icons"; // adjust path
import { useLazyGetPatientByMobileQuery } from "../services/ConsultationApi";
import NoRecordImg from "@/assets/imgs/searching_nodata.png";
import { toDateInputValue } from "@/utils";
import { PatientAvatar } from "@/app/component";

interface Props {
  name: string;
  label: string;
  onAddNew: (mobile: { dialCode: string; number: string }) => void;
  onPatientSelected: () => void;
  required?: boolean;
}

export const PhoneSearchSelect: React.FC<Props> = ({ name, label, onAddNew, onPatientSelected, required }) => {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();
  const [searchPatient, { isFetching }] = useLazyGetPatientByMobileQuery();

  const [mobile, setMobile] = useState("");
  const [options, setOptions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);

  const [hasSelected, setHasSelected] = useState(false);

  // helper
  const isAddNewOnly = open && options.length === 1 && options[0]?.type === "add_new";

  /* Outside Click (smart) */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;

      // if input cleared -> close always
      if (mobile.length === 0) {
        setOpen(false);
        return;
      }

      // 1) only add_new is showing => never close
      if (isAddNewOnly) return;

      // 2) options exist => don't close until user selects
      if (!hasSelected) return;

      // after selection, allow close
      setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobile, open, options, hasSelected]);

  /* Manual Search */
  const handleSearch = async () => {
    if (mobile.length !== 10) return;

    // Validate Indian mobile number prefix
    const firstDigit = mobile[0];
    if (!["6", "7", "8", "9"].includes(firstDigit)) {
      setValidationError("Mobile number must start with 6, 7, 8, or 9");
      return;
    }

    try {
      const res = await searchPatient({ mobile_no: mobile }).unwrap();
      if (res?.data?.length) {
        setOptions(
          res.data.map((p: any) => ({
            type: "patient",
            value: p.id,
            patient: p,
          })),
        );
      } else {
        setOptions([{ type: "add_new" }]);
      }
      setOpen(true);
    } catch (err: any) {
      if (err?.status === 400) {
        setOptions([{ type: "add_new" }]);
        setOpen(true);
      } else {
        console.error("Search patient failed", err);
      }
    }
  };

  useEffect(() => {
    if (mobile.length === 10) {
      handleSearch();
    }
  }, [mobile]);

  /* ---------------- Option Select ---------------- */
  const handleSelect = (opt: any) => {
    if (opt.type === "add_new") {
      setOpen(false);
      onAddNew({
        dialCode: "+91", // or detect dynamically
        number: mobile,
      });
      return;
    }
    setHasSelected(true);
    const p = opt.patient;
    setFieldValue("patient_id", p.id);
    setFieldValue("mobile", {
      dialCode: p.country_code || "+91",
      number: p.mobile_no,
      full: `${p.country_code}${p.mobile_no}`,
    });
    setFieldValue("patient_name.value", p.patient_name || "");
    setFieldValue("patient_name.unit", p.salutation || "Mr");
    setFieldValue("gender", p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase() : "");
    setFieldValue("blood_group", String(p.blood_group));
    setFieldValue("dob", toDateInputValue(p.dob));
    setMobile(p.mobile_no);
    setOpen(false);
    onPatientSelected();
  };

  return (
    <div className="mb-4 relative" ref={wrapperRef}>
      <label className="text-[12px] font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* ---------- Input with Search Icon ---------- */}
      <div className="relative">
        <input
          type="tel"
          value={mobile}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");

            // Validate first digit for Indian mobile numbers
            if (value.length > 0) {
              const firstDigit = value[0];
              if (!["6", "7", "8", "9"].includes(firstDigit)) {
                setValidationError("Mobile number must start with 6, 7, 8, or 9");
                return; // Don't update the value
              }
            }

            setValidationError("");
            setMobile(value);

            setFieldValue("mobile", {
              dialCode: "+91",
              number: value,
              full: `+91${value}`,
            });
            setHasSelected(false);
            if (value.length <= 9) {
              setOpen(false);
              setOptions([]);
            }
          }}
          placeholder="Enter mobile number"
          className={`w-full border rounded-lg h-11 px-3 pr-10 ${validationError ? "border-red-500" : ""}`}
          maxLength={10}
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={mobile.length !== 10 || isFetching || !!validationError}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 disabled:opacity-50"
        >
          <SearchIcon />
        </button>
      </div>

      {/* Error Message */}
      {validationError && <p className="text-sm text-red-500 mt-1">{validationError}</p>}

      {/* ---------- Dropdown ---------- */}
      {open && (
        <div className="absolute max-h-[30vh] mt-8 overflow-y-scroll z-50 w-full bg-white rounded-lg shadow">
          {isFetching && <div className="p-3 text-sm text-gray-500">Searching...</div>}

          {!isFetching &&
            options.map((opt, idx) => {
              if (opt.type === "add_new") {
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    className="flex flex-col items-center gap-3 rounded-lg p-3 min-h-[25vh] bg-[#FDFDFD] cursor-pointer"
                  >
                    <img src={NoRecordImg} alt="Add" className="w-24 h-20" />
                    <p className="text-[#01030F] text-[14px] font-medium">No Records Found</p>
                    <div className="border-[#6070FF] border rounded-lg py-3 px-6">
                      <p className="text-[#6070FF] text-[14px] font-medium">Add New Patient</p>
                    </div>
                  </div>
                );
              }

              const p = opt.patient;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-[gray] flex gap-2 items-center"
                >
                  <PatientAvatar imageName={p.image} name={p.patient_name} />
                  <div>
                    <p className="font-semibold text-[14px] text-[#1C2253]">{p.patient_name}</p>
                    <p className="font-medium text-[12px] text-[#1C2253]">
                      {p.country_code} {p.mobile_no}
                    </p>
                    <p className="font-medium text-[12px] text-[#1C2253]">
                      {p.age} Years | {p.gender}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {meta.touched && meta.error && (
        <p className="text-red-500 text-sm mt-1">
          {typeof meta.error === "string" ? meta.error : (meta.error as any).number || (meta.error as any).value}
        </p>
      )}
    </div>
  );
};
