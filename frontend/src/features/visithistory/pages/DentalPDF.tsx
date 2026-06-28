import { CloseIcon, DownLoadIcon, PrintIcon } from "@/assets/icons";
import { useAppSelector } from "@/app/hook";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  useGetDoctorInfoQuery,
  useGetHospitalInfoQuery,
  useGetSignatureQuery,
} from "../../onboard/services/OnBoardApi";
import { mapDataToPdf } from "../utils/mapDataToPdf";
import {
  useGetOpdCaseSheetQuery,
  useGetPatientProfileQuery,
} from "../../dashboard/services/ConsultationApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useReactToPrint } from "react-to-print";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import Barcode from "react-barcode";
import { mapDataToDentalPdf } from "../utils/mapDataToDentalPdf";
import { formatDateForDisplay } from "@/utils";

const formatPdfDateTime = (date?: Date | string | null): string => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${day}-${month}-${year} ${h12}:${minutes} ${ampm}`;
};

const formatTeethWithNumbers = (teethData: any) => {
  if (!teethData) return "";

  const statusMap: Record<string, string> = {
    D: "Decayed",
    M: "Missing",
    F: "Filled",
    C: "Crown",
    FT: "Fractured Tooth",
    RS: "Root Stump",
  };

  const result: Record<string, string[]> = {};

  Object.values(teethData).forEach((jaw: any) => {
    Object.entries(jaw || {}).forEach(([toothNo, status]: any) => {
      const label = statusMap[status];
      if (!label) return;
      if (!result[label]) {
        result[label] = [];
      }
      result[label].push(toothNo);
    });
  });

  return Object.entries(result)
    .map(([label, teeth]) => `${label}: ${teeth.join(", ")}`)
    .join(" | ");
};

function DentalPDF() {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
  const { data } = useGetDoctorInfoQuery(
    { page: 1, limit: 1 },
    { refetchOnMountOrArgChange: true },
  );
  const docData = data?.data?.[0];
  const [searchparams] = useSearchParams();
  const hosptialId = useAppSelector((state) => state.auth.hospital_id);
  const doctorName =
    useAppSelector((state) => state.auth?.doctor?.doctor_name) || docData?.name;
  const user_id = useAppSelector((state) => state.auth?.user_id);
  const opdIdParam = searchparams.get("opd_id");
  const opd_id = opdIdParam ? Number(opdIdParam) : null;
  const patientIdParam = searchparams.get("patient_id");
  const patient_id = patientIdParam ? Number(patientIdParam) : null;

  const [hosptialLogo, setHospitalLogo] = useState<string>("");
  const [docSign, setDocSign] = useState<string>("");

  const { data: hospitalData } = useGetHospitalInfoQuery(
    { limit: 1, page: 1 },
    { refetchOnMountOrArgChange: true },
  );
  const hopitalInfo = hospitalData?.data?.[0];

  const { data: signData } = useGetSignatureQuery(
    { userId: user_id },
    { refetchOnMountOrArgChange: true },
  );

  const { data: patientData } = useGetPatientProfileQuery(
    patient_id ? { patient_id } : skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
  );
  const patientInfo = patientData?.data?.[0];

  const { data: OpdCaseSheet } = useGetOpdCaseSheetQuery(
    opd_id ? { opd_id } : skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
  );
  const OpdCaseData = OpdCaseSheet?.data;

  const caseSheetData = mapDataToDentalPdf(
    hopitalInfo,
    patientInfo,
    doctorName,
    OpdCaseData,
  );

  const handlePrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: "case-sheet",
  });

  const [fileDownload, { isLoading: isProfilePicLoading }] =
    useDownloadFileMutation();

  const fetchImage = async (
    imageName: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (!imageName) return;

    try {
      const res = await fileDownload(imageName).unwrap();
      const base64 = res.fileBase64;
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);
      setter(imageUrl);
    } catch (err) {
      console.error("Image download failed", err);
    }
  };

  useEffect(() => {
    if (hopitalInfo?.logo) {
      fetchImage(hopitalInfo.logo, setHospitalLogo);
    }

    if (signData) {
      fetchImage(signData?.data?.user_signature, setDocSign);
    }
  }, [hopitalInfo, signData]);

  const barcodeValue = `${patient_id ?? 0}-${opd_id ?? 0}`;
  const teethSummary = formatTeethWithNumbers(caseSheetData?.clinicalFindings?.teeth);
  const hospitalName = caseSheetData.hospital?.name || "";
  const watermarkFontSize = hospitalName.length > 10 
    ? `${Math.max(20, Math.min(60, 600 / hospitalName.length))}px` 
    : "60px";

  return (
    <div>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            html {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
            }
            body {
              margin: 0;
              padding: 0;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide screen-only elements */
            .screen-only-header,
            .screen-only-footer,
            .screen-only-watermark {
              display: none !important;
            }

            /* Fixed Header - appears on every page */
            .print-page-header {
              display: block !important;
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              width: 100%;
              background: white !important;
              padding: 30px 4% 0 4%;
              z-index: 1000;
            }
            .print-page-header > div {
              background: white !important;
              padding: 20px 40px;
              border-radius: 12px 12px 0 0;
            }

            /* Fixed Footer - appears on every page */
            .print-page-footer {
              display: block !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              width: 100%;
              background: white !important;
              padding: 0 4% 30px 4%;
              z-index: 1000;
            }

            .print-page-footer > div {
              background: white !important;
              padding: 20px 40px;
              border-radius: 0 0 12px 12px;
            }

            /* Watermark - visible in PDF on all pages */
            .print-watermark {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              font-size: var(--print-watermark-size, 60px) !important;
              font-weight: 700 !important;
              color: rgba(58, 67, 153, 0.08) !important;
              z-index: 500 !important;
              pointer-events: none !important;
              white-space: normal !important;
              text-transform: none !important;
              letter-spacing: 4px !important;
              opacity: 1 !important;
              text-align: center !important;
            }

            /* Full blue background on all pages */
            .print-container {
              background: white !important;
              min-height: 100vh !important;
              padding: 0 !important;
            }

            /* Table layout for print persistence */
            .report-container {
              width: 92% !important;
              margin: 0 auto !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
            }

            .report-header-spacer {
              height: 260px !important;
            }

            .report-footer-spacer {
              height: 120px !important;
            }

            /* White content area - continuous from header to footer on all pages */
            .pdf-main-content {
              background-color: white !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              position: relative;
              z-index: 2;
              min-height: 100vh !important;
              border-radius: 0;
              box-shadow: none;
            }

            /* Content area - proper spacing to avoid header/footer overlap */
            .pdf-content-area {
              padding: 20px 40px !important;
              background: white !important;
            }

            /* First content section spacing */
            .pdf-content-area > *:first-child {
              margin-top: 0 !important;
              padding-top: 0 !important;
            }

            /* Section spacing */
            .content-section {
              page-break-inside: avoid;
              padding: 0 !important;
            }

            .content-section h2 {
              page-break-after: avoid;
            }

            /* Ensure content continues on page 2+ */
            .content-section:not(:first-child) {
              margin-top: 10px !important;
            }

           
          }

          /* Hide print elements on screen */
          @media screen {
            .print-page-header,
            .print-page-footer,
            .print-watermark,
            .report-header-spacer,
            .report-footer-spacer {
              display: none !important;
            }
            .report-container {
              width: 100%;
            }
          }
        `}
      </style>

      <div className="flex items-center justify-between p-6">
        <h2 className="text-[16px] font-semibold text-[#01030F]">
          Dental Case Sheet
        </h2>

        <div className="flex items-center gap-3">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={handlePrint}
          >
            <PrintIcon className="w-6 h-6" />
          </button>

          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={handlePrint}
          >
            <DownLoadIcon className="w-6 h-6" />
          </button>

          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {
              navigate(-1);
            }}
          >
            <CloseIcon color="#98999E" className="cursor-pointer w-6 h-6" />
          </button>
        </div>
      </div>

      <div
        ref={pdfRef}
        style={{ "--print-watermark-size": watermarkFontSize } as React.CSSProperties}
        className="print-container relative mx-auto p-8 bg-linear-to-br from-blue-50 to-purple-50 min-h-screen"
      >
        {/* PRINT ONLY - Fixed Header with Patient Details (appears on every page) */}
        <div className="print-page-header">
          <div>
            {/* Hospital Header */}
            <div className="flex justify-between items-start pb-3 border-b-2 border-[#01030F] mb-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  {hosptialLogo ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      alt="hosptial_logo"
                      src={hosptialLogo}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {caseSheetData.hospital?.name?.charAt(0)}
                    </div>
                  )}

                  <h1
                    className="text-[24px] font-bold"
                    style={{ color: "#3A4399" }}
                  >
                    {caseSheetData.hospital?.name}
                  </h1>
                </div>

                <div className="text-[#8F98B3] text-[8px] ml-10">
                  <p>
                    {caseSheetData.hospital?.address1},{" "}
                    {caseSheetData.hospital?.address2}
                  </p>
                </div>
              </div>

              <div className="text-right text-[8px] text-[#01030F] font-medium">
                <p>{caseSheetData.hospital?.phone}</p>
                <p>{caseSheetData.hospital?.email}</p>
                <p>{caseSheetData.hospital?.website}</p>
                <p className="text-[10px] font-semibold mt-1">
                  {formatPdfDateTime(caseSheetData?.hospital?.dateTime)}
                </p>
              </div>
            </div>

            {/* Patient Info - First Row */}
            <div className="grid grid-cols-4 gap-2 mb-2 bg-[#EDEFFE] p-2 rounded">
              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">Name</p>
                <p className="font-semibold text-[#01030F] text-[11px]">
                  {caseSheetData.patient.name}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">
                  Patient ID
                </p>
                <p className="font-semibold text-[#01030F] text-[11px]">
                  PT{caseSheetData.patient.patientId}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">
                  Age & Gender
                </p>
                <p className="font-semibold text-[#01030F] text-[11px]">
                  {caseSheetData.patient.ageGender}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">
                  Mobile Number
                </p>
                <p className="font-semibold text-[#01030F] text-[11px]">
                  {caseSheetData.patient.mobile}
                </p>
              </div>
            </div>

            {/* Patient Info - Second Row */}
            <div className="grid grid-cols-4 gap-2 p-2">
              <div className="min-w-0">
                <p className="text-[#666666] text-[10px] font-normal">
                  Email ID
                </p>
                <p className="font-semibold text-[#01030F] text-[10px]">
                  {caseSheetData?.patient?.email}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[#666666] text-[10px] font-normal">
                  Address
                </p>
                <p className="font-semibold text-[#01030F] text-[10px]">
                  {patientInfo?.address}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[#666666] text-[10px] font-normal">
                  Doctor Name
                </p>
                <p className="font-semibold text-[#01030F] text-[10px]">
                  {caseSheetData?.doctorName}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="inline-flex flex-col items-center">
                  <Barcode
                    value={barcodeValue}
                    format="CODE128"
                    width={0.8}
                    height={28}
                    margin={0}
                    displayValue={false}
                  />
                  <p className="text-[8px] mt-0.5 text-center">
                    PT{caseSheetData.patient.patientId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRINT ONLY - Fixed Footer (appears on every page) */}
        <div className="print-page-footer">
          <div>
            <div className="grid grid-cols-3 items-center">
              <div />
              <p className="text-[9px] text-[#8F98B3] font-medium text-center">
                Design & Developed by ClinVoice AI
              </p>
              <div className="flex flex-col items-center ml-auto w-fit">
                {docSign ? (
                  <img
                    src={docSign}
                    alt="doctor-signature"
                    className="w-16 h-8 object-contain"
                  />
                ) : (
                  <p className="font-script text-sm">sign</p>
                )}
                <p className="text-[9px] font-medium text-black mt-1 text-center">
                  Signature
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PRINT ONLY - Watermark (appears on every page) */}
        <div className="print-watermark">{caseSheetData.hospital.name}</div>

        <table className="report-container">
          <thead>
            <tr>
              <td>
                <div className="report-header-spacer"></div>
              </td>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <div className="pdf-main-content bg-white relative rounded-lg shadow-lg p-6">
                  {/* SCREEN ONLY - Original Header */}
                  <div className="screen-only-header flex justify-between items-start mb-4 pb-4 border-b-2 border-[#01030F]">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {hosptialLogo ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            alt="hosptial_logo"
                            src={hosptialLogo}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {caseSheetData.hospital?.name?.charAt(0)}
                          </div>
                        )}
                        <h1 className="text-[40px] font-bold text-[#3A4399]">
                          {caseSheetData.hospital?.name}
                        </h1>
                      </div>
                      <div className="text-[#8F98B3]">
                        <p className="text-xs">
                          {caseSheetData.hospital?.address1},
                        </p>
                        <p className="text-xs">
                          {caseSheetData.hospital?.address2}
                        </p>
                      </div>
                    </div>

                    <div className="text-left flex flex-col gap-y-1 text-xs text-[#01030F] font-medium">
                      <p className="">{caseSheetData.hospital?.phone}</p>
                      <p className="">{caseSheetData.hospital?.email}</p>
                      <p className="">{caseSheetData.hospital?.website}</p>
                      <p className="text-[#01030F] text-[14px] font-semibold mt-2 ">
                        {formatPdfDateTime(caseSheetData?.hospital?.dateTime)}
                      </p>
                    </div>
                  </div>

                  {/* SCREEN ONLY - Patient Info */}
                  <div className="screen-only-header">
                    <div className="grid grid-cols-4 gap-2 mb-4 bg-[#EDEFFE] p-2 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-[#4E54C8] text-[14px] font-normal">
                          Name
                        </p>
                        <p className="font-semibold text-[#01030F] text-[16px] ">
                          {caseSheetData.patient.name}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[#4E54C8] text-[14px] font-normal">
                          Patient ID
                        </p>
                        <p className="font-semibold text-[#01030F] text-[16px]">
                          PT{caseSheetData.patient.patientId}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[#4E54C8] text-[14px] font-normal">
                          Age & Gender
                        </p>
                        <p className="font-semibold text-[#01030F] text-[16px]">
                          {caseSheetData.patient.ageGender}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[#4E54C8] text-[14px] font-normal">
                          Mobile Number
                        </p>
                        <p className="font-semibold text-[#01030F] text-[16px]">
                          {caseSheetData.patient.mobile}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4 p-2 text-wrap ">
                      <div className="min-w-0 wrap-break-word">
                        <p className="text-[#666666] text-[14px] font-normal">
                          Email ID
                        </p>
                        <p className="font-semibold text-[#01030F] text-[13px]">
                          {caseSheetData?.patient?.email}
                        </p>
                      </div>

                      <div className="min-w-0 wrap-break-word">
                        <p className="text-[#666666] text-[14px] font-normal">
                          Address
                        </p>
                        <p className="font-semibold text-[#01030F] text-[13px]">
                          {patientInfo?.address}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[#666666] text-[14px] font-normal">
                          Doctor Name
                        </p>
                        <p className="font-semibold text-[#01030F] text-[13px]">
                          Dr.{caseSheetData?.doctorName}
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <div className="inline-flex flex-col items-center">
                          <Barcode
                            value={barcodeValue}
                            format="CODE128"
                            width={1}
                            height={36}
                            margin={0}
                            displayValue={false}
                          />
                          <p className="text-xs mt-1 text-center">
                            PT{caseSheetData.patient.patientId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="pdf-content-area">
                    {/* Chief Complaints */}
                    <div className="content-section mb-4">
                      <div className="bg-[#B8BFFF] rounded-t-lg p-2">
                        <h2 className="text-[#01030F] text-sm font-semibold">
                          Chief Complaints
                        </h2>
                      </div>
                      <div className="bg-white p-4 rounded-b-lg">
                        <p className="text-sm text-[#01030F] leading-relaxed whitespace-pre-line">
                          {caseSheetData?.chiefComplaints ?? ""}
                        </p>
                      </div>
                    </div>

                    {/* past medical history */}
                    <div className="content-section mb-4">
                      <div className="bg-[#B8BFFF] rounded-t-lg p-2">
                        <h2 className="text-[#01030F] text-sm font-semibold">
                          Past Medical History
                        </h2>
                      </div>
                      <div className="bg-white p-4 rounded-b-lg">
                        <p className="text-sm text-[#01030F] leading-relaxed whitespace-pre-line">
                          {caseSheetData?.pastmedicalhistory ?? ""}
                        </p>
                      </div>
                    </div>

                    {/* past dental history */}
                    <div className="content-section mb-4">
                      <div className="bg-[#B8BFFF] rounded-t-lg p-2">
                        <h2 className="text-[#01030F] text-sm font-semibold">
                          Past Dental History
                        </h2>
                      </div>
                      <div className="bg-white p-4 rounded-b-lg">
                        <p className="text-sm text-[#01030F] leading-relaxed whitespace-pre-line">
                          {caseSheetData?.pastdentalhistory ?? ""}
                        </p>
                      </div>
                    </div>

                    {/* Extra oral Examination */}
                    <div className="content-section mb-4">
                      <div className="bg-[#B8BFFF] rounded-t-lg p-2">
                        <h2 className="text-[#01030F] text-sm font-semibold">
                          Extra oral Examination
                        </h2>
                      </div>
                      <div className="bg-white p-4 rounded-b-lg">
                        <p className="text-sm text-[#01030F] leading-relaxed">
                          {caseSheetData?.extraoralExamination ?? ""}
                        </p>
                      </div>
                    </div>

                    {/* Intraoral Examination */}
                    <div className="content-section mb-4">
                      <div className="bg-[#B8BFFF] rounded-t-lg p-2">
                        <h2 className="text-[#01030F] text-sm font-semibold">
                          Intraoral Examination
                        </h2>
                      </div>

                      <div className="bg-white p-4 rounded-b-lg">
                        <div className="grid grid-cols-3 gap-6 mb-6">
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Oral Hygine
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.oralExamination?.oralHygiene ??
                                ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Gingival Health
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.oralExamination?.gingivalHealth ??
                                ""}{" "}
                            </p>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Caries status
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.oralExamination?.cariesStatus ??
                                ""}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-[#01030F] leading-relaxed">
                            {caseSheetData?.chiefComplaints ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Clinical findings */}
                    <div className="content-section mb-4">
                      <div className="bg-[#B8BFFF] rounded-t-lg p-2">
                        <h2 className="text-[#01030F] text-sm font-semibold">
                          Clinical findings
                        </h2>
                      </div>

                      <div className="bg-white p-4 rounded-b-lg">
                        <p className="text-[15px] text-[#01030F] font-semibold mb-3">
                          {teethSummary || ""}
                        </p>
                        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Attrition
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.clinicalFindings?.attrition ?? ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Abrasion
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.clinicalFindings?.abrasion ?? ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Erosion
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.clinicalFindings?.erosions ?? ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Tenderness on percussion
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.clinicalFindings
                                ?.tendernessOnPercussion ?? ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Molar Relation / Canine Relation
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.clinicalFindings
                                ?.molarCanineRelation ?? ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Mobility of teeth
                            </p>
                            <p className="text-sm text-[#01030F]">
                              {caseSheetData?.clinicalFindings
                                ?.mobilityOfTeeth ?? ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="content-section mb-4">
                      <div className="bg-[#B8BFFF] rounded-t-lg p-2">
                        <h2 className="text-[#01030F] text-sm font-semibold">
                          Investigations & Diagnosis
                        </h2>
                      </div>
                      <div className="bg-white p-4 rounded-b-lg space-y-4">
                        {(caseSheetData?.investigations?.length > 0 || caseSheetData?.otherinvestigations) && (
                          <div>
                            <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                              Investigation Required
                            </p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                              {[
                                "RVG",
                                "IOPA",
                                "OPG",
                                "CBCT",
                                "Lateral Cephalogram",
                                "Blood test",
                              ]
                                .filter((item) =>
                                  caseSheetData?.investigations?.includes(item),
                                )
                                .map((item: string) => (
                                  <div key={item} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded flex items-center justify-center border bg-[#3A4399] border-[#3A4399]">
                                      <svg
                                        width="10"
                                        height="8"
                                        viewBox="0 0 10 8"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M1 4L3.5 6.5L9 1"
                                          stroke="white"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>
                                    <span className="text-sm text-[#01030F]">
                                      {item}
                                      {item === "Blood test" &&
                                        caseSheetData?.otherinvestigations && (
                                          <span className="ml-1">
                                            - {caseSheetData.otherinvestigations}
                                          </span>
                                        )}
                                    </span>
                                  </div>
                                ))}
                              {/* If otherinvestigations exists but "Blood test" is NOT in the list, still show it? 
                                  Normally otherinvestigations is tied to Blood test checkbox in UI. 
                                  But just in case, if Blood test is not checked but text exists, we show it at the end. */}
                              {!caseSheetData?.investigations?.includes("Blood test") && caseSheetData?.otherinvestigations && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-[#01030F]">
                                    Other: {caseSheetData.otherinvestigations}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-[#01030F] leading-relaxed">
                            {caseSheetData?.oralExamination?.clinicalNotes ??
                              ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                            Results
                          </p>
                          <p className="text-sm text-[#01030F] leading-relaxed">
                            {caseSheetData?.investigationRemarks ?? ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                            Final Diagnosis
                          </p>
                          <p className="text-sm text-[#01030F] leading-relaxed">
                            {caseSheetData?.diagnosis ?? ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-[#01030F] mb-1">
                            Treatment Plan
                          </p>
                          <p className="text-sm text-[#01030F] leading-relaxed">
                            {caseSheetData?.treatmentPlan ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="content-section p-4">
                      <div className="bg-white rounded-lg overflow-hidden">
                        <h2 className="text-[#01030F] text-sm font-semibold mb-4">
                          Medications
                        </h2>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-[#B8BFFF]">
                              <th className="p-3 text-xs text-[#01030F] font-semibold text-left">
                                S.No
                              </th>
                              <th className="p-3 text-xs text-[#01030F] font-semibold text-left">
                                Medicine Name
                              </th>
                              <th className="p-3 text-xs text-[#01030F] font-semibold text-left">
                                Dosage
                              </th>
                              <th className="p-3 text-xs text-[#01030F] font-semibold text-left">
                                Frequency
                              </th>
                              <th className="p-3 text-xs text-[#01030F] font-semibold text-left">
                                Timing
                              </th>
                              <th className="p-3 text-xs text-[#01030F] font-semibold text-left">
                                Duration
                              </th>
                              <th className="p-3 text-xs text-[#01030F] font-semibold text-left">
                                Quantity
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {caseSheetData?.medication?.map(
                              (medication, index) => (
                                <React.Fragment key={index}>
                                  <tr className="border-b border-gray-100 last:border-0">
                                    <td className="p-3 text-sm text-[#01030F]">
                                      {medication?.id ?? index + 1}
                                    </td>
                                    <td className="p-3 text-sm text-[#01030F] font-medium">
                                      {medication?.medicineName ?? ""}
                                    </td>
                                    <td className="p-3 text-sm text-[#01030F]">
                                      {medication?.dosage ?? ""}
                                    </td>
                                    <td className="p-3 text-sm text-[#01030F]">
                                      {medication?.frequency ?? ""}
                                    </td>
                                    <td className="p-3 text-sm text-[#01030F]">
                                      {medication?.timing ?? ""}
                                    </td>
                                    <td className="p-3 text-sm text-[#01030F]">
                                      {medication?.duration ?? ""}
                                    </td>
                                    <td className="p-3 text-sm text-[#01030F]">
                                      {medication?.quantity ?? ""}
                                    </td>
                                  </tr>
                                  {medication?.remarks && (
                                    <tr className="border-b border-gray-100 last:border-0 bg-gray-50/50">
                                      <td
                                        colSpan={7}
                                        className="p-3 text-[13px] text-[#8F98B3] italic"
                                      >
                                        Remarks: {medication?.remarks}
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Follow up */}
                    <div className="content-section">
                      <div className="bg-white rounded-lg">
                        <h2 className="text-[#01030F] text-sm font-semibold mb-2">
                          Follow up
                        </h2>
                        <div className="bg-white">
                          <p className="text-sm text-[#01030F] mb-1">
                            Visit to hospital on{" "}
                            <span className="font-semibold">
                              {formatDateForDisplay(
                                caseSheetData?.followUp?.followdate,
                              ) ?? ""}
                            </span>
                          </p>
                          <p className="text-sm text-[#01030F]">
                            Remark :{" "}
                            {caseSheetData?.followUp?.followremark ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SCREEN ONLY - Original Footer */}
                  <div className="screen-only-footer grid grid-cols-3 items-center mt-8 pt-6 border-t">
                    <div />
                    <p className="text-xs text-[#8F98B3] font-medium text-center">
                      Design & Developed by ClinVoice AI
                    </p>
                    <div className="text-right">
                      {docSign ? (
                        <img
                          src={docSign}
                          alt="doctor-signature"
                          className="w-24 h-12 object-contain ml-auto mb-1"
                        />
                      ) : (
                        <p className="font-script text-lg mb-1">sign</p>
                      )}
                      <p className="text-[14px] font-medium text-black">
                        Signature
                      </p>
                    </div>
                  </div>

                  {/* SCREEN ONLY - Original Watermark */}
                  <div className="screen-only-watermark pointer-events-none absolute inset-0 flex items-center justify-center">
                    <h1 
                      style={{ fontSize: watermarkFontSize }}
                      className="font-extrabold text-[#8F98B333] select-none text-center max-w-[90%]"
                    >
                      {hospitalName}
                    </h1>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td>
                <div className="report-footer-spacer"></div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default DentalPDF;
