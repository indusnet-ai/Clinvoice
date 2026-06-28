export const mapCaseSheetToFormValues = (casesheet: any) => {
  if (!casesheet) return null;

  return {
    // VITALS
    temperature: casesheet.vitals?.temperature ?? "",
    pulse: casesheet.vitals?.pulse ?? "",
    bloodPressure: casesheet.vitals?.bloodPressure ?? "",
    weight: casesheet.vitals?.weight ?? "",
    height: casesheet.vitals?.height ?? "",
    spo2: casesheet.vitals?.spo2 ?? "",

    // CHIEF COMPLAINTS
    symptoms: casesheet.chiefComplaints?.symptoms ?? "",
    // duration: {
    //   value: casesheet.chiefComplaints?.duration?.value ?? "",
    //   unit: casesheet.chiefComplaints?.duration?.unit ?? "days",
    // },
    duration: casesheet.chiefComplaints?.duration ?? "",
    remarks: casesheet.chiefComplaints?.remarks ?? "",
    pastmedical: casesheet.chiefComplaints?.pastMedicalHistory ?? "",

    // INVESTIGATIONS
    investigations:
      casesheet.investigations?.length > 0
        ? casesheet.investigations.map((i: any) => ({
            testCat: i.testCat ?? "",
            subCat: i.subCat ?? "",
            advisedRemark: i.advisedRemark ?? "",
          }))
        : [
            {
              testCat: "",
              subCat: "",
              advisedRemark: "",
            },
          ],

    // DIAGNOSIS
    diagnosis: casesheet.diagnosis ?? "",

    // MEDICATION
    medication:
      casesheet.medication?.length > 0
        ? casesheet.medication.map((m: any) => ({
            medicineName: m.medicineName ?? "",
            dosage: m.dosage ?? "",
            frequency: m.frequency ?? "",
            timing: m.timing ?? "",
            duration: m?.duration ?? "",
            quantity: m.quantity ?? "",
            remarks: m.remarks ?? "",
          }))
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

    // DIET
    dietPlan: casesheet.dietPlan ?? "",

    // FOLLOW UP
    followup: {
      day: {
        value: casesheet?.followUp?.day?.value ?? "",
        unit: casesheet?.followUp?.day?.unit ?? "days",
      },
      followdate: casesheet.followUp?.followdate ?? "",
      followremark: casesheet.followUp?.followremark ?? "",
    },
  };
};
