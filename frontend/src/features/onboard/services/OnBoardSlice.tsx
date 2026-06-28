import { useAppSelector } from "@/app/hook";
import { createSlice } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

const initialState = {
  hospitalId: localStorage.getItem("hospital_id"),
  doctorId: localStorage.getItem("doctor_id"),
  activeStep: 1,
};

export const onboardSlice = createSlice({
  name: "onboard",
  initialState,
  reducers: {
    setHospitalId(state, action) {
      state.hospitalId = action.payload;
    },
    setDoctorId(state, action) {
      state.doctorId = action.payload;
    },
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
      localStorage.setItem("onboard_step", action.payload.toString());
    },
    restoreActiveStep: (state) => {
      const saved = localStorage.getItem("onboard_step");
      state.activeStep = saved ? Number(saved) : 1;
    },
  },
});

export const { setHospitalId, setDoctorId, setActiveStep, restoreActiveStep } = onboardSlice.actions;
export default onboardSlice.reducer;
