import React, { useEffect, useState } from "react";
import { UserIcon } from "@/assets/icons";
import { useDownloadFileMutation } from "../fileUploadApi";

interface ProfileImageViewProps {
  fileKey?: string | null;
}

export const ProfileImageView: React.FC<ProfileImageViewProps> = ({ fileKey }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [downloadFile] = useDownloadFileMutation();

  useEffect(() => {
    if (!fileKey) return;

    const loadImage = async () => {
      try {
        const res = await downloadFile(fileKey).unwrap();

        const byteString = atob(res.fileBase64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: "image/png" });
        setPreview(URL.createObjectURL(blob));
      } catch (err) {
        console.error("Image load failed", err);
      }
    };

    loadImage();
  }, [fileKey]);

  if (!fileKey) {
    return (
      <div className="bg-[#D7DBFF] rounded-full p-3">
        <UserIcon className="h-9 w-9" />
      </div>
    );
  }

  return <img src={preview ?? "#"} alt="Profile" className="h-16 w-16 rounded-full object-cover bg-[#D7DBFF]" />;
};
