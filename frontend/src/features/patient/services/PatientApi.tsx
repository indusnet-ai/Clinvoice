import { baseApi } from "@/app/baseApi";

export const patientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatientList: builder.query<any, { limit: number; page: number; search?: string }>({
      query: ({ limit, page, search }) => ({
        service: "backend",
        method: "GET",
        url: `/patient/fetch`,
        params: {
          limit: limit,
          page: page,
          ...(search && { search }),
        },
      }),
      providesTags: ["Patient"],
    }),
    postPatient: builder.mutation({
      query: (data) => ({
        service: "backend",
        method: "POST",
        url: `/patient/create`,
        body: data,
      }),
      invalidatesTags: ["Patient"],
    }),
    deletePatient: builder.mutation<any, { id: number }>({
      query: ({ id }) => ({
        service: "backend",
        method: "DELETE",
        url: `/patient/delete/${id}`,
      }),
      invalidatesTags: ["Patient"],
    }),
    patchPatient: builder.mutation<any, { patientid: number; data }>({
      query: ({ patientid, data }) => ({
        service: "backend",
        method: "PATCH",
        url: `/patient/update/${patientid}`,
        body: data,
      }),
      invalidatesTags: ["Patient"],
    }),
  }),
});

export const { useGetPatientListQuery, usePostPatientMutation, useDeletePatientMutation, usePatchPatientMutation } =
  patientApi;
