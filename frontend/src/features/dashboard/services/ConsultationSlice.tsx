import { parseTranscript } from "@/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  transId: "",
  notes: null,
  message: [],
  soapnote: null,
};

export const consultSlice = createSlice({
  name: "consult",
  initialState,
  reducers: {
    setTransId(state, action) {
      state.transId = action.payload;
    },
    clearTransId(state) {
      state.transId = null;
    },
    setNotes(state, action: PayloadAction<string>) {
      state.notes = action.payload;
      state.message = parseTranscript(action.payload);
    },
    clearNotes(state) {
      state.notes = null;
    },
    setSoapNote(state, action: PayloadAction<string>) {
      state.soapnote = action.payload;
    },
    clearSoapNote(state) {
      state.soapnote = null;
    },
  },
});

export const { setNotes, setSoapNote, clearNotes, clearSoapNote, setTransId, clearTransId } = consultSlice.actions;
export default consultSlice.reducer;
