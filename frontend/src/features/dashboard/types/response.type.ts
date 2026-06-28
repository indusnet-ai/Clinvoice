export interface OpdData {
  id: number;
  user_id: number;
  hospital_id: number;
  patient_id: number;
  patient_name: string;
  date: string;
  time: string;
  priority: string;
  specialist: string;
  doctor_id: number;
  doctor_name: string;
  amount: string;
  message: string;
  opd_status: string;
  source: string;
  slot_id: number;
  slot_start_time: string;
  slot_end_time: string;
  live_consult: string;
  cancellation_reason: string;
  opd_status_id: string;
  is_token_verified: boolean;
  is_consultation_closed: boolean;
  module: string;
  clinvoice_transaction_id: string;
  updated_at: string;
  created_at: string;
  status: string;
  token: string;
  gender: string;
  patient_salutation: string;
  doctor_email: string;
  patient_age: string;
  doctor_mobile: string;
  patient_email: string;
  patient_mobile: string;
  patient_image: string;
}

export interface DashboardStats {
  total_today: number;
  total_change_percent: number;
  pending_today: number;
  pending_today_percent: number;
  pending_change_percent: number;
  in_progress_today: number;
  in_progress_today_percent: number;
  in_progress_change_percent: number;
  completed_today: number;
  completed_today_percent: number;
  completed_change_percent: number;
  paused_today: number;
  paused_today_percent: number;
  paused_change_percent: number;
}

export interface VisitHistory {
  id: number;
  patient_name: string;
  date: number;
  time: number;
  priority: string;
  specialist: string;
  doctor_name: string;
  amount: null;
  message: null;
  opd_status: string;
  source: string;
  slot_start_time: number;
  slot_end_time: number;
  live_consult: string;
  cancellation_reason: null;
  opd_status_id: string;
  is_token_verified: false;
  is_consultation_closed: false;
  module: string;
  clinvoice_transaction_id: null;
  updated_at: string;
  created_at: string;
  status: string;
}
export interface ProfileData {
  id: number;
  user_id: number;
  image: string;
  hospital_id: number;
  salutation: string;
  patient_name: string;
  gender: string;
  dob: string;
  blood_group: string;
  mobile_no: string;
  email: string;
  updated_at: string;
  created_at: string;
  status: string;
  age: string;
  address: string;
}


export interface DentalFormikValues {
  chiefComplaints: string;
  extraoralExamination: string;
  oralHygiene: string;
  gingivalHealth: string;
  cariesStatus: string;
  clinicalNotes: string;

  upperTeeth: Record<number, string>;
  lowerTeeth: Record<number, string>;

  upperChildrenTeeth: Record<number, string>;
  lowerChildrenTeeth: Record<number, string>;

  attrition: string;
  abrasion: string;
  erosion: string;
  stains: string;

  investigations: any[];
  medication: any[];

  followup: {
    day: { value: string; unit: string };
    followdate: string;
    followremark: string;
  };
}


