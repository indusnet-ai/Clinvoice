import { CallIcon, DeleteIcon, DropDownIcon } from "@/assets/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Formik, Form, FieldArray } from "formik";
import { FormUnitInput, TextArea } from "@/atoms";
import { validationSchema } from "../hooks/validationSchema";
import {
  useGetOpdCaseSheetQuery,
  usePatchOpdCaseSheetMutation,
  usePostOpdCaseSheetMutation,
} from "../services/ConsultationApi";
import { buildCaseSheetPayload, mapCaseSheetToFormValues, mapMedicalReportToForm } from "../utils";
import { useAppSelector } from "@/app/hook";
import { useNavigate, useSearchParams } from "react-router";
import { showToast } from "@/utils";
import { skipToken } from "@reduxjs/toolkit/query";
import { usePatchOpdStatusMutation } from "../services/DashbaordApi";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";
import HeaderWithTextArea from "./section/HeaderWithTextArea";
import DynamicCollapseSection from "./section/DynamicCollapseSection";
import Medication from "./section/Medication";
import FollowUp from "./section/FollowUp";
import { DynamicVitalsTable } from "./section/DynamicVitals";
import { useLanguage } from "@/language/context/LanguageContext";

interface ManualSheetProps {
  data: any;
  isCompletedOpd?: boolean;
  seedVersion?: number;
  hardBlock?: boolean;
  recordState?: string;
}

const chiefFileds = [
  { label: "Duration", name: "duration" },
  { label: "Remarks", name: "remarks" },
];

const ManualSheet: React.FC<ManualSheetProps> = ({
  data,
  isCompletedOpd = false,
  seedVersion,
  hardBlock,
  recordState,
}) => {
  const userId = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const hospitalId = useAppSelector((state) => state.auth.hospital_id) ?? Number(localStorage.getItem("hospital_id"));
  const [searchParams] = useSearchParams();
  const opdIdParam = searchParams.get("opd_id");
  const patientIdParam = searchParams.get("patient_id");
  const opd_id = opdIdParam ? Number(opdIdParam) : undefined;
  const patient_id = patientIdParam ? Number(patientIdParam) : undefined;
  const [extendVitals, setExtendVitals] = useState(true);
  const [extendMedication, setExtendMedication] = useState(true);
  const [extendFollow, setExtendFollow] = useState(true);
  const [extendChief, setExtendChief] = useState(true);

  const navigate = useNavigate();
  const { t } = useLanguage();

  // Define fields with translations
  const vitalsFields = [
    { label: t("casesheet.temperature"), name: "temperature" },
    { label: t("casesheet.pulse"), name: "pulse" },
    { label: t("casesheet.bloodPressure"), name: "bloodPressure" },
    { label: t("casesheet.weight"), name: "weight" },
    { label: t("casesheet.height"), name: "height" },
    { label: t("casesheet.spo2"), name: "spo2" },
  ];

  const chiefFileds = [
    { label: t("casesheet.duration"), name: "duration" },
    { label: t("casesheet.remarks"), name: "remarks" },
  ];
  //for medication
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  //for api call in every value enter ==> CRCG
  const createdCaseSheetIdRef = useRef<number | null>(null);
  const createInFlightRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHashRef = useRef<string>("");
  const hasEndedRef = useRef(false);

  const seededRef = useRef(false);
  const blockedOnceRef = useRef(false);
  const [postOpdCaseSheet, { isLoading, isSuccess }] = usePostOpdCaseSheetMutation();
  const [patchOpdCaseSheet] = usePatchOpdCaseSheetMutation();
  const [patchOpdStatus] = usePatchOpdStatusMutation();
  //for popup - prevent data loss
  const { block, unblock } = useNavigationGuard();

  // Removed enableReinit state to ensure Formik always reinitializes when data loads asynchronously.
  useEffect(() => {
    if (!ref.current) return;

    if (!extendMedication) {
      // COLLAPSE
      setHeight(0);
      return;
    }

    // EXPAND + AUTO-RESIZE
    const observer = new ResizeObserver(() => {
      setHeight(ref?.current!.scrollHeight);
    });

    observer.observe(ref.current);

    // Initial expand height
    setHeight(ref.current.scrollHeight);

    return () => observer.disconnect();
  }, [extendMedication]);

  //clear the form when the opd changes
  // --- server state ---
  const caseSheetQuery = useGetOpdCaseSheetQuery(opd_id ? { opd_id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });

  const { data: opdCaseSheetRes, isFetching, isUninitialized } = caseSheetQuery;
  const existingCaseSheetId: number | null = opdCaseSheetRes?.data?.id ?? null;
  // const existingCaseSheetId = OpdCaseSheet?.data?.id ?? data?.id ?? null;
  // Decide when GET has "resolved" for current OPD
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
  const prevIdRef = useRef<number | null>(null);
  // When GET returns id, lock it (means: PATCH only from now on)
  useEffect(() => {
    if (!getResolved) return;

    if (prevIdRef.current !== existingCaseSheetId) {
      createdCaseSheetIdRef.current = existingCaseSheetId ?? null;
      lastSavedHashRef.current = ""; // only when id changed
      prevIdRef.current = existingCaseSheetId;
    }
  }, [existingCaseSheetId, getResolved]);

  const getInitialValues = () => {
    //  Fresh empty form — always used as the fallback so the form never gets null.
    const empty = {
      temperature: "",
      pulse: "",
      bloodPressure: "",
      weight: "",
      height: "",
      spo2: "",
      symptoms: "",
      remarks: "",
      duration: "",
      investigations: [{ testCat: "", subCat: "", advisedRemark: "" }],
      diagnosis: "",
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
      dietPlan: "",
      followup: {
        day: { value: "", unit: "days" },
        followdate: "",
        followremark: "",
      },
      pastmedical: "",
    };

    try {
      if (data?.id) {
        const mapped = mapCaseSheetToFormValues(data.casesheet);
        return mapped ? { ...empty, ...mapped } : empty;
      }
      if (data) {
        const mapped = mapMedicalReportToForm(data);
        return mapped ? { ...empty, ...mapped } : empty;
      }
    } catch (e) {
      // mapper failed on unexpected shape — fall through to empty
      console.warn("Case-sheet mapper failed, using empty form:", e);
    }
    return empty;
  };

  // const prevTimingRef = useRef<string | undefined>(undefined);

  //for disable and no evnets
  const iswaitRecord = recordState === "recording" || recordState === "processing";
  const isOpd_disable = isCompletedOpd || !opd_id || iswaitRecord;
  return (
    <Formik
      enableReinitialize={true}
      initialValues={getInitialValues()}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        try {
          // optional final save (ONLY if draft exists)
          if (createdCaseSheetIdRef.current && !createInFlightRef.current) {
            const payload = buildCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id! });
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
        } catch (error: any) {
          showToast(error?.data?.message || "Something went wrong. Please try again.", "error");
        }
      }}
    >
      {({ values, setFieldValue, dirty, validateForm, setTouched }) => {
        // Removed didInitRef useEffect that disabled reinitialization.
        const hasAnyMeaningfulValue = (values: any) => {
          // Formik can briefly pass `null` while reinitializing — guard for it.
          if (!values) return false;
          if (
            values.temperature ||
            values.pulse ||
            values.bloodPressure ||
            values.weight ||
            values.height ||
            values.spo2
          )
            return true;
          if (
            values.symptoms ||
            values.remarks ||
            values.duration ||
            values.diagnosis ||
            values.dietPlan ||
            values.pastmedical
          )
            return true;

          if (
            Array.isArray(values.investigations) &&
            values.investigations.some((i: any) => i.testCat || i.subCat || i.advisedRemark)
          )
            return true;
          if (
            Array.isArray(values.medication) &&
            values.medication.some(
              (m: any) =>
                m.medicineName || m.dosage || m.frequency || m.timing || m.duration || m.quantity || m.remarks,
            )
          )
            return true;

          if (values.followup?.day?.value || values.followup?.followdate || values.followup?.followremark) return true;

          return false;
        };

        const canSubmit = hasAnyMeaningfulValue(values);

        // const prevDirtyRef = useRef(false);
        const payloadHash = useMemo(() => {
          if (!opd_id) return "";
          const payload = buildCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id });
          return JSON.stringify(payload);
        }, [values, userId, hospitalId, opd_id]);

        useEffect(() => {
          if (isCompletedOpd) return;
          if (hasEndedRef.current) return;

          // show guard only after user starts editing
          if (dirty && !blockedOnceRef.current) {
            blockedOnceRef.current = true;
            block({
              title: t("consultation.confirmation.leaveTitle"),
              message: t("consultation.confirmation.leaveFormMessage"),
              confirmText: t("consultation.confirmation.stopAndLeave"),
              cancelText: t("consultation.confirmation.continueConsultation"),
              reason: "manual-form",
            });
          }
        }, [dirty, isCompletedOpd, block]);

        // const seededRef = useRef(false);
        useEffect(() => {
          if (isCompletedOpd) return;
          if (!seedVersion) return;
          if (!getResolved) return;
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
              const formErrors = await validateForm();
              if (Object.keys(formErrors || {}).length > 0) {
                setTouched(touchAllErrors(formErrors), true);
                seededRef.current = false; // allow retry after user fixes
                return;
              }
              const payload = JSON.parse(payloadHash);

              // const payload = buildCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id! });
              // const hash = JSON.stringify(payload);

              let id = createdCaseSheetIdRef.current;

              if (!id) {
                const res = await postOpdCaseSheet(payload).unwrap();
                id = res?.id ?? res?.data?.id;
                createdCaseSheetIdRef.current = id ?? null;
              }

              if (id) {
                await patchOpdCaseSheet({ id, ...payload }).unwrap();
                lastSavedHashRef.current = payloadHash;
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
              const payload = buildCaseSheetPayload({ values, userId, hospitalId, opdId: opd_id! });
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

        const vitalsFields = [
          { label: "Temperature", name: "temperature", placeholder: "F" },
          { label: "Pulse", name: "pulse", placeholder: "bpm" },
          { label: "Blood Pressure", name: "bloodPressure", placeholder: "mm/Hg" },
          { label: "Weight", name: "weight", placeholder: "Kg" },
          { label: "Height", name: "height", placeholder: "cm" },
          { label: "Spo2", name: "spo2", placeholder: "%" },
        ];
        const chiefFileds = [
          { label: "Duration", name: "duration", placeholder: "6 days...." },
          { label: "Remarks", name: "remarks", placeholder: "Enter remarks here...." },
        ];

        return (
          <Form>
            <div className="mt-4 bg-white">
              {/* vitals */}
              <div className="px-4">
                <div className="flex items-center justify-between">
                  <p className="text-[#01030F] text-[16px] font-semibold mb-2">{t("casesheet.vitals")}</p>
                  <DropDownIcon
                    className={`transition-transform duration-300 ${extendVitals ? "rotate-180" : ""}`}
                    onClick={() => setExtendVitals(!extendVitals)}
                  />
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out
                           ${extendVitals ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <DynamicVitalsTable
                    fields={vitalsFields}
                    values={values}
                    setFieldValue={setFieldValue}
                    disabled={isOpd_disable}
                    InputComponent={FormUnitInput}
                  />
                </div>
              </div>

              {/* chief complaints */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[#01030F] text-[16px] font-semibold mb-2">{t("casesheet.chiefComplaints")}</p>
                  <DropDownIcon
                    className={`transition-transform duration-300 ${extendChief ? "rotate-180" : ""}`}
                    onClick={() => setExtendChief(!extendChief)}
                  />
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out
                           ${extendChief ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  {/* Table Header */}
                  <div
                    className={`grid bg-[#B8BFFF] text-[#01030F] text-[14px] font-medium py-4 px-2 items-center rounded-xl`}
                  >
                    <p>{t("casesheet.symptoms")}</p>
                  </div>

                  {/* Table Inputs */}
                  <div className="grid gap-2 bg-[#FBFBFF] py-4 mt-2 px-2 rounded-xl">
                    <TextArea
                      label=""
                      name="symptoms"
                      placeholder={t("consultation.placeholders.typeHere")}
                      disabled={isOpd_disable}
                    />
                  </div>

                  <DynamicVitalsTable
                    fields={chiefFileds}
                    values={values}
                    setFieldValue={setFieldValue}
                    disabled={isOpd_disable}
                    InputComponent={FormUnitInput}
                  />
                </div>
              </div>
              {/* Past Medical History */}
              <HeaderWithTextArea
                title={t("casesheet.pastMedicalHistory")}
                placeholder={t("consultation.placeholders.typeHere")}
                name="pastmedical"
                isColored={true}
                disabled={isOpd_disable}
              />
              {/* Investigations advised */}
              <DynamicCollapseSection
                title={t("casesheet.investigationRequired")}
                isColored={false}
                disabled={isOpd_disable}
                maxHeight="600px"
                fieldArray={{
                  name: "investigations",
                  columns: [
                    { label: t("casesheet.testCategories"), field: "testCat" },
                    { label: t("casesheet.subCategories"), field: "subCat" },
                    { label: t("casesheet.remarks"), field: "advisedRemark" },
                  ],
                  addNewRow: {
                    testCat: "",
                    subCat: "",
                    advisedRemark: "",
                  },
                }}
              />
              {/* Diagnosis & Treatment Advice */}
              <div className="p-4">
                <HeaderWithTextArea
                  title={t("casesheet.finalDiagnosis")}
                  placeholder={t("consultation.placeholders.typeHere")}
                  name="diagnosis"
                  isColored={false}
                  disabled={isOpd_disable}
                />
              </div>
              {/* Medication */}
              <Medication
                extendMedication={extendMedication}
                setExtendMedication={setExtendMedication}
                height={""}
                ref={undefined}
                disabled={isOpd_disable}
              />
              {/* Diet paln */}
              <HeaderWithTextArea
                title={t("casesheet.dietPlan")}
                placeholder={t("consultation.placeholders.typeHere")}
                name="dietPlan"
                isColored={false}
                disabled={isOpd_disable}
              />
              {/* Follow up */}
              <FollowUp extendFollow={extendFollow} setExtendFollow={setExtendFollow} disabled={isOpd_disable} />
            </div>

            {!isOpd_disable && (
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  // onClick={() => {
                  //   window.alert("hello");
                  // }}
                  className={`px-4 py-2  text-white rounded-lg ${canSubmit ? `bg-blue-600` : ` bg-gray-600 cursor-not-allowed`}`}
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
  );
};

export default ManualSheet;
