import { baseApi } from "@/app/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        service: "backend", // pick service
        url: "/user/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    signup: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/user/signup",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    forgotPassword: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/user/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        service: "backend",
        url: "/user/reset-password",
        method: "Post",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
