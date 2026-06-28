import { CallIcon, DeleteIcon, DropDownIcon } from "@/assets/icons";
import React, { useEffect, useRef, useState } from "react";
import { Formik, Form, FieldArray, useFormikContext } from "formik";
import {
  FormCheckboxList,
  FormCustomSelect,
  FormDateInput,
  FormInput,
  FormInputWithUnitSelect,
  FormSelectWithUnit,
  FormUnitInput,
  SingleSelectCheckbox,
  TextArea,
} from "@/atoms";
import { Options, UnitOptions, FrequencyOptions, FoodOptions, TabletOptions } from "@/data/dropdown.js";
import { FollowUpSync } from "./FollowUpSync";
import * as Yup from "yup";
import { buildDentalCaseSheetPayload, mapDentalAiToFormik } from "../utils";
import { ToothInput } from "./ToothInput";
import { useAppSelector } from "@/app/hook";
import { useNavigate, useSearchParams } from "react-router";
import { defaultInitialValues, mapDentalApiToFormik } from "../utils/mapDentalApiToFormik";
import {
  useGetOpdCaseSheetQuery,
  usePatchOpdCaseSheetMutation,
  usePostOpdCaseSheetMutation,
} from "../services/ConsultationApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { showToast } from "@/utils";
import { usePatchOpdStatusMutation } from "../services/DashbaordApi";
import { ClearFollowUpButton } from "./ClearFollowUp";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";
import HeaderWithTextArea from "./section/HeaderWithTextArea";
import Medication from "./section/Medication";
import FollowUp from "./section/FollowUp";
import { ClinicalFindingsSection } from "./section/ClinicalFindingSection";
import { InvestigationCard } from "./section/InvestigationCard";
import { useLanguage } from "@/language/context/LanguageContext";

// Validation Schema
const dentalValidationSchema = Yup.object({
  chiefComplaints: Yup.string(),
  oralHygiene: Yup.string(),
  gingivalHealth: Yup.string(),
  cariesStatus: Yup.string(),
  clinicalNotes: Yup.string(),
  diagnosis: Yup.string(),
  treatmentPlan: Yup.string(),
});

interface DentalFormProps {
  data: any;
  isCompletedOpd?: boolean;
  seedVersion?: number;
  hardBlock?: boolean;
  recordState?: string;
}

const DentalForm: React.FC<DentalFormProps> = ({ data, isCompletedOpd, seedVersion, hardBlock, recordState }) => {
  const userId = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const hospitalId = useAppSelector((state) => state.auth.hospital_id) ?? Number(localStorage.getItem("hospital_id"));
  const [searchParams] = useSearchParams();
  const opdIdParam = searchParams.get("opd_id");
  const patientIdParam = searchParams.get("patient_id");
  const opd_id = opdIdParam ? Number(opdIdParam) : undefined;
  const patient_id = patientIdParam ? Number(patientIdParam) : undefined;
  const navigate = useNavigate();
  const { t } = useLanguage();

  //for api call on every field enter CRCG
  //for api call in every value enter ==> CRCG
  const createdCaseSheetIdRef = useRef<number | null>(null);
  const createInFlightRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHashRef = useRef<string>("");
  const hasEndedRef = useRef(false);

  const seededRef = useRef(false);
  const blockedOnceRef = useRef(false);

  const [extendChief, setExtendChief] = useState(true);
  const [extendClinical, setExtendClinical] = useState(true);
  const [extendDental, setExtendDental] = useState(true);
  const [extendInvest, setExtendInvest] = useState(true);
  const [extendMedication, setExtendMedication] = useState(true);
  const [extendFollow, setExtendFollow] = useState(true);
  const [formInitialValues, setFormInitialValues] = useState(defaultInitialValues);
  const {
    data: opdCaseSheetData,
    isFetching,
    isUninitialized,
  } = useGetOpdCaseSheetQuery(opd_id ? { opd_id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const [postOpdCaseSheet, { isLoading }] = usePostOpdCaseSheetMutation();
  const [patchOpdCaseSheet] = usePatchOpdCaseSheetMutation();
  const [patchOpdStatus] = usePatchOpdStatusMutation();
  //for popup - prevent data loss
  const { block, unblock } = useNavigationGuard();
  //clear the form when the opd changes
  // --- server state ---
  // const caseSheetQuery = useGetOpdCaseSheetQuery(opd_id ? { opd_id } : skipToken, {
  //   refetchOnMountOrArgChange: true,
  // });

  const validationSchema = Yup.object().shape({
    chiefComplaints: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    pastmedicalhistory: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    pastdentalhistory: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    extraoralExamination: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    clinicalNotes: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    investigationRemarks: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    diagnosis: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    treatmentPlan: Yup.string()
      .trim()
      .nullable()
      .min(3, "Minimum 3 characters required")
      .max(1000, "Maximum 1000 characters allowed"),

    otherinvestigations: Yup.string().trim().nullable().max(500, "Maximum 500 characters allowed"),

    oralHygiene: Yup.string().nullable(),
    gingivalHealth: Yup.string().nullable(),
    cariesStatus: Yup.string().nullable(),
    attrition: Yup.string()
      .trim()
      .nullable()
      .test("attrition-format", "Attrition must contain only numbers separated by commas", (value) => {
        if (!value || value.trim() === "") return true; // allow empty / null
        return /^(\d+)(\s*,\s*\d+)*$/.test(value);
      }),
    abrasion: Yup.string()
      .trim()
      .nullable()
      .test("abrasion-format", "abrasion must contain only numbers separated by commas", (value) => {
        if (!value || value.trim() === "") return true; // allow empty / null
        return /^(\d+)(\s*,\s*\d+)*$/.test(value);
      }),
    erosions: Yup.string()
      .trim()
      .nullable()
      .test("erosions-format", "erosions must contain only numbers separated by commas", (value) => {
        if (!value || value.trim() === "") return true; // allow empty / null
        return /^(\d+)(\s*,\s*\d+)*$/.test(value);
      }),
    tendernessOnPercussion: Yup.string()
      .trim()
      .nullable()
      .test(
        "tendernessOnPercussion-format",
        "tenderness on percussion must contain only numbers separated by commas",
        (value) => {
          if (!value || value.trim() === "") return true; // allow empty / null
          return /^(\d+)(\s*,\s*\d+)*$/.test(value);
        },
      ),
    molarCanineRelation: Yup.string()
      .trim()
      .nullable()
      .test("molar-canine-format", "Only alphabets, numbers, spaces and ( ) , . - ' ; : are allowed", (value) => {
        if (!value || value.trim() === "") return true; // allow empty
        return /^[A-Za-z0-9 ()',.\-;:|]+$/.test(value);
      }),

    mobilityOfTeeth: Yup.string()
      .trim()
      .nullable()
      .test("mobility-format", "Only alphabets, numbers, spaces and ( ) , . - ' ; : are allowed", (value) => {
        if (!value || value.trim() === "") return true; // allow empty
        return /^[A-Za-z0-9 ()',.\-;:|]+$/.test(value);
      }),

    medication: Yup.array().of(
      Yup.object().shape({
        medicineName: Yup.string()
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
          .matches(/^[A-Za-z0-9 ,\ -]*$/, "Only alphabets, numbers, spaces and hyphen (-) are allowed"),

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
  });

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

  // For medication section auto-resize
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    if (!extendMedication) {
      setHeight(0);
      return;
    }

    const observer = new ResizeObserver(() => {
      setHeight(ref.current!?.scrollHeight);
    });

    observer.observe(ref.current);
    setHeight(ref.current.scrollHeight);

    return () => observer.disconnect();
  }, [extendMedication]);

  const existingCaseSheetId: number | null = opdCaseSheetData?.data?.id ?? null;

  const getResolved = !isUninitialized && !isFetching;
  useEffect(() => {
    blockedOnceRef.current = false;
    hasEndedRef.current = false;
    seededRef.current = false;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    createInFlightRef.current = false;
    lastSavedHashRef.current = "";
    if (!hardBlock) unblock();
  }, [opd_id]);

  // When GET returns id, lock it (means: PATCH only from now on)
  useEffect(() => {
    if (!getResolved) return;

    if (existingCaseSheetId) {
      createdCaseSheetIdRef.current = existingCaseSheetId;
      // reset hash so first PATCH will happen if user edits
      lastSavedHashRef.current = "";
    } else {
      // no server casesheet exists yet, keep null and allow POST once later
      createdCaseSheetIdRef.current = null;
      lastSavedHashRef.current = "";
    }
  }, [existingCaseSheetId, getResolved]);

  // Tooth numbers for upper and lower jaw
  const upperTeethRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperTeethLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeethRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerTeethLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const getInitialValues: any = () => {
    if (data?.id) {
      return mapDentalApiToFormik(data);
    }
    if (data) {
      return mapDentalAiToFormik(data);
    }
    return {
      chiefComplaints: "",
      pastdentalhistory: "",
      pastmedicalhistory: "",
      complaintType: "",
      extraoralExamination: "",
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
      otherinvestigations: "",

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
  };
  //for disable and no evnets
  const iswaitRecord = recordState === "recording" || recordState === "processing";
  const isOpd_disable = isCompletedOpd || !opd_id || iswaitRecord;

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={getInitialValues()}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          try {
            // optional final save (ONLY if draft exists)
            if (createdCaseSheetIdRef.current && !createInFlightRef.current) {
              const payload = buildDentalCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id });
              const hash = JSON.stringify(payload);
              if (hash !== lastSavedHashRef.current) {
                await patchOpdCaseSheet({ id: createdCaseSheetIdRef.current, ...payload }).unwrap();
                lastSavedHashRef.current = hash;
              }
            }
            await patchOpdStatus({ opd_id, status: "end" }).unwrap();
            hasEndedRef.current = true;
            unblock();
            navigate("/appointment");
            //api calls
          } catch (error) {
            console.error(error);
            showToast(error?.data?.message || "Something went wrong. Please try again.", "error");
          }
        }}
      >
        {({ values, setFieldValue, dirty, validateForm, setTouched, errors }) => {
          const qtyAutoSetRef = useRef<Record<number, string>>({});

          useEffect(() => {
            values.medication.forEach((med, index) => {
              const nextQty = calculateQuantity(med.frequency, med.duration) || "";

              // if we already set this exact qty for this row, don't set again
              if (qtyAutoSetRef.current[index] === nextQty) return;

              // only update if different from current
              if ((med.quantity || "") !== nextQty) {
                qtyAutoSetRef.current[index] = nextQty;
                setFieldValue(`medication.${index}.quantity`, nextQty, false);
              }
            });
          }, [
            setFieldValue,
            values.medication?.map((m: any) => `${m.frequency}|${m.duration}|${m.quantity}`).join("||"),
          ]);
          const hasText = (v: any) => (typeof v === "string" ? v.trim().length > 0 : !!v);

          const medHasMeaning = (m: any) =>
            [m.medicineName, m.dosage, m.frequency, m.timing, m.duration, m.quantity, m.remarks].some(hasText);

          const hasAnyMeaningfulValue = (values: any) => {
            if (
              hasText(values.chiefComplaints) ||
              hasText(values.pastdentalhistory) ||
              hasText(values.pastmedicalhistory) ||
              hasText(values.complaintType) ||
              hasText(values.extraoralExamination) ||
              hasText(values.oralHygiene) ||
              hasText(values.gingivalHealth) ||
              hasText(values.cariesStatus) ||
              hasText(values.clinicalNotes) ||
              hasText(values.attrition) ||
              hasText(values.abrasion) ||
              hasText(values.erosions) ||
              hasText(values.tendernessOnPercussion) ||
              hasText(values.molarCanineRelation) ||
              hasText(values.mobilityOfTeeth) ||
              hasText(values.investigationRemarks) ||
              hasText(values.diagnosis) ||
              hasText(values.treatmentPlan) ||
              hasText(values.otherinvestigations)
            )
              return true;

            if (values.upperTeeth && Object.keys(values.upperTeeth).length) return true;
            if (values.lowerTeeth && Object.keys(values.lowerTeeth).length) return true;
            if (values.upperChildrenTeeth && Object.keys(values.upperChildrenTeeth).length) return true;
            if (values.lowerChildrenTeeth && Object.keys(values.lowerChildrenTeeth).length) return true;

            if (values.investigations && Object.values(values.investigations).some(Boolean)) return true;

            if (Array.isArray(values.medication) && values.medication.some(medHasMeaning)) return true;

            if (
              hasText(values.followup?.day?.value) ||
              hasText(values.followup?.followdate) ||
              hasText(values.followup?.followremark)
            )
              return true;

            return false;
          };
          const isEmptyMedRow = (m: any) =>
            ![m.medicineName, m.dosage, m.frequency, m.timing, m.duration, m.quantity, m.remarks].some((v) =>
              typeof v === "string" ? v.trim().length > 0 : !!v,
            );

          const onlyChangeIsAddingEmptyMedRow = (values: any) => {
            const meds = values?.medication || [];
            if (!Array.isArray(meds)) return false;
            if (meds.length === 0) return false;

            // if last row is empty AND there is no meaningful values anywhere else
            if (!isEmptyMedRow(meds[meds.length - 1])) return false;

            // IMPORTANT: ignore medication when checking meaningful, because we added an empty one
            // easiest: temporarily remove last med and check meaningful
            const cloned = { ...values, medication: meds.slice(0, -1) };
            return !hasAnyMeaningfulValue(cloned);
          };

          const hasMeaningfulCaseSheet = (values: any) => {
            // you already have hasAnyMeaningfulValue(values) — use it here
            return hasAnyMeaningfulValue(values);
          };

          // const prevDirtyRef = useRef(false);

          useEffect(() => {
            if (isCompletedOpd) return;
            if (hasEndedRef.current) return;

            // show guard only after user starts editing
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
          // const seededRef = useRef(false);
          useEffect(() => {
            if (isCompletedOpd) return;
            if (!getResolved) return;
            if (onlyChangeIsAddingEmptyMedRow(values)) return;
            if (!seedVersion) return;
            if (seededRef.current) return;
            if (!hasAnyMeaningfulValue(values)) return;

            seededRef.current = true;
            const touchAllErrors = (errObj: any): any => {
              if (!errObj || typeof errObj !== "object") return true;
              if (Array.isArray(errObj)) return errObj.map(touchAllErrors);
              return Object.fromEntries(Object.keys(errObj).map((k) => [k, touchAllErrors(errObj[k])]));
            };

            (async () => {
              try {
                // BLOCK seed save if validation fails
                const formErrors = await validateForm();
                if (Object.keys(formErrors || {}).length > 0) {
                  setTouched(touchAllErrors(formErrors), true);
                  seededRef.current = false; // allow retry after user fixes
                  return;
                }
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

          useEffect(() => {
            if (isCompletedOpd) return;
            if (!dirty) return;
            if (!getResolved) return;
            if (onlyChangeIsAddingEmptyMedRow(values)) return;
            if (!hasMeaningfulCaseSheet(values)) return;
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

            saveTimerRef.current = setTimeout(async () => {
              // 1) validate first
              const formErrors = await validateForm();

              const hasErrors = Object.keys(formErrors || {}).length > 0;
              if (hasErrors) {
                // 2) show errors (touch the fields that have errors)
                const touchAllErrors = (errObj: any): any => {
                  if (!errObj || typeof errObj !== "object") return true;
                  if (Array.isArray(errObj)) return errObj.map(touchAllErrors);
                  return Object.fromEntries(Object.keys(errObj).map((k) => [k, touchAllErrors(errObj[k])]));
                };

                setTouched(touchAllErrors(formErrors), true);

                // optional toast (avoid spamming: only show once every X seconds if needed)
                // showToast("Please fix validation errors before saving.", "warning");
                return; // STOP post/patch
              }
              try {
                const payload = buildDentalCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id! });
                const hash = JSON.stringify(payload);
                if (hash === lastSavedHashRef.current) return;

                // 1) ensure we have an id
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

                // 2) PATCH ALWAYS (even right after POST)
                await patchOpdCaseSheet({ id, ...payload }).unwrap();

                lastSavedHashRef.current = hash;
              } catch (e) {
                createInFlightRef.current = false;
                console.warn("Autosave failed", e);
              }
            }, 2000);

            return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
          }, [values, dirty, isCompletedOpd, opd_id, userId, hospitalId, getResolved, validateForm, setTouched]);
          const canSubmit = hasAnyMeaningfulValue(values);
          return (
            <Form>
              <div className="mt-4 space-y-4">
                <HeaderWithTextArea
                  title={t("casesheet.chiefComplaints")}
                  name="chiefComplaints"
                  disabled={isOpd_disable}
                />
                <HeaderWithTextArea
                  title={t("casesheet.pastMedicalHistory")}
                  name="pastmedicalhistory"
                  disabled={isOpd_disable}
                />
                <HeaderWithTextArea
                  title={t("casesheet.pastDentalHistory")}
                  name="pastdentalhistory"
                  disabled={isOpd_disable}
                />
                <HeaderWithTextArea
                  title={t("casesheet.extraoralExamination")}
                  name="extraoralExamination"
                  isCollapse={true}
                  disabled={isOpd_disable}
                />

                <div className="bg-white rounded-xl p-4">
                  <div className="flex bg-[#B8BFFF] items-center justify-between px-2 py-[15px] rounded-md">
                    <p className="text-[#01030F] text-xs font-semibold">{t("casesheet.intraoralExamination")}</p>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out
                  ${extendClinical ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="flex gap-6 mt-4">
                      <div className="flex-1">
                        <div className="mb-4">
                          <p className="text-[#01030F] text-[14px] font-semibold mb-2">{t("casesheet.oralHygiene")}</p>

                          <SingleSelectCheckbox
                            name="oralHygiene"
                            value={values.oralHygiene}
                            disabled={isOpd_disable}
                            onChange={(v) => setFieldValue("oralHygiene", v)}
                            layout="wrap"
                            options={[
                              { label: t("casesheet.good"), value: "good" },
                              { label: t("casesheet.fair"), value: "fair" },
                              { label: t("casesheet.poor"), value: "poor" },
                            ]}
                          />
                        </div>
                        <div className="mb-4">
                          <p className="text-[#01030F] text-[14px] font-semibold mb-2">
                            {t("casesheet.gingivalHealth")}
                          </p>

                          <SingleSelectCheckbox
                            name="gingivalHealth"
                            value={values.gingivalHealth}
                            disabled={isOpd_disable}
                            onChange={(v) => setFieldValue("gingivalHealth", v)}
                            layout="wrap"
                            options={[
                              { label: t("casesheet.healthy"), value: "healthy" },
                              { label: t("casesheet.inflammation"), value: "inflammation" },
                            ]}
                          />
                        </div>
                        <div className="mb-4">
                          <p className="text-[#01030F] text-[14px] font-semibold mb-2">{t("casesheet.cariesStatus")}</p>

                          <SingleSelectCheckbox
                            name="cariesStatus"
                            value={values.cariesStatus}
                            disabled={isOpd_disable}
                            onChange={(v) => setFieldValue("cariesStatus", v)}
                            layout="wrap"
                            options={[
                              { label: t("casesheet.present"), value: "present" },
                              { label: t("casesheet.absent"), value: "absent" },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Right side - Notes */}
                      <div className="flex-1">
                        <p className="text-[#01030F] text-[14px] font-semibold mb-2">{t("casesheet.notes")}</p>
                        <div className="bg-[#FBFBFF] p-3 rounded-md h-[200px]">
                          <TextArea label="" name="clinicalNotes" placeholder="Type here" disabled={isOpd_disable} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ClinicalFindingsSection
                  expanded={extendDental}
                  onToggle={() => setExtendDental(!extendDental)}
                  disabled={isOpd_disable}
                  upperTeethRight={upperTeethRight}
                  upperTeethLeft={upperTeethLeft}
                  lowerTeethRight={lowerTeethRight}
                  lowerTeethLeft={lowerTeethLeft}
                  upperChildrenTeeth={values.upperChildrenTeeth}
                  upperTeeth={values.upperTeeth}
                  lowerTeeth={values.lowerTeeth}
                  lowerChildrenTeeth={values.lowerChildrenTeeth}
                  setFieldValue={setFieldValue}
                  ToothInputComponent={ToothInput}
                  InputRow={
                    <>
                      <div>
                        <label className="text-[#01030F] text-[13px] font-medium mb-1 block">
                          {t("casesheet.attrition")}
                        </label>
                        <FormUnitInput name="attrition" type="text" disabled={isOpd_disable} />
                      </div>

                      <div>
                        <label className="text-[#01030F] text-[13px] font-medium mb-1 block">
                          {t("casesheet.abrasion")}
                        </label>
                        <FormUnitInput name="abrasion" type="text" disabled={isOpd_disable} />
                      </div>

                      <div>
                        <label className="text-[#01030F] text-[13px] font-medium mb-1 block">
                          {t("casesheet.erosions")}
                        </label>
                        <FormUnitInput name="erosions" type="text" disabled={isOpd_disable} />
                      </div>

                      <div>
                        <label className="text-[#01030F] text-[13px] font-medium mb-1 block">
                          {t("casesheet.tendernessOnPercussion")}
                        </label>
                        <FormUnitInput name="tendernessOnPercussion" type="text" disabled={isOpd_disable} />
                      </div>

                      <div>
                        <label className="text-[#01030F] text-[13px] font-medium mb-1 block">
                          {t("casesheet.molarCanineRelation")}
                        </label>
                        <FormUnitInput name="molarCanineRelation" type="text" disabled={isOpd_disable} />
                      </div>

                      <div>
                        <label className="text-[#01030F] text-[13px] font-medium mb-1 block">
                          {t("casesheet.mobilityOfTeeth")}
                        </label>
                        <FormUnitInput name="mobilityOfTeeth" type="text" disabled={isOpd_disable} />
                      </div>
                    </>
                  }
                />

                <InvestigationCard
                  title="Investigations & Diagnosis"
                  expanded={extendInvest}
                  maxHeightClassName="max-h-[800px]"
                  headerRight={
                    <DropDownIcon
                      className={`transition-transform duration-300 ${extendInvest ? "rotate-180" : ""}`}
                      onClick={() => setExtendInvest(!extendInvest)}
                    />
                  }
                >
                  <div className="mt-4">
                    <p className="text-[#01030F] text-[14px] font-semibold mb-2">
                      {t("casesheet.investigationRequired")}
                    </p>

                    <FormCheckboxList
                      values={values}
                      setFieldValue={setFieldValue}
                      disabled={isOpd_disable}
                      layout="wrap"
                      items={[
                        { label: "RVG", name: "investigations.xray" },
                        { label: "IOPA", name: "investigations.iopa" },
                        { label: "OPG", name: "investigations.opg" },
                        { label: "CBCT", name: "investigations.ctScan" },
                        { label: "Lateral Cephalogram", name: "investigations.urine" },
                        { label: "Blood test", name: "investigations.bloodTests" },
                      ]}
                      renderAfterItem={(itemName) =>
                        itemName === "investigations.bloodTests" && values.investigations?.bloodTests ? (
                          <div className="flex items-center ml-2 h-8">
                            <span className="text-gray-500 mr-2">-</span>
                            <FormInput
                              name="otherinvestigations"
                              label="Other Investigations"
                              hideLabel
                              containerClassName="mb-0 flex-1"
                              placeholder="Type here"
                              className="border-none bg-transparent h-8 focus:ring-0 text-sm outline-none w-full"
                              disabled={!values.investigations?.bloodTests || isOpd_disable}
                            />
                          </div>
                        ) : null
                      }
                    />
                  </div>

                  <HeaderWithTextArea
                    title={t("casesheet.results")}
                    name="investigationRemarks"
                    isColored={false}
                    disabled={isOpd_disable}
                  />
                  <HeaderWithTextArea
                    title={t("casesheet.finalDiagnosis")}
                    name="diagnosis"
                    isColored={false}
                    disabled={isOpd_disable}
                  />
                  <HeaderWithTextArea
                    title={t("casesheet.treatmentPlan")}
                    name="treatmentPlan"
                    isColored={false}
                    disabled={isOpd_disable}
                  />
                </InvestigationCard>

                <Medication
                  ref={ref}
                  extendMedication={extendMedication}
                  setExtendMedication={setExtendMedication}
                  height={height}
                  disabled={isOpd_disable}
                />

                <FollowUp extendFollow={extendFollow} setExtendFollow={setExtendFollow} disabled={isOpd_disable} />
              </div>

              {/* Submit Button */}
              {!isOpd_disable && (
                <div className="flex justify-end mt-4 p-4">
                  <button
                    type="submit"
                    className={`px-8 py-3 text-white rounded-lg transition-colors font-medium ${canSubmit ? `bg-blue-600 hover:bg-blue-700` : `bg-gray-600 hover:bg-gray-800`}`}
                    disabled={!canSubmit}
                  >
                    {t("casesheet.endConsultation")}
                  </button>
                </div>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default DentalForm;
