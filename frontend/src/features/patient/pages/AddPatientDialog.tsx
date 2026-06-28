import React, { useEffect, useRef } from "react";
import * as Yup from "yup";
import { CloseIcon } from "@/assets/icons";
import { Button, FormDateInput, FormInput, FormInputWithUnitSelect, SearchableSelect } from "@/atoms";
import { FormPhoneInput } from "@/components";
import { CustomDialog, ProfileImageInput } from "@/app/component";
import { Form, Formik, useFormikContext } from "formik";
import { usePatchPatientMutation, usePostPatientMutation } from "../services/PatientApi";
import { BloodGroupOptions, GenderOptions, Salutations } from "@/data/dropdown.js";
import { useAppSelector } from "@/app/hook";
import { showToast, toDateInputValue } from "@/utils";
import { PatientData } from "../types";
import { useGetDoctorInfoQuery } from "../../onboard/services/OnBoardApi";
import { useNavigate } from "react-router";
import { useLanguage } from "@/language/context/LanguageContext";

interface AddPatientDialogProps {
  open: boolean;
  onClose: () => void;
  selectedData?: PatientData | null;
  prefillValue?: { dialCode: string; number: string };
}

const GenderSalutationSync = () => {
  const { values, setFieldValue } = useFormikContext<any>();
  const prevGenderRef = useRef(values?.gender);
  const prevSalutationRef = useRef(values?.name?.unit);
  const syncingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const currentGender = values?.gender;
    const currentSalutation = values?.name?.unit;
    const prevGender = prevGenderRef.current;
    const prevSalutation = prevSalutationRef.current;

    const normalize = (v: any) =>
      String(v || "")
        .trim()
        .toLowerCase();
    const genderNorm = normalize(currentGender);
    const salNorm = normalize(currentSalutation);

    const setBoth = (nextGender?: string, nextSalutation?: string) => {
      syncingRef.current = true;
      if (nextGender && nextGender !== currentGender) setFieldValue("gender", nextGender);
      if (nextSalutation && nextSalutation !== currentSalutation) setFieldValue("name.unit", nextSalutation);
      prevGenderRef.current = nextGender ?? currentGender;
      prevSalutationRef.current = nextSalutation ?? currentSalutation;
      queueMicrotask(() => {
        syncingRef.current = false;
      });
    };

    // One-time initialization: when dialog opens with default salutation (e.g. "Mr")
    // but gender is still empty, infer gender from salutation.
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (!genderNorm && salNorm && !syncingRef.current) {
        if (salNorm === "ms" || salNorm === "mrs") {
          setBoth("Female", undefined);
        } else if (salNorm === "mr") {
          setBoth("Male", undefined);
        }
        return;
      }
    }

    if (syncingRef.current) return;

    const genderChanged = currentGender !== prevGender;
    const salutationChanged = currentSalutation !== prevSalutation;

    // Don't override when neither field actually changed.
    if (!genderChanged && !salutationChanged) return;

    if (genderChanged) {
      prevGenderRef.current = currentGender;
      if (!genderNorm) return;

      // If gender is "other/others", don't force any salutation.
      if (genderNorm === "other" || genderNorm === "others") return;

      if (genderNorm === "female") setBoth(undefined, "Ms");
      else if (genderNorm === "male") setBoth(undefined, "Mr");
      else setBoth(undefined, "Mr");
      return;
    }

    if (salutationChanged) {
      prevSalutationRef.current = currentSalutation;
      if (!salNorm) return;

      // If gender is "other/others", allow any salutation without changing gender.
      if (genderNorm === "other" || genderNorm === "others") return;

      if (salNorm === "ms" || salNorm === "mrs") setBoth("Female", undefined);
      else if (salNorm === "mr") setBoth("Male", undefined);
      return;
    }
  }, [setFieldValue, values?.gender, values?.name?.unit]);

  return null;
};

const AddPatientDialog: React.FC<AddPatientDialogProps> = ({ open, onClose, selectedData = null, prefillValue }) => {
  const userId = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const hospitalId = useAppSelector((state) => state.auth.hospital_id) ?? Number(localStorage.getItem("hospital_id"));
  const [postPatient, { isLoading }] = usePostPatientMutation();
  const [patchPatient] = usePatchPatientMutation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const formatDateToYYYYMMDD = (date: string | Date) => {
    if (!date) return "";

    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const { data } = useGetDoctorInfoQuery({ page: 1, limit: 1 }, { refetchOnMountOrArgChange: true });

  return (
    <div>
      <CustomDialog open={open} onClose={onClose} maxWidth="xl" disableBackdropClose disableEscClose>
        <div className="flex items-center w-full justify-between">
          <h1 className="text-[#000000] font-semibold text-[16px]">
            {selectedData ? t("label.editPatient") : t("label.addPatient")}
          </h1>
          <CloseIcon color="#98999E" className="cursor-pointer" onClick={onClose} />
        </div>
        <div>
          <Formik
            enableReinitialize
            initialValues={{
              image: selectedData?.image || "",
              name: {
                value: selectedData?.patient_name || "",
                unit: selectedData?.salutation || "Mr",
              },
              gender: selectedData?.gender
                ? selectedData.gender.charAt(0).toUpperCase() + selectedData.gender.slice(1).toLowerCase()
                : "",
              dateOfBirth: toDateInputValue(selectedData?.dob) || "",
              bloodGroup: selectedData?.blood_group || "",
              email: selectedData?.email || "",
              primaryPhone: {
                dialCode: selectedData?.country_code || prefillValue?.dialCode || "",
                number: selectedData?.mobile_no || prefillValue?.number || "",
                full:
                  (selectedData?.country_code || prefillValue?.dialCode || "") +
                  (selectedData?.mobile_no || prefillValue?.number || ""),
              },
              address: selectedData?.address || "",
            }}
            validationSchema={Yup.object({
              name: Yup.object({
                value: Yup.string()
                  .required("Patient Name is required")
                  .min(2, "Patient Name must be at least 2 characters")
                  .max(30, "Patient Name must be less than 30 characters")
                  .matches(/^[a-zA-Z\s]*$/, "Patient Name can only contain alphabets and spaces"),
                unit: Yup.string().optional(),
              }),
              gender: Yup.string().required("Gender is required"),
              dateOfBirth: Yup.date()
                .transform((value, originalValue) => {
                  // when input is "" treat it as not provided
                  if (originalValue === "" || originalValue == null) return null;
                  return value;
                })
                .typeError("Invalid date formate (DD-MM-YYYY)")
                .nullable()
                .notRequired()
                .max(new Date(), "Date of birth cannot be in the future")
                .test("year-length", "Invalid year", (value) => {
                  if (!value) return true; // allow empty
                  return String(value.getFullYear()).length === 4;
                })
                .test("age-limit", "Age must be less than 120 years", (value) => {
                  if (!value) return true; // allow empty
                  const now = new Date();
                  let age = now.getFullYear() - value.getFullYear();
                  const m = now.getMonth() - value.getMonth();
                  if (m < 0 || (m === 0 && now.getDate() < value.getDate())) age--; // accurate age
                  return age <= 120;
                }),
              bloodGroup: Yup.string().optional(),
              // email: Yup.string()
              //   .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address")
              //   .email()
              //   .optional(),
              email: Yup.string()
                .transform((value) => value?.trim())
                .email("Invalid email")
                .nullable()
                .notRequired(),
              primaryPhone: Yup.object().shape({
                dialCode: Yup.string().required(),
                number: Yup.string()
                  .test("valid-phone", function (value) {
                    const { dialCode } = this.parent;

                    if (!value) {
                      return this.createError({ message: "Mobile number is required" });
                    }

                    // Indian number validation
                    if (dialCode === "+91") {
                      if (!/^[6-9][0-9]{9}$/.test(value)) {
                        return this.createError({
                          message: "Mobile number must start with 6, 7, 8, or 9 and be exactly 10 digits",
                        });
                      }
                    } else {
                      // Other countries - just check if it's numeric and has appropriate length
                      if (!/^[0-9]+$/.test(value)) {
                        return this.createError({ message: "Mobile number must contain only digits" });
                      }
                      if (value.length < 8 || value.length > 15) {
                        return this.createError({ message: "Mobile number must be between 8 and 15 digits" });
                      }
                    }

                    return true;
                  })
                  .required("Mobile number is required"),

                full: Yup.string().required(),
              }),
              address: Yup.string()
                .min(3, "Address must be at least 3 characters")
                .max(400, "Address must be less than 400 characters")
                .optional(),
            })}
            onSubmit={async (values) => {
              const paylaod = {
                user_id: Number(userId),
                hospital_id: Number(hospitalId),
                salutation: values.name?.unit,
                patient_name: values.name?.value,
                gender: values.gender,
                // Edit: always send dob (null clears it on the server). Add: omit if empty.
                ...(selectedData
                  ? { dob: values.dateOfBirth ? formatDateToYYYYMMDD(values.dateOfBirth) : null }
                  : values.dateOfBirth
                  ? { dob: formatDateToYYYYMMDD(values.dateOfBirth) }
                  : {}),
                blood_group: values.bloodGroup,
                mobile_no: values.primaryPhone?.number,
                country_code: values.primaryPhone?.dialCode,
                ...(values.email && {
                  email: values.email.trim(),
                }),
                image: values.image || "",
                address: values?.address || "",
              };

              try {
                if (selectedData) {
                  const res = await patchPatient({
                    patientid: selectedData.id,
                    data: paylaod,
                  }).unwrap();
                  showToast("Patient updated successfully", "success");
                  onClose();
                } else {
                  const res = await postPatient(paylaod).unwrap();
                  showToast("Patient added successfully", "success");
                  onClose();
                }
              } catch (error) {
                showToast(error?.data?.message || "Failed to add patient", "error");
              }
            }}
          >
            {(formik) => {
              return (
                <Form className="grid grid-cols-1 md:grid-cols-3 gap-x-6 ">
                  <GenderSalutationSync />
                  <div className=" row-span-1 md:row-span-2">
                    <ProfileImageInput label="" name="image" />
                  </div>
                  <FormInputWithUnitSelect
                    label={t("label.name")}
                    name="name"
                    unitOptions={Salutations}
                    isLeftUnit
                    type="text"
                    regex={/^[a-zA-Z\s]*$/}
                    placeholder="Enter patient name"
                    required
                  />
                  <SearchableSelect name="gender" options={GenderOptions} label={t("label.gender")} required />
                  {/* <SearchableSelect label="Gender" name="gender" options={dummyOptions} /> */}
                  <FormDateInput
                    label={t("label.dob")}
                    name="dateOfBirth"
                    showAge
                    maxdate={new Date().toISOString().split("T")[0]}
                    mindate={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split("T")[0]}
                  />
                  <SearchableSelect name="bloodGroup" options={BloodGroupOptions} label={t("label.bloodGroup")} />
                  {/* <SearchableSelect label="BloodGroup" name="bloodGroup" options={dummyOptions} /> */}
                  <FormPhoneInput label={t("label.mobileNumber")} name="primaryPhone" required />
                  <FormInput label={t("label.email")} name="email" placeholder="Enter email address" />
                  <FormInput label={t("label.permanentAddress")} name="address" placeholder="Enter permanent address" />
                  <div className="w-full flex items-end justify-end gap-2 py-4 col-span-1 md:col-span-3">
                    <Button variant="outlined" label={t("label.cancel")} onClick={onClose} />
                    <Button label={t("label.submit")} type="submit" />
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </CustomDialog>
    </div>
  );
};

export default AddPatientDialog;
