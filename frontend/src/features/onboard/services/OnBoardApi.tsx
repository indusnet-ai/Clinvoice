import { baseApi } from "@/app/baseApi";

type AbhaStateCodePayload = {
  stateCode?: number;
};

type AbhaStateCodeItem = {
  state_name?: string;
  state_code?: number | string;
  name?: string;
  code?: number | string;
};

type AbhaDistrictCodePayload = {
  stateCode: number;
};

type AbhaDistrictCodeItem = {
  district_name?: string;
  district_code?: number | string;
  name?: string;
  code?: number | string;
};

export const onboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    postHospitalInfo: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/hospital/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["hospital"],
    }),
    patchHospitalInfo: builder.mutation({
      query: ({ hospitalId, ...data }) => ({
        service: "backend",
        url: `/hospital/update/${hospitalId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["hospital"],
    }),
    getHospitalInfo: builder.query<any, { limit: number; page: number; search?: string }>({
      query: ({ limit, page, search }) => ({
        service: "backend",
        url: `/hospital/get`,
        method: "GET",
        params: {
          limit,
          page,
          ...(search && { search }),
        },
      }),
      providesTags: ["hospital"],
    }),
    postDoctorInfo: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/doctor",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["doctor"],
    }),
    patchDoctorInfo: builder.mutation({
      query: ({ doctorId, ...data }) => ({
        service: "backend",
        url: `/doctor/${doctorId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["doctor"],
    }),
    getDoctorInfo: builder.query<any, { limit: number; page: number; search?: string }>({
      query: ({ limit, page, search }) => ({
        service: "backend",
        url: `/doctor`,
        method: "GET",
        params: {
          limit,
          page,
          ...(search && { search }),
        },
      }),
      providesTags: ["doctor"],
    }),
    // Additional endpoints can be added here
    postVoiceAddress: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/user/add-voice",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["voice"],
    }),
    postSignature: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/user/add-signature",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["sign"],
    }),
    getVoiceAddress: builder.query<any, { userId: number }>({
      query: ({ userId }) => ({
        service: "backend",
        url: `/user/get-voice-address/${userId}`,
        method: "GET",
      }),
      providesTags: ["voice"],
    }),
    getSignature: builder.query<any, { userId: number }>({
      query: ({ userId }) => ({
        service: "backend",
        url: `/user/get-signature/${userId}`,
        method: "GET",
      }),
      providesTags: ["sign"],
    }),

    postAbhaStateCode: builder.mutation<AbhaStateCodeItem[], AbhaStateCodePayload | void>({
      query: (payload) => ({
        service: "abha",
        url: "/abha_state_code",
        method: "POST",
        body: payload ?? {},
      }),
    }),
    postAbhaDistrictCode: builder.mutation<AbhaDistrictCodeItem[], AbhaDistrictCodePayload>({
      query: ({ stateCode }) => ({
        service: "abha",
        url: "/abha_district_code",
        method: "POST",
        params: { stateCode },
        body: { stateCode },
      }),
    }),
  }),
});

export const {
  usePostHospitalInfoMutation,
  usePatchHospitalInfoMutation,
  useGetHospitalInfoQuery,
  usePostDoctorInfoMutation,
  usePatchDoctorInfoMutation,
  useGetDoctorInfoQuery,
  usePostVoiceAddressMutation,
  usePostSignatureMutation,
  useGetSignatureQuery,
  useGetVoiceAddressQuery,
  usePostAbhaStateCodeMutation,
  usePostAbhaDistrictCodeMutation,
} = onboardApi;
