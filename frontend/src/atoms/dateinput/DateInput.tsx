import { calculateAge, formatDateForDisplay } from "@/utils";
import { useField } from "formik";
import { useMemo, useRef, useState, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface FormDateInputProps {
  label?: string;
  required?: boolean;
  name: string;
  showAge?: boolean;
  disabled?: boolean;
  mindate?: string; // YYYY-MM-DD
  maxdate?: string; // YYYY-MM-DD
}

export const FormDateInput: React.FC<FormDateInputProps> = ({
  label,
  required,
  name,
  showAge = false,
  disabled = false,
  mindate,
  maxdate,
}) => {
  const [field, meta, helpers] = useField(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const [displayValue, setDisplayValue] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const isInternalChange = useRef(false);

  const isSafari = useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(ua);
  }, []);

  const formatToDisplay = (value?: string | Date | null): string => {
    return formatDateForDisplay(value);
  };

  const formatToInternal = (value: string): string => {
    if (!value) return "";
    const parts = value.split("-");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day && month && year && year.length === 4) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    return "";
  };

  const parseInternalToDate = (value?: string): Date | null => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    if (isInternalChange.current) return;
    if (field.value) {
      setDisplayValue(formatToDisplay(field.value));
    } else {
      setDisplayValue("");
    }
  }, [field.value]);

  const age = useMemo(() => {
    // Only show age when the full date is visible in the input (10 chars = DD-MM-YYYY)
    if (!showAge || !field.value || displayValue.length !== 10) return "";
    return calculateAge(field.value);
  }, [field.value, displayValue, showAge]);

  /**
   * Rebuild a DD-MM-YYYY display string from a raw digit string (max 8 digits).
   */
  const rebuildFormatted = (digits: string): string => {
    let d = digits.slice(0, 8);
    let out = d;
    if (d.length > 2) out = d.slice(0, 2) + "-" + d.slice(2);
    if (d.length > 4) out = out.slice(0, 5) + "-" + out.slice(5);
    return out;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;

    e.preventDefault();
    isInternalChange.current = true;

    const input = inputRef.current;
    if (!input) return;

    const cursorPos = input.selectionStart ?? displayValue.length;
    const selEnd = input.selectionEnd ?? cursorPos;

    // Current pure digits
    let digits = displayValue.replace(/\D/g, "");

    if (e.key === "Backspace") {
      if (selEnd > cursorPos) {
        // Has a selection — remove selected digits
        // Figure out which digit positions are covered by [cursorPos, selEnd)
        let digitsBefore = "";
        let digitsAfter = "";
        let digitIdx = 0;
        for (let i = 0; i < displayValue.length; i++) {
          if (/\d/.test(displayValue[i])) {
            if (i < cursorPos) digitsBefore += displayValue[i];
            else if (i >= selEnd) digitsAfter += displayValue[i];
            digitIdx++;
          }
        }
        digits = digitsBefore + digitsAfter;
      } else {
        // No selection — remove the digit just before cursor, skip separators
        let pos = cursorPos - 1;
        while (pos >= 0 && displayValue[pos] === "-") pos--;
        if (pos < 0) return; // nothing to delete
        const charsBefore = displayValue.slice(0, pos).replace(/\D/g, "");
        const charsAfter = displayValue.slice(pos + 1).replace(/\D/g, "");
        digits = charsBefore + charsAfter;
      }
    } else {
      // Delete — remove digit at/after cursor
      let pos = cursorPos;
      while (pos < displayValue.length && displayValue[pos] === "-") pos++;
      if (pos >= displayValue.length) return;
      const charsBefore = displayValue.slice(0, pos).replace(/\D/g, "");
      const charsAfter = displayValue.slice(pos + 1).replace(/\D/g, "");
      digits = charsBefore + charsAfter;
    }

    // Clamp digits to 8
    digits = digits.slice(0, 8);

    const formatted = rebuildFormatted(digits);
    setDisplayValue(formatted);

    if (formatted.length === 10) {
      helpers.setValue(formatToInternal(formatted));
    } else {
      helpers.setValue("");
    }

    setTimeout(() => {
      isInternalChange.current = false;
      if (!inputRef.current) return;
      const digitCount = digits.length;
      let newPos: number;
      if (digitCount <= 2) newPos = digitCount;
      else if (digitCount <= 4) newPos = digitCount + 1;
      else newPos = digitCount + 2;
      newPos = Math.min(newPos, formatted.length);
      inputRef.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    isInternalChange.current = true;

    let digits = raw.replace(/\D/g, "");

    let day = digits.slice(0, 2);
    let month = digits.slice(2, 4);
    let year = digits.slice(4, 8);

    if (day.length === 2) {
      if (parseInt(day, 10) > 31) day = "31";
      if (parseInt(day, 10) === 0) day = "01";
    }
    if (month.length === 2) {
      if (parseInt(month, 10) > 12) month = "12";
      if (parseInt(month, 10) === 0) month = "01";
    }

    digits = day + month + year;

    let formatted = rebuildFormatted(digits);
    if (formatted.length > 10) formatted = formatted.slice(0, 10);

    setDisplayValue(formatted);

    if (formatted.length === 10) {
      helpers.setValue(formatToInternal(formatted));
    } else {
      helpers.setValue("");
    }

    setTimeout(() => {
      isInternalChange.current = false;
      if (inputRef.current) {
        let newPos = cursorPos;
        const digitCount = digits.length;

        if (digitCount === 2 && raw.length <= 2) {
          newPos = 3;
        } else if (digitCount === 4 && raw.length <= 5) {
          newPos = 6;
        } else {
          if (digitCount <= 2) newPos = digitCount;
          else if (digitCount <= 4) newPos = digitCount + 1;
          else if (digitCount <= 8) newPos = digitCount + 2;
        }

        newPos = Math.min(newPos, formatted.length);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleBlur = () => {
    if (!displayValue) {
      // Field is fully cleared — reset Formik value to remove stale age/errors
      helpers.setValue("");
    } else if (displayValue.length < 10) {
      // Partial date — push into Formik so validation fires
      helpers.setValue(displayValue);
    }
    helpers.setTouched(true);
  };

  const handleNativeDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      helpers.setValue("");
      setDisplayValue("");
      return;
    }

    helpers.setValue(value);
    setDisplayValue(formatToDisplay(value));
  };

  const openPicker = () => {
    if (disabled) return;

    if (isSafari) {
      setIsCalendarOpen(true);
      return;
    }

    const el = datePickerRef.current;
    if (!el) return;

    el.focus({ preventScroll: true });

    try {
      (el as any).showPicker?.();
    } catch {
      el.click();
    }
  };

  return (
    <div className={label ? "mb-4" : "mb-0"}>
      {label && (
        <label className="block mb-1 font-medium text-[12px]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`relative w-full border rounded-lg px-3 h-11 bg-white flex items-center ${
          meta.touched && meta.error ? "border-red-500" : "border-gray-300"
        } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200`}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="DD-MM-YYYY"
          maxLength={10}
          inputMode="numeric"
          className="w-full text-[14px] outline-none bg-transparent pr-20 appearance-none placeholder:text-[#a1a7b3]"
          disabled={disabled}
        />

        {!isSafari && (
          <input
            ref={datePickerRef}
            type="date"
            value={field.value || ""}
            onChange={handleNativeDatePickerChange}
            max={maxdate}
            min={mindate}
            className="absolute top-10 opacity-0"
            style={{ width: 1, height: 1 }}
            disabled={disabled}
            tabIndex={-1}
          />
        )}

        {isSafari && isCalendarOpen && (
          <div className="absolute top-12 right-0 z-50 bg-white shadow-lg border rounded-lg p-2">
            <DatePicker
              inline
              selected={parseInternalToDate(field.value)}
              onChange={(date: Date | null) => {
                if (!date) return;

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const formatted = `${year}-${month}-${day}`;

                helpers.setValue(formatted);
                setDisplayValue(formatToDisplay(formatted));
                helpers.setTouched(true);
                setIsCalendarOpen(false); // closes only after actual date selection
              }}
              minDate={mindate ? parseInternalToDate(mindate) : undefined}
              maxDate={maxdate ? parseInternalToDate(maxdate) : undefined}
              disabled={disabled}
            />
          </div>
        )}

        {showAge && age !== "" && <span className="absolute right-10 text-[12px] text-gray-500">{age} yrs</span>}

        <FiCalendar className="absolute right-3 text-gray-500 cursor-pointer" onClick={openPicker} />
      </div>

      {meta.touched && meta.error && <p className="text-sm text-red-500 mt-1">{meta.error}</p>}
    </div>
  );
};
