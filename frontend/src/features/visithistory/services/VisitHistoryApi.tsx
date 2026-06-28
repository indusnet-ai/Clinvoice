import { baseApi } from "@/app/baseApi";

export const visitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOneOPd: builder.query({
      query: ({ opd_id }) => ({
        service: "backend",
        method: "GET",
        url: `/opd/getOne/${opd_id}`,
      }),
    }),
  }),
});

export const { useGetOneOPdQuery } = visitApi;
