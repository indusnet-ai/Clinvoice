import { formatChiefComplaints } from "@/features/visithistory/utils/mapDataToDentalPdf";

const mapInvestigations = (list: string[] = []) => {
  const has = (label: string, legacyKey: string) => list.includes(label) || list.includes(legacyKey);

  return {
    // support both new labels and old backend keys
    xray: has("RVG", "xray"),
    ctScan: has("CBCT", "ctScan"),
    bloodTests: has("Blood test", "bloodTests") || has("Blood Tests", "bloodTests"),
    urine: has("Lateral Cephalogram", "urine"),
    lipidProfile: has("Lipid Profile", "lipidProfile"),
    opg: has("OPG", "opg"),
    iopa: has("IOPA", "iopa"),
  };
};

export const mapDentalApiToFormik = (apiData: any) => {
  const cs = apiData?.casesheet || {};
  //  "pastMedicalHistory": "Cough and cold",
  // "pastDentalHistory": "Lot of tooth pain",
  // "e
  return {
    chiefComplaints: formatChiefComplaints(cs?.chiefComplaints) || "",
    pastdentalhistory: cs?.pastdentalhistory || "",
    pastmedicalhistory: cs?.pastmedicalhistory || "",
    complaintType: cs?.complaintType || "",
    extraoralExamination: cs?.extraoralExamination || "",
    oralHygiene: cs?.oralExamination?.oralHygiene || "",
    gingivalHealth: cs?.oralExamination?.gingivalHealth || "",
    cariesStatus: cs?.oralExamination?.cariesStatus || "",
    clinicalNotes: cs?.oralExamination?.clinicalNotes || "",

    upperTeeth: cs?.clinicalFindings?.teeth?.upperAdult || {},
    lowerTeeth: cs?.clinicalFindings?.teeth?.lowerAdult || {},
    upperChildrenTeeth: cs?.clinicalFindings?.teeth?.upperChildren || {},
    lowerChildrenTeeth: cs?.clinicalFindings?.teeth?.lowerChildren || {},

    attrition: cs?.clinicalFindings?.attrition || "",
    abrasion: cs?.clinicalFindings?.abrasion || "",
    erosions: cs?.clinicalFindings?.erosions || "",
    tendernessOnPercussion: cs?.clinicalFindings?.tendernessOnPercussion || "",
    molarCanineRelation: cs?.clinicalFindings?.molarCanineRelation || "",
    mobilityOfTeeth: cs?.clinicalFindings?.mobilityOfTeeth || "",

    investigations: mapInvestigations(cs?.investigations) || {
      xray: false,
      ctScan: false,
      bloodTests: false,
      urine: false,
      lipidProfile: false,
      opg: false,
      iopa: false,
    },
    otherinvestigations: cs?.otherinvestigations,
    investigationRemarks: cs?.investigationRemarks || "",

    diagnosis: cs?.diagnosis || "",
    treatmentPlan: cs?.treatmentPlan || "",

    medication:
      cs?.medication?.length > 0
        ? cs.medication
        : [
            {
              medicineName: "",
              dosage: "",
              frequency: "",
              timing: "",
              duration: "",
              quantity: "",
              remarks: "",
            },
          ],

    followup: cs?.followUp || {
      day: { value: "", unit: "days" },
      followdate: "",
      followremark: "",
    },
  };
};

export const defaultInitialValues = {
  chiefComplaints: "",
  complaintType: "",

  oralHygiene: "",
  gingivalHealth: "",
  cariesStatus: "",
  clinicalNotes: "",

  upperTeeth: {},
  lowerTeeth: {},
  upperChildrenTeeth: {},
  lowerChildrenTeeth: {},

  attrition: "",
  abrasion: "",
  erosions: "",
  tendernessOnPercussion: "",
  molarCanineRelation: "",
  mobilityOfTeeth: "",

  investigations: {
    xray: false,
    ctScan: false,
    bloodTests: false,
    urine: false,
    lipidProfile: false,
    opg: false,
    iopa: false,
  },

  investigationRemarks: "",

  diagnosis: "",
  treatmentPlan: "",

  medication: [
    {
      medicineName: "",
      dosage: "",
      frequency: "",
      timing: "",
      duration: "",
      quantity: "",
      remarks: "",
    },
  ],

  followup: {
    day: {
      value: "",
      unit: "days",
    },
    followdate: "",
    followremark: "",
  },
};
