import { baseApi } from "@/app/baseApi";

type SlotParams = {
  doctor_id: number;
  hospital_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  duration: string;
};
export const settingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    postSlotInfo: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/doctor-slot",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["slots"],
    }),
    getSlotInfo: builder.query<any, { hospitalId: number; doctorId: number }>({
      query: ({ hospitalId, doctorId }) => ({
        service: "backend",
        url: `/doctor-slot?hospital_id=${hospitalId}&doctor_id=${doctorId}&limit=100&page=1`,
        method: "GET",
      }),
      providesTags: ["slots"],
    }),
    patchSlotInfo: builder.mutation<any, SlotParams>({
      query: ({ doctor_id, hospital_id, user_id, start_time, end_time, duration }) => ({
        service: "backend",
        url: `/doctor-slot/update-slots/update-time-for-all-slots`,
        method: "PATCH",
        params: {
          doctor_id: doctor_id,
          hospital_id: hospital_id,
          user_id: user_id,
          start_time: start_time,
          end_time: end_time,
          duration: duration,
        },
      }),
      invalidatesTags: ["slots"],
    }),
    // Additional endpoints can be added here
    deleteSlot: builder.mutation({
      query: ({ doctor_slot_id }) => ({
        service: "backend",
        url: `/doctor-slot/${doctor_slot_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["slots"],
    }),
  }),
});

export const { useGetSlotInfoQuery, usePostSlotInfoMutation, usePatchSlotInfoMutation, useDeleteSlotMutation } =
  settingApi;
