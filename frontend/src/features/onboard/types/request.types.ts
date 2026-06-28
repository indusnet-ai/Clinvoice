// types/hospital.form.ts
export interface HospitalForm {
  hospitalName: string;
  hospitalLogo: string;
  hospitalType: number;
  yearOfEsta: string;
  email: string;
  primaryPhone: {
    dialCode: string;
    number: string;
    full: string;
  };
  secondaryPhone: {
    dialCode: string;
    number: string;
    full: string;
  };
  licenseNumber: string;
  certificate: string;
  url: string;
  address: string;
  country: string;
  state: string;
  district: string;
  pincode: string;
}

export interface DoctorForm {
  image: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  primaryPhone: {
    dialCode: string;
    number: string;
    full: string;
  };
  secondaryPhone: {
    dialCode: string;
    number: string;
    full: string;
  };
  graduation: string;
  specialization: string;
  mrn: string;
  regCounsil: string;
  regYear: string;
  experience: string;
}
