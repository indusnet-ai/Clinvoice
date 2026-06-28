import { createSlice } from "@reduxjs/toolkit";

const initialState = {};

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    doctor_id: localStorage.getItem("doctor_id") || null,
  },
  reducers: {
    setDoctorId(state, action) {
      state.doctor_id = action.payload;
    },
  },
});

export const { setDoctorId } = dashboardSlice.actions;
export default dashboardSlice.reducer;
