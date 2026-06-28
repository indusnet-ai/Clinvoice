// export const mapDataToPdf = (hospitalData, patientData, docName, caseSheet) => {
//   const now = new Date();

//   const currentDateTime = new Intl.DateTimeFormat("en-GB", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   })
//     .format(now)
//     .replace(/\//g, "-") // Changes 25/02/2025 to 25-02-2025
//     .replace(",", "") // Removes the comma if it appears
//     .toUpperCase(); // Ensures AM/PM is uppercase
//   const caseData = caseSheet?.casesheet;

//   const caseSheetData = {
//     hospital: {
//       name: hospitalData?.name || "",
//       subtitle: "",
//       address1: hospitalData?.address || "",
//       address2: hospitalData?.district || "",
//       phone: hospitalData?.primary_mobile_no_country_code + " " + hospitalData?.primary_mobile_no || "",
//       email: hospitalData?.email || "",
//       website: hospitalData?.website_url || "",
//       dateTime: currentDateTime || "",
//     },

//     patient: {
//       name: patientData?.patient_name || "",
//       patientId: patientData?.id || "",
//       ageGender: `${patientData?.age || ""} Years | ${patientData?.gender || ""}`,
//       mobile: patientData?.country_code + " " + patientData?.mobile_no || "",
//       email: patientData?.email || "",
//       address: "",
//     },

//     doctorName: docName ? `Dr ${docName}` : "",
//     vitals: {
//       temperature: caseData?.vitals?.temperature || "",
//       pulse: caseData?.vitals?.pulse || "",
//       bp: caseData?.vitals?.bloodPressure || "",
//       respiratoryRate: caseData?.vitals?.rp || "",
//       weight: caseData?.vitals?.weight || "",
//       height: caseData?.vitals?.height || "",
//       spo2: caseData?.vitals?.spo2 || "",
//     },

//     complaints: [
//       {
//         symptom: caseData?.chiefComplaints?.symptoms || "",
//         bodySite: "",
//         duration:
//           (caseData?.chiefComplaints?.duration?.value || "") + " " + (caseData?.chiefComplaints?.duration?.unit || ""),
//         remarks: caseData?.chiefComplaints?.remarks || "",
//       },
//     ],

//     pastHistory: caseData?.chiefComplaints?.pastMedicalHistory || "",

//     diagnosis: caseData?.diadiagnosis || "",
//     medications: caseData?.medication?.map((medi, index) => ({
//       id: index + 1,
//       name: medi?.medicineName || "",
//       brand: medi?.medicineName || "",
//       dosage: medi?.dosage?.value || "",
//       frequency: medi?.frequency?.value || "",
//       timing: medi?.timing?.value + " " + "Food" || "",
//       quantity: medi?.quantity?.value || "",
//       duration: (medi?.duration?.value || "") + " " + (medi?.duration?.unit || ""),
//       remarks: medi?.remarks || "",
//     })) || [
//       {
//         id: "",
//         name: "",
//         brand: " ",
//         dosage: "",
//         frequency: "",
//         timing: " ",
//         quantity: "",
//         duration: "",
//         remarks: "",
//       },
//     ],
//   };
//   return caseSheetData;
// };
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

export const mapDataToPdf = (hospital: any, patient: any, doctorName: string, opdData: any) => {
  const caseSheet = opdData?.casesheet || {};

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
    hospital: {
      name: hospital?.name ?? "",
      address1: hospital?.address ?? "",
      address2: formatAddress2(),
      phone: hospital?.primary_mobile_no_country_code + " " + hospital?.primary_mobile_no || "",
      email: hospital?.email ?? "",
      website: hospital?.website_url ?? "",
      dateTime: opdData?.updated_at,
    },

    doctorName,

    patient: {
      name: patient?.patient_name ?? "",
      patientId: patient?.id ?? "",
      ageGender: `${patient?.age ?? ""} / ${patient?.gender ?? ""}`,
      mobile: patient?.mobile_no ?? "",
      email: patient?.email ?? "",
    },

    // ---------- VITALS ----------
    vitals: {
      temperature: caseSheet?.vitals?.temperature ?? "",
      pulse: caseSheet?.vitals?.pulse ?? "",
      bp: caseSheet?.vitals?.bloodPressure ?? "",
      respiratoryRate: "-", // not in API
      weight: caseSheet?.vitals?.weight ?? "",
      height: caseSheet?.vitals?.height ?? "",
      spo2: caseSheet?.vitals?.spo2 ?? "",
    },

    // ---------- CHIEF COMPLAINTS ----------
    complaints: [
      {
        symptom: capitalizeFirstLetter(caseSheet?.chiefComplaints?.symptoms),
        bodySite: "-", // not provided
        duration: caseSheet?.chiefComplaints?.duration ?? "",
        remarks: capitalizeFirstLetter(caseSheet?.chiefComplaints?.remarks),
      },
    ],

    // ---------- PAST HISTORY ----------
    pastHistory: capitalizeFirstLetter(caseSheet?.chiefComplaints?.pastMedicalHistory),

    // ---------- DIAGNOSIS ----------
    diagnosis: capitalizeFirstLetter(caseSheet?.diagnosis),

    // ---------- INVESTIGATIONS ----------
    investigations:
      caseSheet?.investigations?.map((inv: any) => ({
        testCat: inv.testCat ?? "",
        subCat: inv.subCat ?? "",
        advisedRemark: inv.advisedRemark ?? "",
      })) ?? [],

    // ---------- MEDICATIONS ----------
    medications:
      caseSheet?.medication?.map((med: any, index: number) => ({
        id: index + 1,
        name: med.medicineName ?? "",
        brand: "",
        dosage: med.dosage ?? "",
        frequency: med.frequency ?? "",
        timing: med.timing ?? "",
        quantity: med.quantity ?? "",
        duration: med.duration ?? "",
        remarks: med.remarks ?? "",
      })) ?? [],

    // ---------- DIET ----------
    dietPlan: caseSheet?.dietPlan ?? "",

    // ---------- FOLLOW UP ----------
    followup: {
      day: {
        value: caseSheet?.followUp?.day?.value ?? "",
        unit: caseSheet?.followUp?.day?.unit ?? "",
      },
      followremark: caseSheet?.followUp?.followremark ?? "",
      followdate: caseSheet?.followUp?.followdate ?? "",
    },
  };
};
