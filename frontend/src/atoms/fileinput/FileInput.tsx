// components/form/FileInput.tsx
import React, { useRef } from "react";
import { useField } from "formik";
import { FileInputIcon } from "@/assets/icons";
import { useUploadFileMutation } from "@/app/fileUploadApi";
import { showToast } from "@/utils";

interface Props {
  label: string;
  name: string;
  required?: boolean;
  accept?: string; // e.g. "application/pdf,image/*"
  allowedTypes?: string[];
}

const isValidFileType = (file: File, allowedTypes: string[]) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  return allowedTypes.some((type) => {
    // mime type match
    if (type.includes("/")) {
      return fileType === type;
    }

    // extension match
    return fileName.endsWith(type);
  });
};

export const FileInput = ({ label, required = false, accept = "*", ...props }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [field, meta, helpers] = useField(props.name);

  //api call
  const [uploadFile, { isLoading }] = useUploadFileMutation();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (props.allowedTypes && !isValidFileType(file, props.allowedTypes)) {
      helpers.setError("Invalid file type");
      showToast("Invalid File Type", "error");
      helpers.setTouched(true);
      return;
    }

    try {
      const res = await uploadFile(file).unwrap();
      helpers.setValue(res.data); //  value set
      helpers.setError(undefined); //  error cleared
      helpers.setTouched(true, false); // mark as interacted
    } catch (error) {
      helpers.setError("File upload failed");
      console.error("File upload error:", error);
    }
  };

  // const fileName = field.value ? field.value.name : "No file chosen";

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium text-[12px]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div
        className={`border rounded-lg px-3 h-11 flex justify-center items-center cursor-pointer ${
          meta.touched && meta.error ? "border-red-500" : "border-gray-300"
        } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200`}
        onClick={() => fileRef.current?.click()}
      >
        {isLoading ? (
          <span className="text-sm text-gray-500">Uploading...</span>
        ) : field.value ? (
          <span className="text-gray-600 truncate">{field.value}</span>
        ) : (
          <span className="flex items-center gap-x-2.5 text-[#5B657A] text-[14px] font-medium">
            Upload <FileInputIcon />
          </span>
        )}
      </div>

      <input type="file" ref={fileRef} accept={accept} className="hidden" onChange={handleChange} />

      {meta.touched && meta.error && <p className="text-red-500 text-sm mt-1">{meta.error}</p>}
    </div>
  );
};
