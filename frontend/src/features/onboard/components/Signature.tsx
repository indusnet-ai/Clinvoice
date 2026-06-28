import React, { useEffect, useRef, useState } from "react";
import goingUpImg from "@/assets/imgs/going_up.png";
import { Button } from "@/atoms";
import { showToast } from "@/utils";
import FooterButton from "./FooterButton";
import { CloseIcon } from "@/assets/icons";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import { useLanguage } from "@/language/context/LanguageContext";

interface SignatureProps {
  onNext: (data: any) => void;
  signData: string | null;
  onBack?: () => void;
  isSetting?: boolean;
}

export const Signature: React.FC<SignatureProps> = ({ onNext, signData = null, onBack, isSetting = false }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [fileDownload, { isLoading }] = useDownloadFileMutation();
  const { t } = useLanguage();

  useEffect(() => {
    if (!signData) return;
    if (!signData || typeof signData !== "string") return;
    const loadImageFromBase64 = async () => {
      try {
        if (!signData) return;
        const res = await fileDownload(signData).unwrap();

        const base64 = res.fileBase64;
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: "image/png" });
        const fileFromApi = new File([blob], "signature.png", { type: "image/png" });

        setPreview(URL.createObjectURL(blob));
        setFile(fileFromApi); // IMPORTANT
      } catch (err) {
        console.error("Failed to load signature preview", err);
      }
    };

    loadImageFromBase64();
  }, [signData]);

  const hasImage = !!preview;

  const handleBrowserClick = () => {
    fileInputRef.current?.click();
  };

  const handleSelectedFile = (selectedFile: File) => {
    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      showToast("Please choose valid file format", "info");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target?.files?.[0];
    if (!selectedFile) return;
    handleSelectedFile(selectedFile);
  };
  const handleDragover = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (!droppedFile) return;
    handleSelectedFile(droppedFile);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current -= 1;

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  //final onNext - submit. Signature is optional — pass null to skip.
  const handleFileUpload = () => {
    onNext(file ?? null);
  };

  const handleRemoveFile = () => {
    setPreview(null);
    setFile(null);
  };

  return (
    <div className="flex items-center justify-center flex-col">
      <div
        className={`flex items-center flex-col justify-center w-full ${
          isDragging
            ? "border-[#6070FF] rounded-sm p-6 animate-pulse transition-transform duration-300 scale-110 border bg-[#F4F6FF]"
            : "border-gray-300"
        }`}
        onDragOver={handleDragover}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <div className="relative">
          <img
            src={preview || goingUpImg}
            alt="upload your files"
            className="md:max-w-[400px] max-w-[300px] max-h-[300px] block mx-auto"
          />
          {hasImage && (
            <CloseIcon
              className="absolute top-3 -right-8 cursor-pointer hover:scale-150 transition-transform duration-300 "
              onClick={handleRemoveFile}
            />
          )}
        </div>
      </div>
      {!hasImage && (
        <>
          <p className="text-[#0F0F0F] text-[16px] font-medium mt-5">
            Drag & Drop file or{" "}
            <span className="text-[#6070FF] cursor-pointer" onClick={handleBrowserClick}>
              Browse
            </span>
          </p>

          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <p className="text-[12px] text-[#676767] font-normal ">supported formates: JPEG, PNG</p>
          <div className="mt-10">
            <Button label={t("label.uploadFile")} variant="outlined" onClick={handleBrowserClick} />
          </div>
        </>
      )}
      {!isSetting && (
        <div className="flex items-center justify-end w-full mt-[10%]">
          <FooterButton onNext={handleFileUpload} hasBack onBack={onBack} />
        </div>
      )}
      {isSetting && (
        <div className="flex w-full justify-end mt-12">
          <Button type="submit" onClick={handleFileUpload} label={t("label.save")} />
        </div>
      )}
    </div>
  );
};
