import { Button, FileInput, FormDateInput, FormInput, SearchableSelect } from "@/atoms";
import { FormPhoneInput } from "@/components";
import { Form, Formik } from "formik";
import React from "react";
import * as Yup from "yup";
import { ProfileImageInput } from "@/app/component";
import FooterButton from "./FooterButton";
import { DoctorMapper } from "../utils/mapDoctorPayload";
import { DoctorForm } from "../types/request.types";
import {
  YearOptions,
  ExperienceOptions,
  RegistrationCouncilOptions,
  MedicalGraduateOptions,
  GenderOptions,
  SpecializationCategories,
} from "@/data/dropdown.js";
import { showToast } from "@/utils";
import { useAppSelector } from "@/app/hook";
import { useLanguage } from "@/language/context/LanguageContext";
import { selectIsOnboardCompleted } from "@/utils/isOnboardCompleted";

interface DoctorInfoProps {
  onNext: (data: DoctorForm) => void;
  doctorData: DoctorForm | null;
  onBack?: () => void;
  isSetting?: boolean;
}

export const DoctorInfo: React.FC<DoctorInfoProps> = ({ onNext, doctorData, onBack, isSetting = false }) => {
  const isCompleted = useAppSelector(selectIsOnboardCompleted);
  const email = useAppSelector((state) => state.auth.username);
  const { t } = useLanguage();
  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{
          ...(doctorData ?? DoctorMapper.toForm(null)),
          email: email ?? doctorData?.email ?? "",
        }}
        validationSchema={Yup.object({
          fullName: Yup.string()
            .required("Full Name is required")
            .min(2, "Full Name Min 2 Characters")
            .max(30, "Full Name Max 30 Characters")
            .matches(/^[a-zA-Z\s]*$/, "Name can only contain alphabets"),
          gender: Yup.string().required("Gender Type is required"),
          dateOfBirth: Yup.string()
            .required("Date Of Birth is required")
            .test("valid-dob", "Doctor age must be between 18 and 120 years", function (value) {
              if (!value) return false;

              const dob = new Date(value);
              const today = new Date();

              // Future date not allowed
              if (dob > today) return false;

              const minDob = new Date();
              minDob.setFullYear(today.getFullYear() - 120); // oldest allowed

              const maxDob = new Date();
              maxDob.setFullYear(today.getFullYear() - 18); // youngest allowed

              return dob >= minDob && dob <= maxDob;
            }),
          email: Yup.string()
            .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address")
            .email()
            .required("Email is required"),
          primaryPhone: Yup.object().shape({
            dialCode: Yup.string().required(),
            number: Yup.string()
              .test("valid-phone", function (value) {
                const { dialCode } = this.parent;

                if (!value) {
                  return this.createError({ message: "Primary Mobile number is required" });
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
              .required("Primary Mobile number is required"),
            full: Yup.string().required(),
          }),
          secondaryPhone: Yup.object().shape({
            dialCode: Yup.string(),
            number: Yup.string()
              .matches(/^[0-9]{1,15}$/, "Mobile number must be 1-15 digits")
              .optional(),
            full: Yup.string(),
          }),
          graduation: Yup.string().required("Certificate is required"),
          specialization: Yup.string().required("Specilization is required"),
          mrn: Yup.string()
            .matches(/^[a-zA-Z0-9]+$/, "MRN must be alphanumeric")
            .min(8, "MRN must be at least 8 characters")
            .max(10, "MRN must be at most 10 characters")
            .required("MRN is required"),
          regCounsil: Yup.string().required("Regisration Counsil is required"),
          regYear: Yup.string().required("Registration Year is required"),
          experience: Yup.string().required("Experience is required"),
        })}
        onSubmit={(values) => {
          if (values.secondaryPhone.number && values.primaryPhone.number === values.secondaryPhone.number) {
            showToast("Primary and Secondary mobile numbers cannot be the same", "error");
            return;
          }
          onNext(values);
        }}
      >
        {(formik) => (
          <Form className="grid grid-cols-1 md:grid-cols-3 gap-x-6 ">
            <div className=" row-span-1 md:row-span-2">
              <ProfileImageInput label="" name="image" />
            </div>
            <FormInput label={t("label.fullName")} name="fullName" regex={/^[a-zA-Z\s]*$/} required />
            <SearchableSelect label={t("label.gender")} name="gender" options={GenderOptions} required />
            <FormDateInput
              label={t("label.dob")}
              name="dateOfBirth"
              required
              showAge
              maxdate={new Date().toISOString().split("T")[0]}
              mindate={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split("T")[0]}
            />
            <FormInput label={t("label.email")} name="email" required disabled />
            <FormPhoneInput label={t("label.primaryPhone")} name="primaryPhone" required validationType="primary" />
            <FormPhoneInput label={t("label.secondaryPhone")} name="secondaryPhone" validationType="secondary" />
            <SearchableSelect
              label={t("label.graduation")}
              name="graduation"
              options={MedicalGraduateOptions}
              required
            />
            <SearchableSelect
              label={t("label.specializat")}
              name="specialization"
              options={SpecializationCategories}
              required
              disabled={isCompleted}
            />
            <FormInput label={t("label.mrn")} name="mrn" required />
            <SearchableSelect
              label={t("label.regCounsil")}
              name="regCounsil"
              options={RegistrationCouncilOptions}
              required
            />
            <SearchableSelect label={t("label.regYear")} name="regYear" options={YearOptions} required />
            <SearchableSelect label={t("label.exp")} name="experience" options={ExperienceOptions} required />

            {!isSetting && (
              <div className="w-full flex items-center justify-end mt-[5%] col-span-1 md:col-span-3 ">
                <FooterButton onNext={formik.handleSubmit} onBack={onBack} hasBack />
              </div>
            )}
            {isSetting && (
              <div className="col-span-1 md:col-span-3 flex justify-end mt-10">
                <Button label={t("label.save")} type="submit" onClick={formik.handleSubmit} disable={!formik.dirty} />
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
};
