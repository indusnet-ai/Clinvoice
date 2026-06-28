export type PhoneValue = {
  dialCode: string;
  number: string;
  full: string;
};

export interface FormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  textarea: string;
  select: string;
  checkbox: string;
  file: string;
  phonenumber: PhoneValue;
  date: string;
  dob: Date;
}
