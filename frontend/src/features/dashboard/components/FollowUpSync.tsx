// import { useFormikContext } from "formik";
// import { useEffect, useRef } from "react";

// type Unit = "days" | "weeks" | "months";

// const unitToDays = (value: number, unit: Unit) => {
//   if (unit === "days") return value;
//   if (unit === "weeks") return value * 7;
//   return value * 30;
// };

// const daysToUnitValue = (days: number, unit: Unit) => {
//   if (unit === "days") return days;
//   if (unit === "weeks") return Math.ceil(days / 7);
//   return Math.ceil(days / 30);
// };

// const startOfToday = () => {
//   const d = new Date();
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const addDaysLocal = (base: Date, days: number) => {
//   const d = new Date(base);
//   d.setDate(d.getDate() + days);
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const formatLocalYYYYMMDD = (d: Date) => {
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// };

// const parseLocalYYYYMMDD = (s: string) => {
//   const [y, m, d] = s.split("-").map(Number);
//   if (!y || !m || !d) return null;
//   const date = new Date(y, m - 1, d);
//   date.setHours(0, 0, 0, 0);
//   return date;
// };

// const parsePositiveNumber = (v: any): number | null => {
//   if (v === "" || v === null || v === undefined) return null;
//   const n = Number(v);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   return n;
// };

// export const FollowUpSync = () => {
//   const { values, setFieldValue } = useFormikContext<any>();

//   const dayValueRaw = values.followup?.day?.value;
//   const unit: Unit = values.followup?.day?.unit || "days";
//   const followdate: string = values.followup?.followdate || "";

//   const lastSource = useRef<"day" | "date" | null>(null);

//   // A) Day -> Date (BUT do not overwrite AI date if day is empty)
//   useEffect(() => {
//     if (lastSource.current === "date") return;

//     const n = parsePositiveNumber(dayValueRaw);

//     // If user hasn't typed day, don't change date (keep AI date)
//     if (n === null) return;

//     if (followdate) return;

//     const today = startOfToday();
//     const totalDays = unitToDays(n, unit);
//     const next = addDaysLocal(today, totalDays);
//     const formatted = formatLocalYYYYMMDD(next);

//     if (formatted !== followdate) {
//       lastSource.current = "day";
//       setFieldValue("followup.followdate", formatted, false);
//     }
//   }, [dayValueRaw, unit, followdate]);

//   // B) Date -> Day
//   useEffect(() => {
//     if (lastSource.current === "day") {
//       lastSource.current = null;
//       return;
//     }
//     if (!followdate) return;

//     const selected = parseLocalYYYYMMDD(followdate);
//     if (!selected) return;

//     const today = startOfToday();
//     const diffMs = selected.getTime() - today.getTime();
//     const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
//     if (diffDays <= 0) return;

//     const newValue = String(daysToUnitValue(diffDays, unit));

//     if (newValue !== String(dayValueRaw ?? "")) {
//       lastSource.current = "date";
//       setFieldValue("followup.day.value", newValue, false);
//     }
//   }, [followdate]);

//   return null;
// };
import { useFormikContext } from "formik";
import { useEffect, useRef } from "react";

type Unit = "days" | "weeks" | "months";

const unitToDays = (value: number, unit: Unit) => {
  if (unit === "days") return value;
  if (unit === "weeks") return value * 7;
  return value * 30;
};

const daysToUnitValue = (days: number, unit: Unit) => {
  if (unit === "days") return days;
  if (unit === "weeks") return Math.ceil(days / 7);
  return Math.ceil(days / 30);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDaysLocal = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatLocalYYYYMMDD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseLocalYYYYMMDD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parsePositiveNumber = (v: any): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
};

export const FollowUpSync = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  const dayValueRaw = values.followup?.day?.value;
  const unit: Unit = values.followup?.day?.unit || "days";
  const followdate: string = values.followup?.followdate || "";

  // Track previous values to know what user changed
  const prev = useRef({
    dayValueRaw: dayValueRaw,
    unit: unit,
    followdate: followdate,
  });

  useEffect(() => {
    const prevDay = prev.current.dayValueRaw;
    const prevUnit = prev.current.unit;
    const prevDate = prev.current.followdate;

    const dayChanged = String(dayValueRaw ?? "") !== String(prevDay ?? "");
    const unitChanged = unit !== prevUnit;
    const dateChanged = (followdate || "") !== (prevDate || "");

    // 1) If DATE changed (user picked date) -> update DAY based on unit
    if (dateChanged) {
      if (!followdate) {
        // user cleared the date -> don't force day
        prev.current = { dayValueRaw, unit, followdate };
        return;
      }

      const selected = parseLocalYYYYMMDD(followdate);
      if (!selected) {
        prev.current = { dayValueRaw, unit, followdate };
        return;
      }

      const today = startOfToday();
      const diffMs = selected.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // if past/today, decide your rule (here: don't update)
      if (diffDays <= 0) {
        prev.current = { dayValueRaw, unit, followdate };
        return;
      }

      const newVal = String(daysToUnitValue(diffDays, unit));
      if (newVal !== String(dayValueRaw ?? "")) {
        setFieldValue("followup.day.value", newVal, false);
      }

      prev.current = { dayValueRaw, unit, followdate };
      return;
    }

    // 2) If UNIT changed:
    //    - if date exists -> keep date, recompute day in new unit
    //    - else -> use day to compute date
    if (unitChanged) {
      if (followdate) {
        const selected = parseLocalYYYYMMDD(followdate);
        if (selected) {
          const today = startOfToday();
          const diffMs = selected.getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            const newVal = String(daysToUnitValue(diffDays, unit));
            if (newVal !== String(dayValueRaw ?? "")) {
              setFieldValue("followup.day.value", newVal, false);
            }
          }
        }
      } else {
        const n = parsePositiveNumber(dayValueRaw);
        if (n !== null) {
          const today = startOfToday();
          const totalDays = unitToDays(n, unit);
          const next = addDaysLocal(today, totalDays);
          const formatted = formatLocalYYYYMMDD(next);
          if (formatted !== followdate) {
            setFieldValue("followup.followdate", formatted, false);
          }
        }
      }

      prev.current = { dayValueRaw, unit, followdate };
      return;
    }

    // 3) If DAY changed -> update DATE (but don't overwrite AI date when day empty)
    if (dayChanged) {
      const n = parsePositiveNumber(dayValueRaw);

      // if user cleared day -> do nothing (keep whatever date already exists)
      if (n === null) {
        prev.current = { dayValueRaw, unit, followdate };
        return;
      }

      const today = startOfToday();
      const totalDays = unitToDays(n, unit);
      const next = addDaysLocal(today, totalDays);
      const formatted = formatLocalYYYYMMDD(next);

      if (formatted !== followdate) {
        setFieldValue("followup.followdate", formatted, false);
      }

      prev.current = { dayValueRaw, unit, followdate };
      return;
    }

    // nothing changed
    prev.current = { dayValueRaw, unit, followdate };
  }, [dayValueRaw, unit, followdate, setFieldValue]);

  return null;
};

