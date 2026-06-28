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
import { useGetOpdCaseSheetQuery, useGetPatientProfileQuery } from "../../dashboard/services/ConsultationApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useReactToPrint } from "react-to-print";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import Barcode from "react-barcode";
import jsPDF from "jspdf";
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

function Pdf() {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
  const printHeaderRef = useRef<HTMLDivElement>(null);
  const printFooterRef = useRef<HTMLDivElement>(null);
  const { data } = useGetDoctorInfoQuery({ page: 1, limit: 1 }, { refetchOnMountOrArgChange: true });
  const docData = data?.data?.[0];
  const [searchparams] = useSearchParams();
  const hosptialId = useAppSelector((state) => state.auth.hospital_id);
  const doctorName = useAppSelector((state) => state.auth?.doctor?.doctor_name) || docData?.name;
  const user_id = useAppSelector((state) => state.auth?.user_id);
  const opdIdParam = searchparams.get("opd_id");
  const opd_id = opdIdParam ? Number(opdIdParam) : null;
  const patientIdParam = searchparams.get("patient_id");
  const patient_id = patientIdParam ? Number(patientIdParam) : null;
  const [hosptialLogo, setHospitalLogo] = useState<string>("");
  const [docSign, setDocSign] = useState<string>("");
  const [printSpacing, setPrintSpacing] = useState({ header: 280, footer: 120 });

  const { data: hospitalData } = useGetHospitalInfoQuery({ limit: 1, page: 1 }, { refetchOnMountOrArgChange: true });
  const hopitalInfo = hospitalData?.data?.[0];

  const { data: signData } = useGetSignatureQuery({ userId: user_id }, { refetchOnMountOrArgChange: true });

  const { data: patientData } = useGetPatientProfileQuery(patient_id ? { patient_id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const patientInfo = patientData?.data?.[0];

  const { data: OpdCaseSheet } = useGetOpdCaseSheetQuery(opd_id ? { opd_id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const OpdCaseData = OpdCaseSheet?.data;

  const caseSheetData = mapDataToPdf(hopitalInfo, patientInfo, doctorName, OpdCaseData);

  const handlePrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: "case-sheet",
  });

  const [fileDownload, { isLoading: isProfilePicLoading }] = useDownloadFileMutation();

  //common for hospital logo and doctor signature
  const fetchImage = async (imageName: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
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

  useEffect(() => {
    const calculatePrintSpacing = () => {
      const measuredHeader = printHeaderRef.current
        ? Math.ceil(printHeaderRef.current.getBoundingClientRect().height)
        : 0;
      const measuredFooter = printFooterRef.current
        ? Math.ceil(printFooterRef.current.getBoundingClientRect().height)
        : 0;

      const nextHeader = Math.max(280, measuredHeader + 12);
      const nextFooter = Math.max(120, measuredFooter + 8);

      setPrintSpacing((prev) => {
        if (prev.header === nextHeader && prev.footer === nextFooter) return prev;
        return { header: nextHeader, footer: nextFooter };
      });
    };

    calculatePrintSpacing();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(calculatePrintSpacing);
    if (printHeaderRef.current) observer.observe(printHeaderRef.current);
    if (printFooterRef.current) observer.observe(printFooterRef.current);

    window.addEventListener("resize", calculatePrintSpacing);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calculatePrintSpacing);
    };
  }, [caseSheetData.hospital?.address1, caseSheetData.hospital?.address2, patientInfo?.address, docSign, hosptialLogo]);

  const barcodeValue = `${patient_id ?? 0}-${opd_id ?? 0}`;
  const hospitalName = caseSheetData.hospital?.name || "";
  const watermarkFontSize = hospitalName.length > 10 
    ? `${Math.max(20, Math.min(60, 600 / hospitalName.length))}px` 
    : "60px";

  const printSpacingStyle = {
    "--print-header-space": `${printSpacing.header}px`,
    "--print-footer-space": `${printSpacing.footer}px`,
    "--print-watermark-size": watermarkFontSize,
  } as React.CSSProperties;

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
              padding: 25px 0% 0 0%;
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
              height: var(--print-header-space, 280px) !important;
            }
            .report-footer-spacer {
              height: var(--print-footer-space, 120px) !important;
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
              background: white !important;
            }
            .print-header-address,
            .print-patient-address {
              overflow-wrap: anywhere !important;
              word-break: break-word !important;
              line-height: 1.2 !important;
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
              margin-top: 24px !important;
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
        <h2 className="text-[16px] font-semibold text-[#01030F]">Case Sheet Summary</h2>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePrint}>
            <PrintIcon className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePrint}>
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
        style={printSpacingStyle}
        className="print-container relative mx-auto p-8 bg-linear-to-br from-blue-50 to-purple-50 min-h-screen"
      >
        {/* PRINT ONLY - Fixed Header with Patient Details (appears on every page) */}
        <div ref={printHeaderRef} className="print-page-header">
          <div>
            {/* Hospital Header */}
            <div className="flex justify-between items-start pb-3 border-b-2 border-[#01030F] mb-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  {hosptialLogo ? (
                    <img className="h-8 w-8 rounded-full" alt="hosptial_logo" src={hosptialLogo} />
                  ) : (
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {caseSheetData.hospital?.name?.charAt(0)}
                    </div>
                  )}
                  <h1 className="text-[24px] font-bold" style={{ color: "#3A4399" }}>
                    {caseSheetData.hospital?.name}
                  </h1>
                </div>
                <div className="text-[#8F98B3] text-[8px] ml-10">
                  <p className="print-header-address">
                    {caseSheetData.hospital?.address1}, {caseSheetData.hospital?.address2}
                  </p>
                </div>
              </div>
              <div className="text-right text-[8px] text-[#01030F] font-medium">
                <p>{caseSheetData.hospital?.phone}</p>
                <p>{caseSheetData.hospital?.email}</p>
                <p>{caseSheetData.hospital?.website}</p>
                <p className="text-[10px] font-semibold mt-1">{formatPdfDateTime(caseSheetData?.hospital?.dateTime)}</p>
              </div>
            </div>

            {/* Patient Info - First Row */}
            <div className="grid grid-cols-4 gap-2 mb-2 bg-[#EDEFFE] p-2 rounded">
              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">Name</p>
                <p className="font-semibold text-[#01030F] text-[11px]">{caseSheetData.patient.name}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">Patient ID</p>
                <p className="font-semibold text-[#01030F] text-[11px]">PT{caseSheetData.patient.patientId}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">Age & Gender</p>
                <p className="font-semibold text-[#01030F] text-[11px]">{caseSheetData.patient.ageGender}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[#4E54C8] text-[10px] font-normal">Mobile Number</p>
                <p className="font-semibold text-[#01030F] text-[11px]">{caseSheetData.patient.mobile}</p>
              </div>
            </div>

            {/* Patient Info - Second Row */}
            <div className="grid grid-cols-4 gap-2 p-2">
              <div className="min-w-0">
                <p className="text-[#666666] text-[10px] font-normal">Email ID</p>
                <p className="font-semibold text-[#01030F] text-[10px] break-all">{caseSheetData?.patient?.email}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[#666666] text-[10px] font-normal">Address</p>
                <p className="font-semibold text-[#01030F] text-[10px] print-patient-address">{patientInfo?.address}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[#666666] text-[10px] font-normal">Doctor Name</p>
                <p className="font-semibold text-[#01030F] text-[10px]">Dr.{caseSheetData?.doctorName}</p>
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
                  <p className="text-[8px] mt-0.5 text-center">PT{caseSheetData.patient.patientId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRINT ONLY - Fixed Footer (appears on every page) */}
        <div ref={printFooterRef} className="print-page-footer">
          <div>
            <div className="grid grid-cols-3 items-center">
              <div />
              <p className="text-[9px] text-[#8F98B3] font-medium text-center">Design & Developed by ClinVoice AI</p>
              <div className="flex flex-col items-center ml-auto w-fit">
                {docSign ? (
                  <img src={docSign} alt="doctor-signature" className="w-16 h-8 object-contain" />
                ) : (
                  <p className="font-script text-sm">sign</p>
                )}
                <p className="text-[9px] font-medium text-black mt-1 text-center">Signature</p>
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
                          <img className="h-10 w-10 rounded-full" alt="hosptial_logo" src={hosptialLogo} />
                        ) : (
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {caseSheetData.hospital?.name?.charAt(0)}
                          </div>
                        )}
                        <h1 className="text-[40px] font-bold text-[#3A4399]">{caseSheetData.hospital?.name}</h1>
                      </div>
                      <div className="text-[#8F98B3]">
                        <p className="text-xs">{caseSheetData.hospital?.address1},</p>
                        <p className="text-xs">{caseSheetData.hospital?.address2}</p>
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
                        <p className="text-[#4E54C8] text-[14px] font-normal">Name</p>
                        <p className="font-semibold text-[#01030F] text-[16px] ">{caseSheetData.patient.name}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#4E54C8] text-[14px] font-normal">Patient ID</p>
                        <p className="font-semibold text-[#01030F] text-[16px]">PT{caseSheetData.patient.patientId}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#4E54C8] text-[14px] font-normal">Age & Gender</p>
                        <p className="font-semibold text-[#01030F] text-[16px]">{caseSheetData.patient.ageGender}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#4E54C8] text-[14px] font-normal">Mobile Number</p>
                        <p className="font-semibold text-[#01030F] text-[16px]">{caseSheetData.patient.mobile}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4 p-2 text-wrap ">
                      <div className="min-w-0 wrap-break-word">
                        <p className="text-[#666666] text-[14px] font-normal">Email ID</p>
                        <p className="font-semibold text-[#01030F] text-[13px]">{caseSheetData?.patient?.email}</p>
                      </div>
                      <div className="min-w-0 wrap-break-word">
                        <p className="text-[#666666] text-[14px] font-normal">Address</p>
                        <p className="font-semibold text-[#01030F] text-[13px]">{patientInfo?.address}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#666666] text-[14px] font-normal">Doctor Name</p>
                        <p className="font-semibold text-[#01030F] text-[13px]">Dr.{caseSheetData?.doctorName}</p>
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
                          <p className="text-xs mt-1 text-center">PT{caseSheetData.patient.patientId}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="pdf-content-area">
                    {/* Vitals */}
                    <div className="content-section mb-4">
                      <h2 className="font-bold mb-2">Vitals</h2>
                      <div className="bg-[#B8BFFF] rounded">
                        <div className="grid grid-cols-6 gap-2 p-2 text-xs text-[#01030F] font-medium">
                          <div className="text-center">Temperature</div>
                          <div className="text-center">Pulse</div>
                          <div className="text-center">Blood Pressure</div>
                          <div className="text-center">Weight</div>
                          <div className="text-center">Height</div>
                          <div className="text-center">SpO2</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-2 p-2 text-[14px] text-center bg-white mx-2 mb-2 rounded">
                        <div>{caseSheetData.vitals.temperature}</div>
                        <div>{caseSheetData.vitals.pulse}</div>
                        <div>{caseSheetData.vitals.bp}</div>
                        <div>{caseSheetData.vitals.weight}</div>
                        <div>{caseSheetData.vitals.height}</div>
                        <div>{caseSheetData.vitals.spo2}</div>
                      </div>
                    </div>

                    {/* Chief Complaints */}
                    <div className="content-section mb-4">
                      <h2 className="font-bold mb-2">Chief complaints</h2>
                      <div className="bg-[#B8BFFF] rounded">
                        <div className="grid grid-cols-3 gap-2 p-2 text-xs text-[#01030F] font-medium">
                          <div>Symptoms</div>
                          <div>Duration</div>
                          <div>Remarks</div>
                        </div>
                      </div>

                      {caseSheetData?.complaints?.map((complain, index) => (
                        <div className="grid grid-cols-3 gap-2 p-2 text-[14px] bg-white mx-2 mb-2 rounded" key={index}>
                          <div>{complain?.symptom ?? ""}</div>
                          <div>{complain?.duration ?? ""}</div>
                          <div>{complain?.remarks ?? ""}</div>
                        </div>
                      ))}
                    </div>

                    {/* Past Treatment History */}
                    <div className="content-section mb-4">
                      <h2 className="font-bold mb-2">Past Treatment History</h2>
                      <p className="text-[14px] text-gray-700 leading-relaxed">{caseSheetData.pastHistory}</p>
                    </div>

                    {/* Diagnosis */}
                    <div className="content-section mb-4">
                      <h2 className="font-bold mb-2">Diagnosis</h2>
                      <div className="bg-[#B8BFFF] rounded">
                        <div className="grid grid-cols-3 gap-2 p-2 text-xs text-[#01030F] font-medium">
                          <div>Test Catergories</div>
                          <div>Sub Catergories</div>
                          <div>Remarks</div>
                        </div>
                      </div>

                      {caseSheetData?.investigations?.map((complain, index) => (
                        <div className="grid grid-cols-3 gap-2 p-2 text-[14px] bg-white mx-2 mb-2 rounded" key={index}>
                          <div>{complain?.testCat ?? ""}</div>
                          <div>{complain?.subCat ?? ""}</div>
                          <div>{complain?.advisedRemark ?? ""}</div>
                        </div>
                      ))}
                    </div>

                    {/* Treatment Advice */}
                    <div className="content-section mb-4">
                      <h2 className="font-bold mb-2">Treatment Advice</h2>
                      <p className="text-[14px] text-gray-700 leading-relaxed">
                        {caseSheetData.diagnosis}
                        <br /> {caseSheetData.dietPlan}
                      </p>
                    </div>

                    {/* Medications */}
                    <div className="content-section mb-6">
                      <h2 className="font-bold mb-2">Medications</h2>
                      <div className="bg-[#B8BFFF] rounded">
                        <div className="grid grid-cols-8 gap-2 p-2 text-xs text-[#01030F] font-medium">
                          <div>S.No</div>
                          <div className="col-span-2">Medicine Name</div>
                          <div>Dosage</div>
                          <div>Frequency</div>
                          <div>Timing</div>
                          <div>Duration</div>
                          <div>Quantity</div>
                        </div>
                      </div>

                      {caseSheetData?.medications?.map((medicine, index) => {
                        return (
                          <div key={index} className="bg-white mx-2 mb-2 rounded">
                            <div className="grid grid-cols-8 gap-2 p-2 text-[14px]">
                              <div>{medicine?.id ?? ""}</div>
                              <div className="col-span-2">
                                <p className="font-semibold">{medicine?.name ?? ""}</p>
                                <p className="text-gray-500 text-xs">{medicine?.brand ?? ""}</p>
                              </div>
                              <div>{medicine?.dosage ?? ""}</div>
                              <div>{medicine?.frequency ?? ""}</div>
                              <div>{medicine?.timing ?? ""}</div>
                              <div>{medicine?.duration ?? ""}</div>
                              <div>{medicine?.quantity ?? ""}</div>
                            </div>
                            <div className="h-px bg-[#8F98B3] mb-3" />
                            <p className="text-[14px] text-[#8F98B3] italic px-2 pb-2">Remarks: {medicine?.remarks}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Follow up */}
                    <div className="content-section p-6">
                      <h2 className="text-[#01030F] text-[14px] font-semibold mb-2">Follow up</h2>
                      <div className="bg-white">
                        <p className="text-[14px] text-[#01030F] mb-1">
                          Visit to hospital on &nbsp;
                          <span className="font-semibold">
                            {formatDateForDisplay(caseSheetData?.followup?.followdate) ?? ""}
                          </span>
                        </p>
                        <p className="text-[14px] text-[#01030F]">
                          Remark : {caseSheetData?.followup?.followremark ?? ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SCREEN ONLY - Original Footer */}
                  <div className="screen-only-footer grid grid-cols-3 items-center mt-8 pt-6 border-t">
                    <div />
                    <p className="text-xs text-[#8F98B3] font-medium text-center"></p>
                    <div className="flex flex-col items-center ml-auto w-fit">
                      {docSign ? (
                        <img src={docSign} alt="doctor-signature" className="w-24 h-12 object-contain mb-1" />
                      ) : (
                        <p className="font-script text-lg mb-1">sign</p>
                      )}
                      <p className="text-[14px] font-medium text-black text-center">Signature</p>
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

export default Pdf;
