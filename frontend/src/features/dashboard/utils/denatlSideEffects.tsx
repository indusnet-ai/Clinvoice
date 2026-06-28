import { useEffect } from "react";
import { buildDentalCaseSheetPayload } from "./buildDentalPayload";
import { useFormikContext } from "formik";

const calculateQuantity = (frequency: string, duration: string) => {
  if (!frequency || !duration) return "";

  // frequency count
  const freqCount = frequency
    .split("-")
    .map(Number)
    .reduce((sum, val) => sum + val, 0);

  // duration extract number
  const match = duration.match(/^([0-9]+)\s?(day|days|week|weeks|month|months)$/i);

  if (!match) return "";

  const durationValue = Number(match[1]);
  const durationUnit = match[2].toLowerCase();

  let days = durationValue;

  if (durationUnit.includes("week")) days = durationValue * 7;
  if (durationUnit.includes("month")) days = durationValue * 30;

  return String(freqCount * days);
};

export const DentalSideEffects = ({
  isCompletedOpd,
  seedVersion,
  getResolved,
  opd_id,
  userId,
  hospitalId,
  block,
  createdCaseSheetIdRef,
  createInFlightRef,
  saveTimerRef,
  lastSavedHashRef,
  hasEndedRef,
  blockedOnceRef,
  seededRef,
  postOpdCaseSheet,
  patchOpdCaseSheet,
}: any) => {
  const { values, dirty, setFieldValue } = useFormikContext<any>();

  const hasAnyMeaningfulValue = (values: any) => {
    // Basic text fields
    if (
      values.chiefComplaints ||
      values.pastdentalhistory ||
      values.pastmedicalhistory ||
      values.complaintType ||
      values.extraoralExamination ||
      values.oralHygiene ||
      values.gingivalHealth ||
      values.cariesStatus ||
      values.clinicalNotes ||
      values.attrition ||
      values.abrasion ||
      values.erosions ||
      values.tendernessOnPercussion ||
      values.molarCanineRelation ||
      values.mobilityOfTeeth ||
      values.investigationRemarks ||
      values.diagnosis ||
      values.treatmentPlan
    ) {
      return true;
    }

    // Teeth maps (upper/lower/adult/children)
    if (
      (values.upperTeeth && Object.keys(values.upperTeeth).length > 0) ||
      (values.lowerTeeth && Object.keys(values.lowerTeeth).length > 0) ||
      (values.upperChildrenTeeth && Object.keys(values.upperChildrenTeeth).length > 0) ||
      (values.lowerChildrenTeeth && Object.keys(values.lowerChildrenTeeth).length > 0)
    ) {
      return true;
    }

    // Investigations (boolean object)
    if (values.investigations && Object.values(values.investigations).some((val: any) => val === true)) {
      return true;
    }

    // Medication array
    if (
      Array.isArray(values.medication) &&
      values.medication.some(
        (m: any) => m.medicineName || m.dosage || m.frequency || m.timing || m.duration || m.quantity || m.remarks,
      )
    ) {
      return true;
    }

    // Follow-up
    if (values.followup?.day?.value || values.followup?.followdate || values.followup?.followremark) {
      return true;
    }

    return false;
  };
  // quantity calc
  useEffect(() => {
    values.medication?.forEach((med: any, index: number) => {
      const qty = calculateQuantity(med.frequency, med.duration);
      const nextQty = qty || "";

      if ((med.quantity || "") !== nextQty) {
        setFieldValue(`medication.${index}.quantity`, nextQty, false);
      }
    });
  }, [setFieldValue, values.medication?.map((m: any) => `${m.frequency}|${m.duration}`).join("||")]);

  // navigation guard
  useEffect(() => {
    if (isCompletedOpd) return;
    if (hasEndedRef.current) return;

    if (dirty && !blockedOnceRef.current) {
      blockedOnceRef.current = true;
      block({
        title: "Are you sure you want to leave?",
        message: "If you leave without ending the consultation, data may be lost.",
        confirmText: "Stop & Leave",
        cancelText: "Continue Consultation",
        reason: "dental-form",
      });
    }
  }, [dirty, isCompletedOpd, block]);

  // seed save (runs once)
  useEffect(() => {
    if (isCompletedOpd) return;
    if (!seedVersion) return;
    if (!getResolved) return;
    if (seededRef.current) return;

    // IMPORTANT: seed only if there is real data
    if (!hasAnyMeaningfulValue(values)) return;

    seededRef.current = true;

    (async () => {
      try {
        const payload = buildDentalCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id! });
        const hash = JSON.stringify(payload);

        let id = createdCaseSheetIdRef.current;
        if (!id) {
          const res = await postOpdCaseSheet(payload).unwrap();
          id = res?.id ?? res?.data?.id;
          createdCaseSheetIdRef.current = id ?? null;
        }

        if (id) {
          await patchOpdCaseSheet({ id, ...payload }).unwrap();
          lastSavedHashRef.current = hash;
        }
      } catch (e) {
        seededRef.current = false;
        console.warn("Seed save failed", e);
      }
    })();
  }, [seedVersion, getResolved]);

  // autosave debounce
  useEffect(() => {
    if (isCompletedOpd) return;
    if (!dirty) return;
    if (!getResolved) return;
    if (!opd_id) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const payload = buildDentalCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id });
        const hash = JSON.stringify(payload);
        if (hash === lastSavedHashRef.current) return;

        let id = createdCaseSheetIdRef.current;

        if (!id) {
          if (createInFlightRef.current) return;
          createInFlightRef.current = true;
          const res = await postOpdCaseSheet(payload).unwrap();
          id = res?.id ?? res?.data?.id;
          createdCaseSheetIdRef.current = id ?? null;
          createInFlightRef.current = false;
        }

        if (!id) return;

        await patchOpdCaseSheet({ id, ...payload }).unwrap();
        lastSavedHashRef.current = hash;
      } catch (e) {
        createInFlightRef.current = false;
        console.warn("Autosave failed", e);
      }
    }, 2000);

    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
  }, [values, dirty, isCompletedOpd, opd_id, userId, hospitalId, getResolved]);

  return null;
};
