// mappers/hospital.mapper.ts

import { Hospital } from "../types";
import { HospitalForm } from "../types/request.types";

export const HospitalMapper = {
  /** API → Form */
  toForm(api?: Hospital | null): HospitalForm {
    return {
      hospitalName: api?.name ?? "",
      hospitalLogo: api?.logo ?? "",
      hospitalType: api?.type ?? 0,
      yearOfEsta: api?.year_of_establishment?.split("T")[0] ?? "",

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

      licenseNumber: api?.licence_number ?? "",
      certificate: api?.certificate ?? "",

      url: api?.website_url ?? "",
      address: api?.address ?? "",

      country: api?.country ?? "",
      state: api?.state ?? "",
      district: api?.district ?? "",
      pincode: api?.pincode ?? "",
    };
  },

  /** Form → API */
  toApi(form: HospitalForm, userId: number): Hospital {
    return {
      name: form.hospitalName,
      logo: form.hospitalLogo,
      type: Number(form.hospitalType),
      year_of_establishment: form.yearOfEsta,

      email: form.email,

      primary_mobile_no_country_code: form.primaryPhone.dialCode,
      primary_mobile_no: form.primaryPhone.number,

      secondary_mobile_no_country_code: form.secondaryPhone.dialCode,
      secondary_mobile_no: form.secondaryPhone.number,

      licence_number: form.licenseNumber,
      certificate: form.certificate,

      website_url: form.url,
      address: form.address,

      country: form.country,
      state: form.state,
      district: form.district,
      pincode: form.pincode,

      user_id: userId,
    };
  },
};
