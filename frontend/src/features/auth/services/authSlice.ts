import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type OnboardStatus = {
  voice_address_completed: boolean;
  signature_completed: boolean;
  hospital_profile_completed: boolean;
  doctor_profile_completed: boolean;
};

type Doctor = {
  doctor_name: string | null;
  doctor_email: string | null;
  spec: string | null;
};

type AuthState = {
  user_id: number | null;
  hospital_id: number | null;
  doctor_id: number | null;
  access_token: string | null;
  onboard: OnboardStatus;
  doctor: Doctor | null;
  forceChangePassword: boolean;
  username: string | null;
};
const storedUserId = localStorage.getItem("user_id");
const storedOnboard = JSON.parse(localStorage.getItem("onboard") || "null");
const storedForceChange = localStorage.getItem("forceChangePassword") === "true";
const storedUsername = localStorage.getItem("userName") || null;

const initialState: AuthState = {
  user_id: storedUserId ? Number(storedUserId) : null,
  hospital_id: null,
  doctor_id: null,
  access_token: null,
  onboard: storedOnboard ?? {
    voice_address_completed: false,
    signature_completed: false,
    hospital_profile_completed: false,
    doctor_profile_completed: false,
  },
  doctor: null,
  forceChangePassword: storedForceChange || false,
  username: storedUsername,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    //Login response (single source of truth)
    hydrateAuthFromLogin(state, action: PayloadAction<AuthState>) {
      return {
        ...state,
        ...action.payload,
        onboard: action.payload.onboard ?? state.onboard,
      };
    },

    //IDs
    setHospitalId(state, action: PayloadAction<number>) {
      state.hospital_id = action.payload;
    },
    setDoctorId(state, action: PayloadAction<number>) {
      state.doctor_id = action.payload;
    },

    //Doctor profile
    updateDoctor(state, action: PayloadAction<Doctor>) {
      state.doctor = action.payload;
    },

    //Onboarding flags (SAFE merge)
    updateOnboardStatus(state, action: PayloadAction<Partial<OnboardStatus>>) {
      state.onboard = {
        ...state.onboard,
        ...action.payload,
      };
      localStorage.setItem("onboard", JSON.stringify(state.onboard));
    },
    //for change password force flow
    setForceChangePassword(state, action: PayloadAction<boolean>) {
      state.forceChangePassword = action.payload;
    },
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },

    //Logout
    logout() {
      localStorage.clear();
      return initialState;
    },
  },
});

export const {
  hydrateAuthFromLogin,
  setDoctorId,
  setHospitalId,
  updateDoctor,
  updateOnboardStatus,
  logout,
  setForceChangePassword,
  setUsername,
} = authSlice.actions;
export default authSlice.reducer;
