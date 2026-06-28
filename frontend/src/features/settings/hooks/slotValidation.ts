import * as Yup from "yup";

const toMinutes = (time: string) => {
  if (!time || !time.includes(":")) return NaN;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export const SlotValidationSchema = Yup.object()
  .shape({
    from: Yup.string().required("From time is required"),
    to: Yup.string().required("To time is required"),
    slotDuration: Yup.string()
      .required("Duration is required")
      .oneOf(["15", "30", "45", "60", "90", "120"], "Invalid duration"),

    monday: Yup.boolean(),
    tuesday: Yup.boolean(),
    wednesday: Yup.boolean(),
    thursday: Yup.boolean(),
    friday: Yup.boolean(),
    saturday: Yup.boolean(),
    sunday: Yup.boolean(),
  })

  // 1) TO must be AFTER FROM
  .test("to-after-from", "To time must be after From time", function (values) {
    const from = values?.from;
    const to = values?.to;
    if (!from || !to) return true;

    const fromMin = toMinutes(from);
    const toMin = toMinutes(to);
    if (Number.isNaN(fromMin) || Number.isNaN(toMin)) return true;

    if (toMin <= fromMin) {
      return this.createError({
        path: "to",
        message: "To time must be after From time",
      });
    }
    return true;
  })

  // 2) DURATION must FIT within (to - from)
  .test("duration-fits", "Selected duration does not fit between From and To time", function (values) {
    const from = values?.from;
    const to = values?.to;
    const slotDuration = values?.slotDuration;
    if (!from || !to || !slotDuration) return true;

    const fromMin = toMinutes(from);
    const toMin = toMinutes(to);
    const duration = Number(slotDuration);
    if (Number.isNaN(fromMin) || Number.isNaN(toMin) || Number.isNaN(duration)) return true;

    // if to is not after from, let the previous test show the error on "to"
    if (toMin <= fromMin) return true;

    const range = toMin - fromMin;
    if (duration > range) {
      return this.createError({
        path: "slotDuration",
        message: `Duration must be within the selected time range (${range} minutes available)`,
      });
    }
    return true;
  })

  // 3) At least one day selected
  .test("at-least-one-day", "Please select at least one day", function (values) {
    const hasDay = DAY_KEYS.some((day) => Boolean(values?.[day]));
    if (!hasDay) {
      return this.createError({
        path: "days", // virtual field
        message: "Please select at least one day",
      });
    }
    return true;
  });
