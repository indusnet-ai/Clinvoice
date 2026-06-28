import { formatDateForDisplay } from "@/utils";

// Utility function to capitalize first letter of a string
const capitalizeFirstLetter = (text: string | undefined | null): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Utility function to format location names (replace underscores with spaces and capitalize each word)
const formatLocationName = (text: string | undefined | null): string => {
  if (!text) return "";
  return text.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatChiefComplaints = (data: any) => {
  if (!data) return "";

  // If API sends string
  if (typeof data === "string") return capitalizeFirstLetter(data);

  // If API sends object
  const { symptoms, duration, remarks, pastMedicalHistory } = data;

  return [
    symptoms && `Symptoms: ${capitalizeFirstLetter(symptoms)}`,
    duration && `Duration: ${duration}`,
    remarks && `Remarks: ${capitalizeFirstLetter(remarks)}`,
    pastMedicalHistory && `Past Medical History: ${capitalizeFirstLetter(pastMedicalHistory)}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export const mapDataToDentalPdf = (hospital: any, patient: any, doctorName: string, opdData: any) => {
  const caseSheet = opdData?.casesheet ?? {};

  // Format address2 with proper capitalization and no underscores
  const formatAddress2 = () => {
    const parts = [
      formatLocationName(hospital?.district),
      formatLocationName(hospital?.state),
      formatLocationName(hospital?.country),
      hospital?.pincode ?? "",
    ].filter((part) => part); // Remove empty parts

    return parts.join(", ");
  };

  return {
    // ---------- HOSPITAL ----------
    hospital: {
      name: hospital?.name ?? "",
      address1: hospital?.address ?? "",
      address2: formatAddress2(),
      phone: hospital?.primary_mobile_no_country_code
        ? `${hospital.primary_mobile_no_country_code} ${hospital.primary_mobile_no ?? ""}`
        : "",
      email: hospital?.email ?? "",
      website: hospital?.website_url ?? "",
      dateTime: opdData?.updated_at,
    },

    // ---------- DOCTOR ----------
    doctorName: doctorName ?? "",

    // ---------- PATIENT ----------
    patient: {
      name: patient?.patient_name ?? "",
      patientId: patient?.id ?? "",
      ageGender: `${patient?.age ?? ""} / ${patient?.gender ?? ""}`,
      mobile: patient?.mobile_no ?? "",
      email: patient?.email ?? "",
    },

    // ---------- CASE SHEET ----------
    chiefComplaints: formatChiefComplaints(caseSheet?.chiefComplaints) ?? "",
    pastmedicalhistory: caseSheet?.pastmedicalhistory ?? "",
    pastdentalhistory: caseSheet?.pastdentalhistory ?? "",
    extraoralExamination: capitalizeFirstLetter(caseSheet?.extraoralExamination),

    // ---------- CLINICAL FINDINGS ----------
    clinicalFindings: {
      teeth: {
        upperAdult: caseSheet?.clinicalFindings?.teeth?.upperAdult ?? {},
        lowerAdult: caseSheet?.clinicalFindings?.teeth?.lowerAdult ?? {},
        upperChildren: caseSheet?.clinicalFindings?.teeth?.upperChildren ?? {},
        lowerChildren: caseSheet?.clinicalFindings?.teeth?.lowerChildren ?? {},
      },
      attrition: capitalizeFirstLetter(caseSheet?.clinicalFindings?.attrition),
      abrasion: capitalizeFirstLetter(caseSheet?.clinicalFindings?.abrasion),
      erosions: capitalizeFirstLetter(caseSheet?.clinicalFindings?.erosions),
      tendernessOnPercussion: capitalizeFirstLetter(caseSheet?.clinicalFindings?.tendernessOnPercussion),
      mobilityOfTeeth: capitalizeFirstLetter(caseSheet?.clinicalFindings?.mobilityOfTeeth),
      molarCanineRelation: capitalizeFirstLetter(caseSheet?.clinicalFindings?.molarCanineRelation),
    },

    // ---------- ORAL EXAMINATION ----------
    oralExamination: {
      oralHygiene: capitalizeFirstLetter(caseSheet?.oralExamination?.oralHygiene),
      gingivalHealth: capitalizeFirstLetter(caseSheet?.oralExamination?.gingivalHealth),
      cariesStatus: capitalizeFirstLetter(caseSheet?.oralExamination?.cariesStatus),
      clinicalNotes: capitalizeFirstLetter(caseSheet?.oralExamination?.clinicalNotes),
    },

    // ---------- INVESTIGATIONS ----------
    investigations: caseSheet?.investigations ?? [],
    investigationRemarks: capitalizeFirstLetter(caseSheet?.investigationRemarks),
    otherinvestigations: caseSheet?.otherinvestigations ?? "",

    // ---------- DIAGNOSIS & PLAN ----------
    diagnosis: capitalizeFirstLetter(caseSheet?.diagnosis),
    treatmentPlan: capitalizeFirstLetter(caseSheet?.treatmentPlan),

    // ---------- MEDICATION ----------
    medication: (caseSheet?.medication ?? []).map((med: any, index: number) => ({
      id: index + 1,
      medicineName: med?.medicineName ?? "",
      dosage: med?.dosage ?? "",
      frequency: med?.frequency ?? "",
      timing: med?.timing ?? "",
      duration: med?.duration ?? "",
      quantity: med?.quantity ?? "",
      remarks: med?.remarks ?? "",
    })),

    // ---------- FOLLOW UP ----------
    followUp: {
      followdate: formatDateForDisplay(caseSheet?.followUp?.followdate) || "",
      followremark: caseSheet?.followUp?.followremark || "",
      day: {
        value: caseSheet?.followUp?.day?.value || "",
        unit: caseSheet?.followUp?.day?.unit || "days",
      },
    },
  };
};
