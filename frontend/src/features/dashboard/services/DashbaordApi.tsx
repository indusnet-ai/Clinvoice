import { baseApi } from "@/app/baseApi";

type OPDParams = {
  hospitalId: number;
  page?: number;
  limit?: number;
  search?: string;
  filter_by_status?: string;
  from_date?: string;
  to_date?: string;
  gender_filter?: string;
};

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOPDList: builder.query<any, OPDParams>({
      query: ({
        hospitalId,
        page = 1,
        limit = 100,
        search,
        filter_by_status,
        from_date,
        to_date,
        gender_filter,
      }) => ({
        service: "backend",
        url: "/opd",
        method: "GET",
        params: {
          hospital_id: hospitalId,
          page,
          limit,
          ...(search && { search }),
          ...(filter_by_status && { filter_by_status }),
          ...(from_date && { from_date }),
          ...(to_date && {
            to_date: to_date.length === 10 ? `${to_date}T23:59:59` : to_date,
          }),
          ...(gender_filter && { gender_filter }),
        },
      }),
      providesTags: ["Appointment"],
    }),

    postOPDdata: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/opd",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Appointment"],
    }),

    getDashboardStats: builder.query({
      query: () => ({
        service: "backend",
        url: `/opd/dashboard/data`,
        method: "GET",
      }),
      providesTags: ["Appointment"],
      // Force refetch on mount and after cache invalidation
      keepUnusedDataFor: 0,
    }),

    patchOpdStatus: builder.mutation({
      query: ({ opd_id, status }) => ({
        service: "backend",
        method: "PATCH",
        url: `/opd/${opd_id}?status=${status}`,
      }),
      invalidatesTags: ["Appointment"],
    }),
  }),
});

export const {
  useGetOPDListQuery,
  useLazyGetOPDListQuery,
  usePostOPDdataMutation,
  useGetDashboardStatsQuery,
  usePatchOpdStatusMutation,
} = dashboardApi;
