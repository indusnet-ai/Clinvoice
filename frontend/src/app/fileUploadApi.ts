import { baseApi } from "./baseApi";

interface UploadResponse {
  status: number;
  message: string;
  data: string;
}

export const fileUploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<UploadResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          service: "backend",
          url: "/file/upload",
          method: "POST",
          body: formData,
        };
      },
    }),
    downloadFile: builder.mutation({
      query: (filePath: string) => ({
        service: "backend",
        url: `/file/download`,
        method: "POST",
        body: { value: filePath },
      }),
    }),
  }),
});

export const { useUploadFileMutation, useDownloadFileMutation } = fileUploadApi;
