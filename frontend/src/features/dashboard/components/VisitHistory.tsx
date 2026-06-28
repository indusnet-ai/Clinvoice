import React, { useState } from "react";
import { useLanguage } from "@/language/context/LanguageContext";
import { DataTable } from "@/app/component";
import { formatDateForDisplay, statusColor, StatusRenamer } from "@/utils";
import type { VisitHistory as VisitHistoryRow } from "../types";
import { useLocation, useNavigate } from "react-router";
import { usePatchOpdStatusMutation } from "../services/DashbaordApi";
import PDFImage from "./section/PDFImage";
import { useGetHospitalInfoQuery } from "@/features/onboard/services/OnBoardApi";

interface VisitHistoryProps {
  VisitData: VisitHistoryRow[] | null;
  spec?: string;
  pdfImgData?: any;
}

const VisitHistory: React.FC<VisitHistoryProps> = ({ VisitData, spec, pdfImgData }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get("patient_id");
  const [patchOpdStatus] = usePatchOpdStatusMutation();
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    page: 1,
    limit: 1000,
    from_date: undefined,
    to_date: undefined,
    gender_filter: undefined,
  });
  const { data: hosData } = useGetHospitalInfoQuery({ limit: 1, page: 1 });
  const hospitalData = hosData?.data?.[0];

  const [activeTab, setActiveTab] = useState("summary");
  const handleChangeStatus = async (opd_id, status) => {
    await patchOpdStatus({ opd_id, status });
  };

  return (
    <div>
      <div className="mt-4">
        <DataTable
          columns={[
            {
              field: "sno",
              headerName: `${t("visithistory.serialNumber")}`,
              minWidth: 50,
              renderCell: (row) => {
                const index = VisitData?.findIndex((r) => r?.id === row?.id);
                const serial = (filters.page - 1) * filters.limit + index + 1;
                return <span>{serial || ""}</span>;
              },
            },
            {
              field: "id",
              headerName: t("visithistory.opNumber"),
              minWidth: 150,
            },
            {
              field: "doctor_name",
              headerName: t("visithistory.doctorName"),
              minWidth: 120,
            },
            {
              field: "time",
              headerName: t("visithistory.timeSlot"),
              renderCell(row) {
                const formatTime24Hr = (time: string) => {
                  if (!time) return "--";
                  const [h, m] = time.split(":").map(Number);
                  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                };
                const formattedDate = row?.date ? formatDateForDisplay(row?.date) : "--";
                return (
                  <div className="flex justify-start">
                    {/* inline-block is the KEY */}
                    <div className="inline-block">
                      <p className="text-xs text-gray-800 text-left">
                        {formatTime24Hr(row?.slot_start_time)} - {formatTime24Hr(row?.slot_end_time)}
                      </p>

                      <p className="text-[11px] text-gray-600 text-center">{formattedDate}</p>
                    </div>
                  </div>
                );
              },
              minWidth: 150,
            },
            {
              field: "opd_status",
              headerName: t("visithistory.status"),
              minWidth: 150,
              renderCell: (params: any) => {
                const status = params?.opd_status;
                const formattedStatus = StatusRenamer(status);
                const { bgColor, textColor } = statusColor[formattedStatus] || statusColor.default;

                return (
                  <button
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: textColor,
                      backgroundColor: bgColor,
                    }}
                    onClick={() => {
                      if (formattedStatus === "appointment.status.startNow") {
                        handleChangeStatus(params?.id, "start");
                      }
                      if (
                        formattedStatus === "appointment.status.startNow" ||
                        formattedStatus === "appointment.status.inprocess"
                      ) {
                        navigate(`/consultation?patient_id=${params?.patient_id}&opd_id=${params?.id}`, {
                          state: { from: "visithistory" },
                          replace: false,
                        });
                      }
                    }}
                  >
                    {t(formattedStatus) ?? ""}
                  </button>
                );
              },
            },

            {
              field: "Action",
              headerName: t("visithistory.action"),
              align: "center",
              renderCell: (row) => {
                // Only show actions if the consultation is completed
                const isCompleted = row?.opd_status?.toLowerCase().trim() === "completed";

                if (!isCompleted) {
                  return null;
                }

                return (
                  <div className="flex gap-[70px] items-center">
                    {/* <button
                      onClick={() => {
                        navigate(`/visithistory/summary?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                        setActiveTab("summary");
                      }}
                      className={`text-[12px] font-medium text-[#6070FF]`}
                    >
                      Summary
                    </button> */}

                    <button
                      onClick={() => {
                        setActiveTab("soap");
                        navigate(`/visithistory/soapnotes?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                      }}
                      className={`text-[12px] font-medium text-[#6070FF] `}
                    >
                      {t("visithistory.soapNotes")}
                    </button>
                    {spec === "1" && (
                      <button
                        onClick={() => {
                          navigate(`/visithistory/pdf?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                          setActiveTab("pdf");
                        }}
                        className={`text-[12px] font-medium text-[#6070FF]`}
                      >
                        <div>
                          <PDFImage
                            hospitalName={hospitalData?.name || ""}
                            hospitalAddress1="No 9A, Kanagam Road, MGR Nagar, Chennai, Tamil Nadu,"
                            hospitalAddress2="Chennai, Tamilnadu, India, 600113"
                            patientName="Maha"
                            patientId="PT104"
                            age="26"
                            gender="Female"
                            email="maha@clinvoice.com"
                            address="Kaanagam road"
                            doctorName="Praveenganth"
                            chiefComplaints="Fever for one week"
                          />
                        </div>
                      </button>
                    )}
                    {spec === "2" && (
                      <button
                        onClick={() => {
                          navigate(`/visithistory/dentalpdf?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                          setActiveTab("dentalpdf");
                        }}
                        className="text-[12px] font-medium text-[#6070FF]"
                      >
                        <div className="w-[70px] h-[70px] overflow-hidden rounded-xl border border-gray-200 bg-white cursor-pointer">
                          <div className=" ">
                            <PDFImage
                              hospitalName={hospitalData?.name || ""}
                              hospitalAddress1="No 9A, Kanagam Road, MGR Nagar, Chennai, Tamil Nadu,"
                              hospitalAddress2="Chennai, Tamilnadu, India, 600113"
                              patientName="Maha"
                              patientId="PT104"
                              age="26"
                              gender="Female"
                              email="maha@clinvoice.com"
                              address="Kaanagam road"
                              doctorName="Praveenganth"
                              chiefComplaints="Fever for one week"
                            />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                );
              },
            },
          ]}
          rows={VisitData}
        />
        {/* {getVisitData?.length === 0 ? (
          <div className="min-h-[45vh] flex items-center justify-center w-full bg-[white]">
            <NoDataFallBack />
          </div>
        ) : (
          <Pagination
            page={filters.page}
            pageSize={filters.limit}
            total={100}
            onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
            onPageSizeChange={(pageSize) => setFilters((p) => ({ ...p, limit: pageSize }))}
          />
        )} */}
      </div>
    </div>
  );
};

export default VisitHistory;
