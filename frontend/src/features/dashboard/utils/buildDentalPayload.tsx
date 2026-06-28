const normalizeDuration = (d: any) => {
  if (!d) return "";
  if (typeof d === "string") return d;
  // common patterns:
  if (typeof d === "object") {
    if ("label" in d) return String(d.label || "");
    if ("value" in d && "unit" in d) return `${d.value} ${d.unit}`.trim();
    if ("value" in d) return String(d.value || "");
  }
  return String(d);
};
const normalizeDate = (d: any) => {
  if (!d) return "";
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString();
  // if it's like { value, label }
  if (typeof d === "object" && "value" in d) return String((d as any).value || "");
  return String(d);
};

const normalizeFollowUp = (followup: any) => {
  const dayValue = followup?.day?.value === "" || followup?.day?.value == null ? "" : String(followup.day.value);

  return {
    day: {
      value: dayValue,
      unit: followup?.day?.unit || "days",
    },
    followdate: normalizeDate(followup?.followdate),
    followremark: followup?.followremark || "",
  };
};


const hasMedMeaning = (m: any) =>
  m.medicineName || m.dosage || m.frequency || m.timing || m.duration || m.quantity || m.remarks;

const mapInvestigationKeyToLabel = (key: string) => {
  switch (key) {
    case "xray":
      return "RVG";
    case "ctScan":
      return "CBCT";
    case "urine":
      return "Lateral Cephalogram";
    case "iopa":
      return "IOPA";
    case "opg":
      return "OPG";
    case "bloodTests":
      return "Blood test";
    default:
      return key;
  }
};

export const buildDentalCaseSheetPayload = ({
  values,
  userId,
  hospitalId,
  opdId,
}: {
  values: any;
  userId: number;
  hospitalId: number;
  opdId: number;
}) => {
  const followUpDayValue = values.followup?.day?.value || "";
  const followUpDayUnit = values.followup?.day?.unit || "days";

  const followUp = {
    day: {
      value: followUpDayValue === "" ? null : followUpDayValue, // or Number(...) if API expects number
      unit: followUpDayUnit,
    },
    followdate: values.followup?.followdate || null,
    followremark: values.followup?.followremark || "",
  };
  return {
    user_id: userId,
    hospital_id: hospitalId,
    opd_id: opdId,

    casesheet: {
      chiefComplaints: values.chiefComplaints,
      pastmedicalhistory: values.pastmedicalhistory,
      pastdentalhistory: values.pastdentalhistory,
      complaintType: values.complaintType,
      extraoralExamination: values.extraoralExamination,
      clinicalFindings: {
        teeth: {
          upperAdult: values.upperTeeth,
          lowerAdult: values.lowerTeeth,
          upperChildren: values.upperChildrenTeeth,
          lowerChildren: values.lowerChildrenTeeth,
        },

        attrition: values.attrition,
        abrasion: values.abrasion,
        erosions: values.erosions,
        tendernessOnPercussion: values.tendernessOnPercussion,
        molarCanineRelation: values.molarCanineRelation,
        mobilityOfTeeth: values.mobilityOfTeeth,
      },

      oralExamination: {
        oralHygiene: values.oralHygiene,
        gingivalHealth: values.gingivalHealth,
        cariesStatus: values.cariesStatus,
        clinicalNotes: values.clinicalNotes,
      },

      investigations: Object.entries(values.investigations)
        .filter(([_, checked]) => checked)
        .map(([key]) => mapInvestigationKeyToLabel(String(key))),

      investigationRemarks: values.investigationRemarks,
      otherinvestigations: values.otherinvestigations,
      diagnosis: values.diagnosis,
      treatmentPlan: values.treatmentPlan,

      medication: (values.medication || []).filter(hasMedMeaning).map((m: any) => ({
        medicineName: (m.medicineName || "").trim(),
        dosage: (m.dosage || "").trim(),
        frequency: (m.frequency || "").trim(),
        timing: (m.timing || "").trim(),
        duration: normalizeDuration(m.duration),
        quantity: (m.quantity || "").trim(),
        remarks: (m.remarks || "").trim(),
      })),

      followUp: followUp,
    },
  };
};
