import { baseApi } from "@/app/baseApi";

type TransScriptPrams = {
  transcript_id?: string;
};
export const consultApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadAudio: builder.mutation<any, FormData>({
      query: (formData) => ({
        service: "clinvoice",
        url: "/upload_audio",
        method: "POST",
        body: formData,
      }),
    }),
    gettransScript: builder.query<any, TransScriptPrams>({
      query: ({ transcript_id }) => ({
        service: "clinvoice",
        url: "/transcript",
        method: "GET",
        params: { transcript_id },
      }),
    }),
    getSoapNotes: builder.query<any, TransScriptPrams>({
      query: ({ transcript_id }) => ({
        service: "clinvoice",
        url: "/SOAP_notes",
        method: "GET",
        params: { transcript_id },
      }),
    }),
    getMedicalReport: builder.query<any, TransScriptPrams>({
      query: ({ transcript_id }) => ({
        service: "clinvoice",
        url: `/v1/medical_report`,
        method: "GET",
        params: { transcript_id },
      }),
    }),
    getDentalReport: builder.query<any, TransScriptPrams>({
      query: ({ transcript_id }) => ({
        service: "clinvoice",
        url: `/v1.1/dental_medical_report`,
        method: "GET",
        params: { transcript_id },
      }),
    }),
    getVisitHistory: builder.query({
      query: ({ patientId }) => ({
        service: "backend",
        url: `/opd/visit-history/${patientId}`,
        method: "GET",
      }),
      providesTags: ["Appointment"],
    }),
    getPatientByMobile: builder.query<any, { mobile_no: string }>({
      query: ({ mobile_no }) => ({
        service: "backend",
        url: "/patient/fetch-using-mobile",
        method: "GET",
        params: { mobile_no },
      }),
    }),
    postOpdCaseSheet: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/opd-case-sheet",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["opd"],
    }),
    patchOpdCaseSheet: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: `/opd-case-sheet/update`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["opd"],
    }),
    getOpdCaseSheet: builder.query({
      query: ({ opd_id }) => ({
        service: "backend",
        url: `/opd-case-sheet/${opd_id}`,
        method: "GET",
      }),
      providesTags: ["opd"],
    }),
    getPatientProfile: builder.query<any, { patient_id: number }>({
      query: ({ patient_id }) => ({
        service: "backend",
        url: `/patient/getOne/${patient_id}`,
        method: "GET",
      }),
    }),
    updateClinVoiceTrans: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: `/opd/update-clinvoice-transaction`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useUploadAudioMutation,
  useGettransScriptQuery,
  useLazyGettransScriptQuery,
  useGetSoapNotesQuery,
  useLazyGetSoapNotesQuery,
  useLazyGetMedicalReportQuery,
  useLazyGetDentalReportQuery,
  useGetVisitHistoryQuery,
  useGetPatientByMobileQuery, // const {data} = useGetPatientByMobileQuery({ mobile: string });
  useLazyGetPatientByMobileQuery, // const [getPatientByMobile] = useLazyGetPatientByMobileQuery();  // const data = await getPatientByMobile({ mobile: string})
  usePostOpdCaseSheetMutation,
  usePatchOpdCaseSheetMutation,
  useGetOpdCaseSheetQuery,
  useGetPatientProfileQuery,
  useLazyGetPatientProfileQuery,
  useUpdateClinVoiceTransMutation,
} = consultApi;
