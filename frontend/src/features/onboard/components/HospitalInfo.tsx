import React from "react";
import { Form, Formik, useFormikContext } from "formik";
import * as Yup from "yup";
import FooterButton from "./FooterButton";
import { Button, FileInput, FormDateInput, FormInput, SearchableSelect } from "@/atoms";
import { FormPhoneInput } from "@/components";
import { HospitalMapper } from "../utils/mapHospitalPayload";
import { HospitalForm } from "../types/request.types";
import { HospitalTypeOptions, CountryOptions } from "@/data/dropdown.js";
import { showToast } from "@/utils";
import { useLanguage } from "@/language/context/LanguageContext";
import { usePostAbhaDistrictCodeMutation, usePostAbhaStateCodeMutation } from "../services/OnBoardApi";

interface HosptialInfoProps {
  onNext: (data: HospitalForm) => void;
  hospitalData: HospitalForm | null;
  isSetting?: boolean;
}

type SelectOption = {
  label: string;
  value: string;
};

interface DistrictOptionsLoaderProps {
  stateCodeByLabel: Record<string, string>;
  postAbhaDistrictCode: (payload: { stateCode: number }) => any;
  setDistrictOptions: React.Dispatch<React.SetStateAction<SelectOption[]>>;
  setDistrictLabelByCode: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const DistrictOptionsLoader: React.FC<DistrictOptionsLoaderProps> = ({
  stateCodeByLabel,
  postAbhaDistrictCode,
  setDistrictOptions,
  setDistrictLabelByCode,
}) => {
  const { values, setFieldValue } = useFormikContext<HospitalForm>();
  const previousStateRef = React.useRef(values.state);

  React.useEffect(() => {
    let isMounted = true;

    const loadDistricts = async () => {
      const selectedState = values.state;
      const previousState = previousStateRef.current;
      const stateCode = stateCodeByLabel[selectedState] || (/^\d+$/.test(String(selectedState)) ? String(selectedState) : "");

      if (!selectedState || !stateCode) {
        if (isMounted) {
          setDistrictOptions([]);
          setDistrictLabelByCode({});
          if (previousState && previousState !== selectedState) {
            setFieldValue("district", "");
          }
        }
        previousStateRef.current = selectedState;
        return;
      }

      try {
        const districts = await postAbhaDistrictCode({ stateCode: Number(stateCode) }).unwrap();
        const districtList = Array.isArray(districts?.data) ? districts.data : Array.isArray(districts) ? districts : [];
        const nextDistrictLabelByCode: Record<string, string> = {};

        const options = districtList
          .map((district) => {
            const label = district?.district_name ?? district?.name ?? "";
            const districtCode = district?.district_code ?? district?.code;
            if (!label || districtCode === undefined || districtCode === null) return null;

            nextDistrictLabelByCode[String(districtCode)] = label;

            // Keep form value as label because payload should send label.
            return { label, value: label };
          })
          .filter(Boolean) as SelectOption[];

        if (isMounted) {
          setDistrictOptions(options);
          setDistrictLabelByCode(nextDistrictLabelByCode);
          if (previousState && previousState !== selectedState) {
            setFieldValue("district", "");
          }
        }
      } catch (error) {
        console.error("Failed to load ABHA district options", error);
        if (isMounted) {
          setDistrictOptions([]);
          setDistrictLabelByCode({});
          if (previousState && previousState !== selectedState) {
            setFieldValue("district", "");
          }
        }
      } finally {
        previousStateRef.current = selectedState;
      }
    };

    loadDistricts();

    return () => {
      isMounted = false;
    };
  }, [values.state, stateCodeByLabel, postAbhaDistrictCode, setFieldValue, setDistrictOptions, setDistrictLabelByCode]);

  return null;
};

export const HospitalInfo: React.FC<HosptialInfoProps> = ({ onNext, hospitalData, isSetting = false }) => {
  const [stateOptions, setStateOptions] = React.useState<SelectOption[]>([]);
  const [districtOptions, setDistrictOptions] = React.useState<SelectOption[]>([]);
  const [stateCodeByLabel, setStateCodeByLabel] = React.useState<Record<string, string>>({});
  const [stateLabelByCode, setStateLabelByCode] = React.useState<Record<string, string>>({});
  const [districtLabelByCode, setDistrictLabelByCode] = React.useState<Record<string, string>>({});
  const [postAbhaStateCode] = usePostAbhaStateCodeMutation();
  const [postAbhaDistrictCode, { isLoading: isDistrictLoading }] = usePostAbhaDistrictCodeMutation();
  const { t } = useLanguage();

  React.useEffect(() => {
    let isMounted = true;

    const loadStateOptions = async () => {
      try {
        const states = await postAbhaStateCode().unwrap();
        const stateList = Array.isArray(states?.data) ? states.data : Array.isArray(states) ? states : [];
        const nextStateCodeByLabel: Record<string, string> = {};
        const nextStateLabelByCode: Record<string, string> = {};

        const options = stateList
          .map((state) => {
            const label = state?.state_name ?? state?.name ?? "";
            const stateCode = state?.state_code ?? state?.code;
            if (!label || stateCode === undefined || stateCode === null) return null;

            const code = String(stateCode);
            nextStateCodeByLabel[label] = code;
            nextStateLabelByCode[code] = label;

            // Keep form value as label because payload should send label.
            return { label, value: label };
          })
          .filter(Boolean) as SelectOption[];

        if (isMounted) {
          setStateOptions(options);
          setStateCodeByLabel(nextStateCodeByLabel);
          setStateLabelByCode(nextStateLabelByCode);
        }
      } catch (error) {
        console.error("Failed to load ABHA state options", error);
        if (isMounted) {
          setStateOptions([]);
          setStateCodeByLabel({});
          setStateLabelByCode({});
        }
      }
    };

    loadStateOptions();

    return () => {
      isMounted = false;
    };
  }, [postAbhaStateCode]);

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={hospitalData ?? HospitalMapper.toForm(null)}
        validationSchema={Yup.object({
          hospitalName: Yup.string()
            .min(2, "Hospital Name Min 2 Characters")
            .max(100, "Hospital Name Max 100 Characters")
            .matches(/^[a-zA-Z\s]*$/, "Name can only contain alphabets")
            .required("Name is required"),
          hospitalLogo: Yup.string().optional(),
          hospitalType: Yup.number()
            .typeError("Hospital Type is required")
            .required("Hospital Type is required")
            .moreThan(0, "Hospital Type is required"),
          yearOfEsta: Yup.string()
            .required("Year of Establishment is required")
            .test("valid-year", "Future year is not allowed", function (value) {
              if (!value) return false;

              const year = Number(value.split("-")[0]); // YYYY from YYYY-MM-DD
              const currentYear = new Date().getFullYear();

              if (isNaN(year)) return false;

              return year <= currentYear;
            }),
          email: Yup.string()
            .email()
            .trim()
            .required("Email is required")
            .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"),
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
          licenseNumber: Yup.string()
            .matches(/^[a-zA-Z0-9]+$/, "License number must be alphanumeric")
            .min(3, "License number must be at least 3 characters")
            .max(15, "License number must be at most 15 characters")
            .required("License Number is required"),
          certificate: Yup.string().optional(),
          url: Yup.string().required("URL is required"),
          address: Yup.string()
            .min(10, "Address must be at least 10 characters")
            .max(400, "Address must be less than 400 characters")
            .required("Address is required"),
          country: Yup.string().required("Country is required"),
          state: Yup.string().required("State is required"),
          district: Yup.string().required("District is required"),
          pincode: Yup.string()
            .matches(/^\d{6}$/, "Pincode must be exactly 6 digits")
            .required("Pincode is required"),
        })}
        onSubmit={(values) => {
          if (values.secondaryPhone.number && values.primaryPhone.number === values.secondaryPhone.number) {
            showToast("Primary and Secondary mobile numbers cannot be the same", "error");
            return;
          }
          const payloadValues: HospitalForm = {
            ...values,
            state: stateLabelByCode[String(values.state)] ?? values.state,
            district: districtLabelByCode[String(values.district)] ?? values.district,
          };

          onNext(payloadValues);
        }}
      >
        {(formik) => {
          return (
            <Form className="grid grid-cols-1 md:grid-cols-3 gap-x-6 ">
              <DistrictOptionsLoader
                stateCodeByLabel={stateCodeByLabel}
                postAbhaDistrictCode={postAbhaDistrictCode}
                setDistrictOptions={setDistrictOptions}
                setDistrictLabelByCode={setDistrictLabelByCode}
              />
              <FormInput label={t("label.hospitalName")} name="hospitalName" regex={/^[a-zA-Z\s]*$/} required />
              <FileInput
                label={t("label.hospitalLogo")}
                name="hospitalLogo"
                allowedTypes={["image/jpeg", "image/png", ".jpg", ".jpeg", ".png"]}
              />
              <SearchableSelect
                label={t("label.hospitalType")}
                name="hospitalType"
                options={HospitalTypeOptions}
                required
              />
              <FormDateInput label={t("label.yoe")} name="yearOfEsta" required />
              <FormInput label={t("label.email")} name="email" required />
              <FormPhoneInput label={t("label.primaryPhone")} name="primaryPhone" required validationType="primary" />
              <FormPhoneInput label={t("label.secondaryPhone")} name="secondaryPhone" validationType="secondary" />
              <FormInput label={t("label.hospitalLicenseNum")} name="licenseNumber" required />
              <FileInput
                label={t("label.hospitalCertific")}
                name="certificate"
                allowedTypes={["image/jpeg", "image/png", ".jpg", ".jpeg", ".png", ".pdf"]}
              />
              <FormInput label={t("label.websiteUrl")} name="url" required />
              <FormInput label={t("label.address")} name="address" required />
              <SearchableSelect label={t("label.country")} name="country" options={CountryOptions} required />
              <SearchableSelect label={t("label.state")} name="state" options={stateOptions} required />
              <SearchableSelect
                label={t("label.district")}
                name="district"
                options={districtOptions}
                required
                disabled={!formik.values.state || isDistrictLoading}
              />
              <FormInput label={t("label.pinCode")} name="pincode" required />
              {!isSetting && (
                <div className="w-full flex items-center justify-end mt-[5%] col-span-1 md:col-span-3 ">
                  <FooterButton onNext={formik.handleSubmit} />
                </div>
              )}
              {isSetting && (
                <div className="col-span-1 md:col-span-3 flex justify-end mt-10">
                  <Button label={t("label.save")} type="submit" disable={!formik.dirty} />
                </div>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};
