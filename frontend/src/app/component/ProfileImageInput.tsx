import React, { useEffect, useRef, useState } from "react";
import { useField } from "formik";
import { FiEdit2 } from "react-icons/fi";
import { EditIcon, UserIcon } from "@/assets/icons";
import { useDownloadFileMutation, useUploadFileMutation } from "../fileUploadApi";
import { showToast } from "@/utils";

interface Props {
  name: string;
  label?: string;
}

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const ProfileImageInput: React.FC<Props> = ({ name, label }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [field, , helpers] = useField(name);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadFile, { isLoading }] = useUploadFileMutation();
  const [fileDownload, { isLoading: isDownloading }] = useDownloadFileMutation();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      showToast(`Invalid file type. Please upload JPG, PNG, or WebP images.`, "error");
      console.error(" Invalid file type:", file.type);
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File too large. Maximum size is 5MB.`, "error");
      console.error(" File too large:", (file.size / 1024 / 1024).toFixed(2), "MB");
      return false;
    }

    return true;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!validateFile(file)) {
      // Reset input
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      return;
    }

    try {
      setIsImageLoading(true);

      // Upload file
      const res = await uploadFile(file).unwrap();

      // Store filename in form field
      helpers.setValue(res.data);

      // Clean up old preview URL
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      // Create new preview
      const newPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = newPreviewUrl;
      setPreview(newPreviewUrl);

      showToast("Image uploaded successfully", "success");
    } catch (error: any) {
      console.error(" Image upload failed:", error);
      showToast(error?.message || "Failed to upload image", "error");

      // Reset input on error
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } finally {
      setIsImageLoading(false);
    }
  };

  useEffect(() => {
    if (!field.value || typeof field.value !== "string") {
      return;
    }

    // Avoid re-downloading after upload
    if (preview) {
      return;
    }

    const loadImageFromApi = async () => {
      try {
        setIsImageLoading(true);
        const res = await fileDownload(field.value).unwrap();

        if (!res?.fileBase64) {
          throw new Error("No image data received from server");
        }

        const base64 = res.fileBase64;
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: "image/png" });

        // Clean up old preview URL
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        const imageUrl = URL.createObjectURL(blob);
        previewUrlRef.current = imageUrl;
        setPreview(imageUrl);
      } catch (err: any) {
        console.error(" Failed to load profile image:", err);
        showToast("Failed to load profile image", "error");
      } finally {
        setIsImageLoading(false);
      }
    };

    loadImageFromApi();
  }, [field.value]);

  return (
    <div className="flex items-center justify-center ">
      <div className="relative w-32 h-32">
        {/* Profile Image */}
        {isImageLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-white/60">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {preview ? (
          <img
            // src={preview || (typeof field.value === "string" && field.value !== "" ? field.value : "")}
            src={preview ?? ""}
            alt="Profile"
            className="w-full h-full bg-[#D7DBFF] rounded-full object-cover  shadow-sm"
          />
        ) : (
          <div className="w-full h-full bg-[#D7DBFF] flex items-center justify-center rounded-full object-cover  shadow-sm">
            <UserIcon />
          </div>
        )}

        {/* Edit Icon */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-1 right-1 bg-[#F0F3FF] p-2 rounded-full shadow cursor-pointer hover:bg-gray-100"
        >
          <EditIcon />
        </button>

        {/* Hidden File Input */}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          ref={fileRef}
          className="hidden"
          onChange={handleChange}
          multiple={false}
        />
      </div>
    </div>
  );
};
