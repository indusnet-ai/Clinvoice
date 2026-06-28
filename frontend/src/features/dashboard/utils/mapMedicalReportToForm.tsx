const EMPTY_INVESTIGATION = {
  testCat: "",
  subCat: "",
  advisedRemark: "",
};

const EMPTY_MEDICATION = {
  medicineName: "",
  dosage: "",
  frequency: "",
  timing: "",
  duration: "",
  quantity: "",
  remarks: "",
};

// const toISODate = (date: string) => {
//   const [dd, mm, yyyy] = date.split("-");
//   return `${yyyy}-${mm}-${dd}`;
// };
const normalizeUnit = (u: any): "days" | "weeks" | "months" => {
  const s = String(u ?? "")
    .trim()
    .toLowerCase();
  if (s === "week" || s === "weeks") return "weeks";
  if (s === "month" || s === "months") return "months";
  return "days";
};

const toISODate = (date: string) => {
  // API: "10-03-2026" => "2026-03-10"
  const [dd, mm, yyyy] = String(date ?? "").split("-");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm}-${dd}`;
};

export const mapMedicalReportToForm = (report: any) => {
  if (!report) return {};

  const clinical = report?.ClinicalNotes || {};

  let investigations: any[] = [];

  if (clinical?.DiagnosisReport) {
    const { TestCategories = [], SubCategory = [], Remarks = [] } = clinical.DiagnosisReport;

    const maxLength = Math.max(TestCategories.length, SubCategory.length, Remarks.length);

    investigations = Array.from({ length: maxLength }, (_, i) => ({
      testCat: TestCategories[i] ?? "",
      subCat: SubCategory[i] ?? "",
      advisedRemark: Remarks[i] ?? "",
    }));
  }
  // OPTIONAL: fallback if someday DiagnosisReport is missing
  else if (report?.labResults?.investigation?.length) {
    investigations = report.labResults.investigation.map((inv: any) => ({
      testCat: inv.name ?? "",
      subCat: inv.observation ?? "",
      advisedRemark: inv.unit ?? "",
    }));
  }
  const toHyphenFrequency = (f: any) => {
    const s = String(f ?? "").trim();
    if (!s) return "";
    // "1 0 1" OR "1-0-1" OR "1/0/1" -> "1-0-1"
    return s
      .split(/[\s/-]+/)
      .filter(Boolean)
      .join("-");
  };
  const medication =
    report?.Prescription?.map((med: any) => ({
      medicineName: med.MedicineName || "",
      dosage: med.Dosage || "",
      frequency: toHyphenFrequency(med.Frequency) || "",
      timing: med.When ?? med.when ?? med.Timing ?? med.timing ?? "",
      duration: `${med.DurationCount ?? ""} ${med.DurationLimit ?? ""}`.trim(),
      quantity: med.Quantity || "",
      remarks: med.Remarks || "",
    })) || [];

  const fu = clinical?.FollowUp || {};

  const countStr = fu?.Count != null ? String(fu.Count).trim() : "";
  const unit = normalizeUnit(fu?.DurationLimit);

  return {
    // -------- VITALS --------
    temperature: report?.Vitals?.Temperature ?? "",
    pulse: report?.Vitals?.Pulse ?? "",
    bloodPressure: report?.Vitals?.BP ?? "",
    weight: report?.Vitals?.Weight ?? "",
    height: report?.Vitals?.Height ?? "",
    spo2: report?.Vitals?.SPO2 ?? "",

    // -------- SYMPTOMS --------
    symptoms: clinical?.ChiefComplaintsBasic?.ComplaintName ?? "",
    duration: clinical?.ChiefComplaintDetails?.Count + " " + clinical?.ChiefComplaintDetails?.DurationLimit || "",
    remarks: clinical?.ChiefComplaintDetails?.Remarks || "",
    // -------- DIAGNOSIS --------
    diagnosis:
      [
        ...(clinical?.DiagnosisReport?.High || []),
        ...(clinical?.DiagnosisReport?.Low || []),
        ...(clinical?.DiagnosisReport?.Remarks || []),
      ]
        .filter(Boolean)
        .join(", ") +
      " " +
      (clinical?.TreatmentAdvice?.Advice || ""),

    // -------- INVESTIGATIONS --------
    investigations: investigations.length ? investigations : [EMPTY_INVESTIGATION],

    // -------- MEDICATION --------
    medication: medication.length ? medication : [EMPTY_MEDICATION],

    // -------- DIET --------
    dietPlan: clinical?.DietPlan?.DietPlan ?? "",

    // -------- FOLLOW UP --------
    // followup: {
    //   day: (clinical?.FollowUp?.Count || "") + " " + (clinical?.FollowUp?.DurationLimit || "") || "",
    //   followremark: clinical?.FollowUp?.Remarks ?? "",
    //   followdate: clinical?.FollowUp?.Date ? toISODate(clinical?.FollowUp?.Date) : "",
    // },
    followup: {
      day: {
        value: countStr, //  "8"
        unit: unit, // "days" | "weeks" | "months"
      },
      followremark: fu?.Remarks ?? "",
      followdate: fu?.Date ? toISODate(fu.Date) : "",
    },

    pastmedical: clinical?.PastTreatmentHistory?.History ?? "",
  };
};
