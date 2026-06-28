import React, { useEffect, useState } from "react";
import { UserIcon } from "@/assets/icons";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import { base64ToBlobUrl } from "@/utils/image";

interface PatientAvatarProps {
  imageName?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Simple in-memory cache for blob URLs to avoid redundant fetches
const imageCache: Record<string, string> = {};

export const PatientAvatar: React.FC<PatientAvatarProps> = ({ imageName, name = "", size = "md", className = "" }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(
    imageName && imageCache[imageName] ? imageCache[imageName] : null,
  );
  const [downloadFile, { isLoading }] = useDownloadFileMutation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!imageName || imageCache[imageName] || failed) return;

    const fetchImage = async () => {
      try {
        const res = await downloadFile(imageName).unwrap();
        if (res?.fileBase64) {
          const url = base64ToBlobUrl(res.fileBase64);
          imageCache[imageName] = url;
          setImageUrl(url);
        } else {
          setFailed(true);
        }
      } catch (err) {
        console.error("Failed to load patient image:", imageName, err);
        setFailed(true);
      }
    };

    fetchImage();
  }, [imageName, downloadFile, failed]);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const containerClasses = `rounded-full bg-[#d2dbe9] flex items-center justify-center overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`;

  if (!imageName || failed) {
    return (
      <div className={containerClasses}>
        <UserIcon className={size === "lg" ? "h-12 w-12" : "h-8 w-8"} />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {isLoading && !imageUrl ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <UserIcon className={size === "lg" ? "h-12 w-12" : "h-8 w-8"} />
      )}
    </div>
  );
};
