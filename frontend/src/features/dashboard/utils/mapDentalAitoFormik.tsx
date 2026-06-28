const normalize = (value: string) => value.toLowerCase().replace(/[-_]/g, " ").trim();
const safeText = (v: any) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

type AiInvestigations = {
  investigationRequired?: string[];
  bloodTest?: string;
};

type ClinicalFindings = {
  teeth?: Record<string | number, string>;
  attrition?: string[];
  abrasion?: string[];
  erosions?: string[];
  tendernessOnPercussion?: string[];
  molarCanineRelation?: string[];
  mobilityOfTeeth?: string[];
};

//follow up
type Unit = "days" | "weeks" | "months";

const normalizeApiUnit = (u: any): Unit => {
  const v = String(u ?? "").toLowerCase();
  if (v.startsWith("week")) return "weeks";
  if (v.startsWith("month")) return "months";
  return "days";
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

const unitToDays = (value: number, unit: Unit) => {
  if (unit === "days") return value;
  if (unit === "weeks") return value * 7;
  return value * 30;
};

const parsePositiveNumber = (v: any): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
};

export const mapApiFollowUpToFormik = (followUp: any) => {
  const count = parsePositiveNumber(followUp?.count);
  const unit = normalizeApiUnit(followUp?.durationLimit);
  const apiDate = String(followUp?.date ?? "").trim(); // "2026-02-20" or ""

  // if date missing, compute from count+unit
  const computedDate = count !== null ? formatLocalYYYYMMDD(addDaysLocal(startOfToday(), unitToDays(count, unit))) : "";

  return {
    day: {
      value: count !== null ? String(count) : "",
      unit,
    },
    followdate: apiDate || computedDate,
    followremark: followUp?.remarks ?? "",
  };
};

// ---------- helpers ----------
const isNonEmptyObject = (v: any) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0;

const toStringArray = (v: any): string[] => (Array.isArray(v) ? v.map((x) => safeText(x)).filter(Boolean) : []);

const extractNumbersList = (raw: string) =>
  raw
    .split(/,|and|\s+/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => /^\d{2}$/.test(s));

const extractClinicalFindingsFromNotes = (notes = "") => {
  const lines = notes
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-•]+/, "").trim())
    .filter(Boolean);

  const teeth: Record<number, string> = {};
  const attrition: string[] = [];
  const abrasion: string[] = [];
  const erosions: string[] = [];
  const tendernessOnPercussion: string[] = [];

  const setTeethStatus = (nums: string[], code: string) => {
    nums.map(Number).forEach((n) => (teeth[n] = code));
  };

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes("missing")) {
      setTeethStatus(extractNumbersList(lower), "M");
      continue;
    }
    if (lower.includes("decayed") || lower.includes("caries")) {
      setTeethStatus(extractNumbersList(lower), "D");
      continue;
    }
    if (lower.includes("filled") || lower.includes("restoration")) {
      setTeethStatus(extractNumbersList(lower), "F");
      continue;
    }

    if (lower.startsWith("attrition")) {
      attrition.push(...extractNumbersList(lower));
      continue;
    }
    if (lower.startsWith("abrasion")) {
      abrasion.push(...extractNumbersList(lower));
      continue;
    }
    if (lower.startsWith("erosion")) {
      erosions.push(...extractNumbersList(lower));
      continue;
    }
    if (lower.includes("tenderness") && lower.includes("percussion")) {
      tendernessOnPercussion.push(...extractNumbersList(lower));
      continue;
    }
  }

  return {
    teeth,
    attrition,
    abrasion,
    erosions,
    tendernessOnPercussion,
    molarCanineRelation: [] as string[],
    mobilityOfTeeth: [] as string[],
  } satisfies Required<ClinicalFindings>;
};

const splitUpperLowerTeeth = (teeth: Record<number, string>) => {
  const upperTeeth: Record<number, string> = {};
  const lowerTeeth: Record<number, string> = {};
  const upperChildrenTeeth: Record<number, string> = {};
  const lowerChildrenTeeth: Record<number, string> = {};

  Object.entries(teeth).forEach(([tooth, value]) => {
    const num = Number(tooth);

    if ((num >= 11 && num <= 18) || (num >= 21 && num <= 28)) upperTeeth[num] = value;
    else if ((num >= 31 && num <= 38) || (num >= 41 && num <= 48)) lowerTeeth[num] = value;
    else if ((num >= 51 && num <= 55) || (num >= 61 && num <= 65)) upperChildrenTeeth[num] = value;
    else if ((num >= 71 && num <= 75) || (num >= 81 && num <= 85)) lowerChildrenTeeth[num] = value;
  });

  return { upperTeeth, lowerTeeth, upperChildrenTeeth, lowerChildrenTeeth };
};

const mapInvestigations = (data: AiInvestigations = {}) => {
  const list = (data.investigationRequired ?? []).map(normalize);
  const has = (keywords: string[]) => list.some((item) => keywords.some((k) => item.includes(normalize(k))));

  return {
    xray: has(["xray", "x ray", "x-ray", "rgv", "rvg"]),
    ctScan: has(["ct", "ct scan", "cbct"]),
    urine: has(["Lateral Cephalogram", "Lateral", "lateral cephalogram"]),
    bloodTests: has(["blood"]) || Boolean(data.bloodTest),
    opg: has(["opg"]),
    iopa: has(["iopa"]),
  };
};

const mapMedication = (meds: any) => {
  if (!Array.isArray(meds) || meds.length === 0) {
    return [{ medicineName: "", dosage: "", frequency: "", timing: "", duration: "", quantity: "", remarks: "" }];
  }

  return meds.map((m: any) => ({
    medicineName: safeText(m?.medicineName),
    dosage: safeText(m?.dosage),
    frequency: safeText(m?.frequency),
    timing: safeText(m?.timing),
    duration: safeText(m?.duration),
    quantity: safeText(m?.quantity),
    remarks: safeText(m?.remarks),
  }));
};

const toISODate = (date: string) => {
  const [dd, mm, yyyy] = date.split("-");
  return `${yyyy}-${mm}-${dd}`;
};

// "investigationsAndDiagnosis": {
//     "bloodTest": "",
//     "investigationRequired": ["RVG", "CBCD", "Lateral cephalogram"],
//     "results": "",
//     "finalDiagnosis": "",
//     "treatmentPlan": "Come to clinic regularly"
//   },
// ---------- the FIXED mapper ----------
export const mapDentalAiToFormik = (ai: any) => {
  if (!ai) return null;
  const fu = mapApiFollowUpToFormik(ai?.followUp);
  const notes = safeText(ai.intraOralExamination?.notes);

  const extracted = extractClinicalFindingsFromNotes(notes);

  // normalize clinicalFindings keys (attrition/abrasion/erosions...) and fallback to extracted if empty
  const cf: ClinicalFindings = ai.clinicalFindings ?? {};

  const teethFromAi = cf?.teeth ?? {};
  const teethToUse = isNonEmptyObject(teethFromAi) ? teethFromAi : extracted.teeth; // if {} use extracted

  const teethNumMap: Record<number, string> = Object.entries(teethToUse).reduce(
    (acc, [k, v]) => {
      const n = Number(k);
      if (!Number.isNaN(n) && v) acc[n] = String(v);
      return acc;
    },
    {} as Record<number, string>,
  );

  const { upperTeeth, lowerTeeth, upperChildrenTeeth, lowerChildrenTeeth } = splitUpperLowerTeeth(teethNumMap);

  const attritionArr = toStringArray(cf?.attrition);
  const abrasionArr = toStringArray(cf?.abrasion);
  const erosionsArr = toStringArray(cf?.erosions);
  const topArr = toStringArray(cf?.tendernessOnPercussion);

  return {
    chiefComplaints: safeText(ai.chiefComplaints),
    pastmedicalhistory: safeText(ai.pastMedicalHistory),
    pastdentalhistory: safeText(ai.pastDentalHistory),
    extraoralExamination: safeText(ai.extraOralExamination?.notes || ai.extraOralExamination?.findings),

    oralHygiene: safeText(ai.intraOralExamination?.oralHygiene).toLowerCase(),
    gingivalHealth: safeText(ai.intraOralExamination?.gingivalHealth).toLowerCase(),
    cariesStatus: safeText(ai.intraOralExamination?.cariesStatus).toLowerCase(),
    clinicalNotes: notes,

    upperTeeth,
    lowerTeeth,
    upperChildrenTeeth,
    lowerChildrenTeeth,

    // use cf arrays if present, else use extracted arrays (and if both missing => empty)
    attrition: (attritionArr.length ? attritionArr : extracted.attrition).join(", "),
    abrasion: (abrasionArr.length ? abrasionArr : extracted.abrasion).join(", "),
    erosions: (erosionsArr.length ? erosionsArr : extracted.erosions).join(", "),
    tendernessOnPercussion: (topArr.length ? topArr : extracted.tendernessOnPercussion).join(", "),

    molarCanineRelation: toStringArray(cf?.molarCanineRelation).join(", "),
    mobilityOfTeeth: toStringArray(cf?.mobilityOfTeeth).join(", "),

    diagnosis: safeText(ai.investigationsAndDiagnosis?.finalDiagnosis),
    treatmentPlan: safeText(ai.investigationsAndDiagnosis?.treatmentPlan),
    investigations: mapInvestigations(ai.investigationsAndDiagnosis),
    otherinvestigations: safeText(ai?.otherinvestigations),
    investigationRemarks: safeText(ai.investigationsAndDiagnosis?.results),

    medication: mapMedication(ai.medication),

    followup: fu,
  };
};
