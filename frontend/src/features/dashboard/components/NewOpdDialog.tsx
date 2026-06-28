import React, { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "@/assets/icons";
import { Button, FormDateInput, FormInput, FormInputWithUnitSelect, SearchableSelect } from "@/atoms";
import { FormPhoneInput } from "@/components";
import { CustomDialog } from "@/app/component/CustomDialog";
import { Form, Formik } from "formik";
import { GenderOptions, Salutations } from "@/data/dropdown.js";
import { usePostOPDdataMutation } from "../services/DashbaordApi";
import { useAppSelector } from "@/app/hook";
import { showToast, toDateInputValue } from "@/utils";
import { PhoneSearchSelect } from "./PhoneSearchSelect";
import { useGetSlotInfoQuery } from "../../settings/services/SettingApi";
import { useGetDoctorInfoQuery } from "../../onboard/services/OnBoardApi";
import * as Yup from "yup";
import { useLanguage } from "@/language/context/LanguageContext";
interface NewOpdDialogProps {
  open: boolean;
  onClose: () => void;
  setOpenAddPatient?: (_data: boolean) => void;
  patientData?: any;
  setNewPatientMobile?: (data: { dialCode: string; number: string }) => void;
}

const getTodayDayName = () => new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

const isSlotExpired = (endTime: string): boolean => {
  try {
    if (!endTime || typeof endTime !== "string") {
      console.warn("Invalid endTime format:", endTime);
      return true; // Treat invalid slots as expired for safety
    }

    const now = new Date();
    const timeParts = endTime.split(":");

    if (timeParts.length < 2) {
      console.warn("Invalid time format:", endTime);
      return true;
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn("Invalid time values:", { hours, minutes });
      return true;
    }

    const slotEndTime = new Date();
    slotEndTime.setHours(hours, minutes, 0, 0);

    // Use >= to ensure slot is unavailable AT or AFTER the end time
    return now >= slotEndTime;
  } catch (error) {
    console.error("Error in isSlotExpired:", error);
    return true; // Fail-safe: treat as expired if there's any error
  }
};

// Additional validation: check if there's enough time left in the slot
const hasEnoughTimeRemaining = (endTime: string, bufferMinutes: number = 5): boolean => {
  try {
    if (!endTime || typeof endTime !== "string") {
      return false;
    }

    const now = new Date();
    const timeParts = endTime.split(":");

    if (timeParts.length < 2) {
      return false;
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return false;
    }

    const slotEndTime = new Date();
    slotEndTime.setHours(hours, minutes, 0, 0);

    // Add buffer time to current time and check if it's still before slot end
    const nowWithBuffer = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    return nowWithBuffer < slotEndTime;
  } catch (error) {
    console.error("Error in hasEnoughTimeRemaining:", error);
    return false; // Fail-safe: treat as not enough time
  }
};

const NewOpdDialog: React.FC<NewOpdDialogProps> = ({
  open,
  onClose,
  setOpenAddPatient,
  patientData,
  setNewPatientMobile,
}) => {
  const { t } = useLanguage();
  const [isPatientConfirmed, setIsPatientConfirmed] = useState(!!patientData);
  const { data } = useGetDoctorInfoQuery({ page: 1, limit: 1 }, { refetchOnMountOrArgChange: true });
  const docData = data?.data?.[0];
  const authHospitalId = useAppSelector((state) => state.auth.hospital_id);
  const dashboardDoctorId = useAppSelector((state) => state.dashboard.doctor_id);
  const authDoctorId = useAppSelector((state) => state.auth.doctor_id);
  const userId = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const doctorName = useAppSelector((state) => state.auth.doctor?.doctor_name) || docData?.name;
  const [postOPDdata, { isLoading }] = usePostOPDdataMutation();

  useEffect(() => {
    // When opened from patient profile, `patientData` is already known (no PhoneSearchSelect),
    // so we should allow slot selection immediately.
    if (open) setIsPatientConfirmed(!!patientData);
  }, [open, patientData]);

  const resolvedHospitalId = Number(authHospitalId ?? localStorage.getItem("hospital_id"));
  const resolvedDoctorId = Number(
    dashboardDoctorId ?? authDoctorId ?? docData?.id ?? localStorage.getItem("doctor_id"),
  );
  const hasValidSlotQueryIds =
    Number.isFinite(resolvedHospitalId) &&
    resolvedHospitalId > 0 &&
    Number.isFinite(resolvedDoctorId) &&
    resolvedDoctorId > 0;

  const {
    data: slotData,
    isLoading: isSlotLoading,
    isFetching: isSlotFetching,
    isUninitialized: isSlotUninitialized,
    error: slotError,
  } = useGetSlotInfoQuery(
    { hospitalId: resolvedHospitalId, doctorId: resolvedDoctorId },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      skip: !hasValidSlotQueryIds,
    },
  );
  const slot = slotData?.data;
  const isNowWithin = (start: string, end: string) => {
    const toMin = (t: string) => {
      const [h, m] = t.slice(0, 5).split(":").map(Number);
      return h * 60 + m;
    };

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    return nowMin >= toMin(start) && nowMin <= toMin(end);
  };

  const today = getTodayDayName();

  const slotOptions = useMemo(() => {
    if (!slotData || !slot?.length) return [];

    return (
      slot

        .filter(
          (s) =>
            String(s.dayname || "")
              .trim()
              .toLowerCase() === today,
        )
        // Expiry filter intentionally disabled — show every configured slot for
        // the selected weekday regardless of current clock time.
        // .filter((s) => !isSlotExpired(s.end_time))
        .map((s) => {
          const start = s.start_time.slice(0, 5);
          const end = s.end_time.slice(0, 5);

          return {
            label: `${start} - ${end}`,
            value: s.id,
            meta: s,
          };
        })
    );
  }, [slot, slotData, today]);

  const slotHelperText = useMemo(() => {
    if (!isPatientConfirmed) return "";
    if (!hasValidSlotQueryIds) return "Loading doctor and hospital slot configuration...";
    if (isSlotUninitialized || isSlotLoading || isSlotFetching) return "Loading available slots...";
    if (slotError) return "Unable to load slots right now. Please refresh and try again.";
    if (slotOptions.length === 0) return "No active slots available for today.";
    return "";
  }, [
    isPatientConfirmed,
    hasValidSlotQueryIds,
    isSlotUninitialized,
    isSlotLoading,
    isSlotFetching,
    slotError,
    slotOptions.length,
  ]);

  // schema for form validation
  const MobileOnlySchema = Yup.object({
    mobile: Yup.object({
      number: Yup.string()
        .required(t("opd.validMobile"))
        .matches(/^[0-9]{10}$/, t("opd.validMobile")),
    }),
  });

  const FullOpdSchema = Yup.object({
    patient_name: Yup.object({
      value: Yup.string().trim().required(t("opd.patientNameRequired")),
      unit: Yup.string().required(t("opd.salutationRequired")),
    }),
    gender: Yup.string().required(t("opd.genderRequired")),
    dob: Yup.date().optional(),
    doctor: Yup.string().required(t("opd.doctorRequired")),
    slot_id: Yup.string().required(t("opd.slotRequired")),
  });

  const initialValues = useMemo(() => {
    if (!patientData) {
      return {
        patient_id: 0,
        mobile: { dialCode: "+91", number: "", full: "" },
        patient_name: {
          value: "",
          unit: "",
        },
        gender: "",
        blood_group: "",
        dob: "",
        doctor: doctorName || "",
        slot_id: "",
      };
    }

    return {
      patient_id: patientData?.id,
      mobile: {
        dialCode: `${patientData.country_code}`,
        number: patientData.mobile_no,
        full: `${patientData.country_code}${patientData.mobile_no}`,
      },
      patient_name: {
        value: patientData.patient_name || "",
        unit: patientData.salutation || "",
      },
      gender: patientData.gender
        ? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1).toLowerCase()
        : "",
      blood_group: patientData.blood_group || "",
      dob: toDateInputValue(patientData.dob) || "",
      doctor: doctorName || "",
      slot_id: "",
    };
  }, [patientData, doctorName]);

  return (
    <div>
      <CustomDialog open={open} onClose={onClose} maxWidth="xl" disableBackdropClose disableEscClose>
        <div>
          <div className="flex items-center w-full justify-between">
            <h1 className="text-[#000000] font-semibold text-[16px]">{t("opd.newOpd")}</h1>
            <CloseIcon color="#98999E" className="cursor-pointer" onClick={onClose} />
          </div>
          <div>
            <Formik
              enableReinitialize
              initialValues={initialValues}
              validationSchema={isPatientConfirmed ? FullOpdSchema : MobileOnlySchema}
              onSubmit={async (values) => {
                if (!isPatientConfirmed) {
                  return;
                }
                if (!hasValidSlotQueryIds) {
                  showToast(t("opd.slotNotAvailable"), "error");
                  return;
                }
                if (values.mobile.number.length !== 10) {
                  showToast(t("opd.validMobile"), "error");
                  return;
                }
                if (values.slot_id === "") {
                  showToast(t("opd.validSlot"), "error");
                  return;
                }

                // Safety check: ensure slot data is available
                if (!slot || slot.length === 0) {
                  showToast(t("opd.slotNotAvailable"), "error");
                  return;
                }

                const selectedSlot = slot.find((s) => s.id === Number(values.slot_id));

                // Validate slot exists
                if (!selectedSlot) {
                  showToast(t("opd.slotNotAvailable"), "error");
                  return;
                }

                // Validate slot hasn't expired
                if (isSlotExpired(selectedSlot.end_time)) {
                  showToast(t("opd.slotNotAvailable"), "error");
                  return;
                }

                // Additional check: ensure there's enough time remaining in the slot
                if (!hasEnoughTimeRemaining(selectedSlot.end_time)) {
                  showToast(t("opd.slotNotAvailable"), "error");
                  return;
                }
                const now = new Date();
                const currentDate = new Date().toISOString().split("T")[0];

                const currentTime = now.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                try {
                  const payload = {
                    user_id: Number(userId), // from auth
                    hospital_id: resolvedHospitalId, // from resolved sources
                    patient_id: values.patient_id, // if existing patient
                    patient_name: values.patient_name?.value,
                    salutation: values.patient_name?.unit,
                    date: currentDate,
                    time: currentTime,
                    priority: "normal",
                    doctor_id: resolvedDoctorId,
                    doctor_name: values.doctor,
                    specialist: values.doctor,
                    source: "web-app",
                    slot_id: values?.slot_id || "",
                    slot_start_time: selectedSlot?.start_time || "",
                    slot_end_time: selectedSlot?.end_time || "",
                    module: "OPD",
                  };
                  await postOPDdata(payload).unwrap();
                  showToast(t("opd.opdCreated"), "success");
                  onClose();
                } catch (err) {
                  showToast(err?.data?.message || t("opd.opdFailed"), "error");
                  console.error("Failed to create OPD", err);
                }
              }}
            >
              {(formik) => (
                <Form className="grid grid-cols-1 md:grid-cols-3 gap-x-6 mt-7">
                  {!!patientData ? (
                    <FormPhoneInput name="mobile" label={t("label.mobile")} disabled={!!patientData} required />
                  ) : (
                    <PhoneSearchSelect
                      name="mobile"
                      label={t("label.mobile")}
                      onAddNew={(mobileData) => {
                        setNewPatientMobile?.(mobileData);
                        onClose();
                        setOpenAddPatient(true);
                      }}
                      onPatientSelected={() => setIsPatientConfirmed(true)}
                      required
                    />
                  )}
                  {/* <FormInput name="patient_name" label="Patient Name" disabled={!!patientData} /> */}
                  <FormInputWithUnitSelect
                    name="patient_name"
                    label={t("label.patientName")}
                    unitOptions={Salutations}
                    isLeftUnit
                    type="text"
                    disabled
                  />
                  <SearchableSelect name="gender" options={GenderOptions} label={t("label.gender")} disabled />
                  <FormDateInput
                    label={t("label.dob")}
                    name="dob"
                    showAge
                    disabled={!!patientData || !!doctorName}
                    maxdate={new Date().toISOString().split("T")[0]}
                    mindate={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split("T")[0]}
                  />
                  {/* <SearchableSelect name="blood_group" options={BloodGroupOptions} label="Blood Group" disabled /> */}
                  <FormInput name="doctor" label={t("label.doctorInfo")} disabled={!!patientData || !!doctorName} />
                  <div>
                    <SearchableSelect
                      name="slot_id"
                      options={slotOptions}
                      label={t("label.slots")}
                      disabled={!isPatientConfirmed}
                      required={isPatientConfirmed}
                    />
                    {slotHelperText && <p className="-mt-2 text-xs text-[#5B657A]">{slotHelperText}</p>}
                  </div>
                  <div className="mt-5 flex items-center justify-end gap-4 w-full col-span-1 md:col-span-3">
                    <Button label={t("opd.cancel")} variant="outlined" onClick={onClose} />
                    <Button label={t("opd.save")} variant="contained" onClick={formik.handleSubmit} />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
};

export default NewOpdDialog;
