export const buildCaseSheetPayload = ({
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
      vitals: {
        temperature: values.temperature || null,
        pulse: values.pulse || null,
        bloodPressure: values.bloodPressure || null,
        weight: values.weight || null,
        height: values.height || null,
        spo2: values.spo2 || null,
      },

      chiefComplaints: {
        symptoms: values.symptoms,
        duration: values.duration,
        remarks: values.remarks,
        pastMedicalHistory: values.pastmedical,
      },

      investigations: values.investigations?.filter((i: any) => i.testCat || i.subCat || i.advisedRemark),

      diagnosis: values.diagnosis,

      // medication: values.medication?.filter((m: any) => m.medicineName),
      medication: (values.medication || [])
        .filter((m: any) => m.medicineName)
        .map((m: any) => ({
          medicineName: m.medicineName ?? "",
          dosage: m.dosage ?? "",
          frequency: m.frequency ?? "",
          timing: m.timing ?? "", // this will carry "after food/photo"
          duration: m.duration ?? "",
          quantity: m.quantity ?? "",
          remarks: m.remarks ?? "",
        })),
      dietPlan: values.dietPlan,

      followUp: followUp,
    },
  };
};
