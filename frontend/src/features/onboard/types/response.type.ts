// types/hospital.ts
export interface Hospital {
  id?: number;

  name: string;
  logo: string;
  type: number;
  year_of_establishment: string;

  email: string;

  primary_mobile_no_country_code: string;
  primary_mobile_no: string;

  secondary_mobile_no_country_code: string;
  secondary_mobile_no: string;

  licence_number: string;
  certificate: string;

  website_url: string;
  address: string;

  country: string;
  state: string;
  district: string;
  pincode: string;

  user_id?: number;
}

export interface Doctor {
  image: string;
  user_id: number;
  hospital_id?: number;
  graduation: string;
  specialisation: string;
  name: string;
  gender: string;
  dob: string;
  email: string;
  primary_mobile_no_country_code: string;
  primary_mobile_no: string;
  secondary_mobile_no_country_code: string;
  secondary_mobile_no: string;
  mrn: string;
  registration_council: string;
  registration_at: string;
  experience: string;
}
