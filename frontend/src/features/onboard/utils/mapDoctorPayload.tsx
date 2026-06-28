// mappers/hospital.mapper.ts

import { toDateInputValue, toUtcDate } from "@/utils";
import { Doctor } from "../types";
import { DoctorForm } from "../types/request.types";

export const DoctorMapper = {
  /** API → Form */
  toForm(api?: Doctor | null): DoctorForm {
    return {
      image: api?.image,
      fullName: api?.name ?? "",
      gender: api?.gender ?? "",
      dateOfBirth: toDateInputValue(api?.dob) ?? "",
      email: api?.email ?? "",
      primaryPhone: {
        dialCode: api?.primary_mobile_no_country_code ?? "",
        number: api?.primary_mobile_no ?? "",
        full: `${api?.primary_mobile_no_country_code ?? ""}${api?.primary_mobile_no ?? ""}`,
      },
      secondaryPhone: {
        dialCode: api?.secondary_mobile_no_country_code ?? "",
        number: api?.secondary_mobile_no ?? "",
        full: `${api?.secondary_mobile_no_country_code ?? ""}${api?.secondary_mobile_no ?? ""}`,
      },
      graduation: api?.graduation ?? "",
      specialization: api?.specialisation ?? "",
      mrn: api?.mrn ?? "",
      regCounsil: api?.registration_council ?? "",
      regYear: api?.registration_at ?? "",
      experience: api?.experience ?? "",
    };
  },

  /** Form → API */
  toApi(form: DoctorForm, userId: number, hospitalId: number): Doctor {
    return {
      image: form.image,
      name: form.fullName,
      gender: form.gender,
      dob: toUtcDate(form.dateOfBirth),
      email: form.email,
      primary_mobile_no_country_code: form.primaryPhone.dialCode,
      primary_mobile_no: form.primaryPhone.number,
      secondary_mobile_no_country_code: form.secondaryPhone.dialCode,
      secondary_mobile_no: form.secondaryPhone.number,
      graduation: form.graduation,
      specialisation: form.specialization,
      mrn: form.mrn,
      registration_council: form.regCounsil,
      registration_at: String(form.regYear),
      experience: form.experience,
      user_id: userId,
      hospital_id: hospitalId,
    };
  },
};
