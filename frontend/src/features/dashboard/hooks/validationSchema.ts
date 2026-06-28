import * as Yup from "yup";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const noHtmlTags = (msg = "HTML tags are not allowed") =>
  Yup.string().test("no-html", msg, (value) => {
    if (!value) return true;
    return !/<[^>]*>/g.test(value);
  });

// Allow only letters, numbers, space and limited symbols
const allowedCharacters = (msg = "Special characters are not allowed") =>
  Yup.string().test("allowed-chars", msg, (value) => {
    if (!value) return true;

    // allowed: A-Z a-z 0-9 space . , / - ( ) % + :
    return /^[a-zA-Z0-9\s.,\/\-()%+:°]*$/.test(value);
  });

const commonNullableValidation = Yup.string()
  .nullable()
  .trim()
  .max(50, "Maximum 50 characters allowed")
  .test("min-if-filled", "Minimum 1 character required", (value) => {
    if (value === null || value === undefined || value === "") return true;
    return value.trim().length >= 1;
  })
  .concat(noHtmlTags())
  .concat(allowedCharacters());

export const validationSchema = Yup.object({
  temperature: commonNullableValidation,
  pulse: commonNullableValidation,
  spo2: commonNullableValidation,
  weight: commonNullableValidation,
  height: commonNullableValidation,

  bloodPressure: commonNullableValidation,
  // -------------------- CHIEF COMPLAINTS --------------------
  symptoms: noHtmlTags()
    .transform(v => (v?.trim() === "" ? null : v.trim()))
    .nullable()
    .min(3, "Symptoms must be at least 3 characters")
    .max(1000, "Symptoms cannot exceed 1000 characters"),

  duration: noHtmlTags()
    .transform(v => (v?.trim() === "" ? null : v.trim()))
    .nullable()
    .min(1, "Duration must be at least 1 characters")
    .max(100, "Duration cannot exceed 100 characters"),

  remarks: Yup.string().trim().nullable().max(300, "Remarks cannot exceed 300 characters"),

  // -------------------- INVESTIGATIONS --------------------
  investigations: Yup.array().of(
    Yup.object().shape({
      testCat: Yup.string().trim().nullable().max(100, "Max 100 characters"),
      subCat: Yup.string().trim().nullable().max(100, "Max 100 characters"),
      advisedRemark: Yup.string().trim().nullable().max(200, "Max 200 characters"),
    }),
  ),

  // -------------------- DIAGNOSIS --------------------
  diagnosis: noHtmlTags()
    .transform(v => (v?.trim() === "" ? null : v.trim()))
    .nullable()
    .min(3, "Diagnosis must be at least 3 characters")
    .max(1000, "Diagnosis cannot exceed 1000 characters"),

  // -------------------- DIET PLAN --------------------
  dietPlan: Yup.string()
    .transform(v => (v?.trim() === "" ? null : v.trim()))
    .nullable()
    .min(3, "Diet plan must be at least 3 characters")
    .max(1000, "Diet plan cannot exceed 1000 characters"),

  // -------------------- PAST MEDICAL --------------------
  pastmedical: Yup.string()
    .transform(v => (v?.trim() === "" ? null : v.trim()))
    .nullable()
    .min(3, "Past medical history must be at least 3 characters")
    .max(1000, "Past medical history cannot exceed 1000 characters"),
  medication: Yup.array().of(
    Yup.object().shape({
      medicineName: noHtmlTags()
        .trim()
        .nullable()
        .max(100, "Max 100 characters")
        .matches(/^[A-Za-z0-9 -]*$/, "Only alphabets, numbers, spaces and hyphen (-) are allowed"),

      dosage: Yup.string()
        .trim()
        .nullable()
        .max(100, "Max 100 characters")
        .matches(/^[A-Za-z0-9 -]*$/, "Only alphabets, numbers, spaces and hyphen (-) are allowed"),

      frequency: Yup.string()
        .trim()
        .nullable()
        .test("valid-frequency", "Frequency must be like 0-0-0 or 0-0-0-0", (value) => {
          if (!value || value.trim() === "") return true;

          return /^([01]-[01]-[01])(-[01])?$/.test(value);
        }),

      timing: Yup.string()
        .trim()
        .nullable()
        .max(100, "Max 100 characters")
        .matches(/^[A-Za-z0-9 ,\-]*$/, "Only alphabets, numbers, spaces, commas and hyphen (-) are allowed"),
      duration: Yup.string()
        .trim()
        .nullable()
        .max(100, "Max 100 characters")
        .matches(/^[A-Za-z0-9 -]*$/, "Only alphabets, numbers, spaces and hyphen (-) are allowed"),

      quantity: Yup.string()
        .trim()
        .nullable()
        .max(100, "Max 100 characters")
        .matches(/^[A-Za-z0-9 -]*$/, "Only alphabets, numbers, spaces and hyphen (-) are allowed"),

      remarks: Yup.string()
        .trim()
        .nullable()
        .max(100, "Max 100 characters")
        .matches(/^[A-Za-z0-9\s'",._()-]*$/, "Only alphabets, numbers, spaces and ' \" , . - _ ( ) are allowed"),
    }),
  ),
  followup: Yup.object({
    day: Yup.object({
      value: Yup.number()
        .transform((val, originalValue) => {
          // "" -> null so nullable works
          if (originalValue === "" || originalValue === null || originalValue === undefined) return null;
          return Number.isNaN(val) ? null : val;
        })
        .nullable()
        .positive("Must be greater than 0"),
      unit: Yup.mixed<"days" | "weeks" | "months">()
        .oneOf(["days", "weeks", "months"])
        .required("Unit is required")
        .optional(),
    }),
    followdate: Yup.date()
      .transform((val, originalValue) => {
        // "" -> null so nullable works
        if (originalValue === "" || originalValue === null || originalValue === undefined) return null;
        return val;
      })
      .nullable()
      .min(startOfToday(), "Past dates not allowed"),
    followremark: Yup.string().nullable(),
  }),
});
