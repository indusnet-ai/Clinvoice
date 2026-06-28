import { DropDownIcon, ExportIcon, FilterIcon, StatisticIcon, UserIcon } from "@/assets/icons";
import React, { use, useEffect, useState } from "react";
import { DataTable, DatePicker, NoDataFallBack, Pagination, StatCard } from "../../../app/component";
import { TabItem, Tabs } from "../../../app/component/Tabs";
import { genderFormatter, normalizeStatus, showToast, statusColor, StatusRenamer } from "@/utils";
import { useLocation, useNavigate } from "react-router";
import { useLanguage } from "@/language/context/LanguageContext";
import { useGetDashboardStatsQuery, useGetOPDListQuery, usePatchOpdStatusMutation } from "../services/DashbaordApi";
import NewOpdDialog from "../components/NewOpdDialog";
import { useDispatch } from "react-redux";
import { restoreActiveStep, setActiveStep } from "../../onboard/services/OnBoardSlice";
import { useAppSelector } from "@/app/hook";
import { DashboardStats, OpdData } from "../types";
import { useGetDoctorInfoQuery } from "../../onboard/services/OnBoardApi";
import { setDoctorId } from "../services/DashboardSlice";
import FilterOpdDoalog from "../components/FilterOpdDialog";
import AddPatientDialog from "@/app/component/AddPatientDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import { PatientData } from "../../patient/types";

interface OutPatientStat {
  id: string;
  label: string;
  value: number;
  changePercent: number;
}

const APPOIN_TABS = [
  { label: "all", value: "#all" },
  { label: "pending", value: "#pending" },
  { label: "completed", value: "#completed" },
];

const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("#all");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [newPatientMobile, setNewPatientMobile] = useState<{
    dialCode: string;
    number: string;
  } | null>(null);
  const [newPatientData, setNewPatientData] = useState<PatientData | null>(null);

  const hospitalId = useAppSelector((state) => state.auth.hospital_id) ?? localStorage.getItem("hospital_id");
  //for dialog
  const [openOpd, setOpenOpd] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [openAddPatient, setOpenAddPatient] = useState(false);

  const handleTabChange = (tab: TabItem) => {
    // call API / filter table here
  };

  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    page: 1,
    limit: 10,
    from_date: undefined,
    to_date: undefined,
    gender_filter: undefined,
  });

  const { data: Dashboarddata, isLoading: dashboardLoading } = useGetDashboardStatsQuery({});
  const { data: doctorData } = useGetDoctorInfoQuery({
    limit: 1,
    page: 1,
    search: "",
  });
  const doctorDetails = doctorData?.data?.length ? doctorData.data[0] : null;
  const statsData: DashboardStats = Dashboarddata?.data;

  const stats = [
    {
      id: "1",
      label: t("appointment.stats.total"),
      value: statsData?.total_today ?? 0,
      changePercent: statsData?.total_change_percent ?? 0,
    },
    {
      id: "2",
      label: t("appointment.stats.pending"),
      value: statsData?.pending_today ?? 0,
      changePercent: statsData?.pending_change_percent ?? 0,
    },
    {
      id: "3",
      label: t("appointment.stats.completed"),
      value: statsData?.completed_today ?? 0,
      changePercent: statsData?.completed_change_percent ?? 0,
    },
  ];
  const [fileDownload, { isLoading: isProfilePicLoading }] = useDownloadFileMutation();

  const { data: OPDdata, isLoading } = useGetOPDListQuery({
    hospitalId: Number(hospitalId),
    page: filters.page,
    limit: filters.limit,
    filter_by_status: filters.status,
    ...filters,
  });

  const [patchOpdStatus] = usePatchOpdStatusMutation();

  useEffect(() => {
    if (doctorDetails) {
      dispatch(setDoctorId(doctorDetails.id));
      localStorage.setItem("doctor_id", doctorDetails?.id.toString());
    }
  }, [doctorDetails]);

  useEffect(() => {
    switch (location.hash) {
      case "#pending":
        setFilters((prev) => ({ ...prev, status: "pending", page: 1 }));
        break;

      case "#completed":
        setFilters((prev) => ({ ...prev, status: "completed", page: 1 }));
        break;

      default:
        setFilters((prev) => ({ ...prev, status: undefined, page: 1 }));
    }
  }, [location.hash]);

  const rowData = OPDdata?.data || [];
  const totalCount = OPDdata?.total ?? 0;

  // Debug logging for OPD data to verify counts
  useEffect(() => {
    if (OPDdata) {
      // Count by status
      const pendingCount = rowData.filter(
        (opd) => opd.opd_status?.toLowerCase() === "pending" || opd.opd_status?.toLowerCase() === "start",
      ).length;
      const completedCount = rowData.filter((opd) => opd.opd_status?.toLowerCase() === "completed").length;
    }
  }, [OPDdata, rowData, totalCount]);

  const handleChangeStatus = async (opd_id, status) => {
    await patchOpdStatus({ opd_id, status });
  };

  const handleExportPdf = () => {
    if (rowData?.length === 0) {
      showToast("No records to export", "info");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");

    // Title
    doc.setFontSize(14);
    doc.text("OPD Report", 14, 15);

    // Table header
    const head = [
      ["S.No", "Patient Name", "OPD No", "Time Slot", "Mobile", "Consultant", "Email ID", "Token", "Status"],
    ];

    // Table body (replace with your real data)
    const body = rowData?.map((item, index) => {
      const formattedStatus = StatusRenamer(item?.opd_status ?? "");
      return [
        index + 1,
        item?.patient_name,
        item?.id,
        item?.time,
        item?.patient_mobile,
        item?.doctor_name,
        item?.patient_email,
        item?.token,
        t(formattedStatus),
      ];
    });

    autoTable(doc, {
      head,
      body,
      startY: 25,
      styles: {
        fontSize: 9,
      },
    });

    doc.save("OPD.pdf");
  };

  const fetchPatientImage = async (imageName: string) => {
    if (!imageName || imageMap[imageName]) return;

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

      setImageMap((prev) => ({
        ...prev,
        [imageName]: imageUrl,
      }));
    } catch (err) {
      console.error("Image download failed", err);
    }
  };

  useEffect(() => {
    rowData?.forEach((patient) => {
      if (patient?.patient_image) {
        fetchPatientImage(patient?.patient_image);
      }
    });
  }, [rowData, OPDdata]);

  const isFilterApplied = !!filters.from_date || !!filters.to_date || !!filters.gender_filter;
  const isFilterActive = openFilter || isFilterApplied;
  return (
    <div>
      <h1 className="text-[#01030F] py-4 font-semibold text-[18px]">{t("appointment.title")}</h1>
      {/* dashboard and calendar */}
      <div className="flex flex-col items-center justify-between md:flex-row gap-y-4 md:gap-x-8 md:gap-y-0">
        <div className="flex gap-4 w-full">
          {stats.map((stat: OutPatientStat, index) => {
            return <StatCard key={index} label={stat.label} value={stat.value} changePercent={stat.changePercent} />;
          })}
        </div>
        <div className="w-full md:w-[50%]">
          <DatePicker
            selectedDate={selectedDate}
            setSelectedDate={(date: any) => {
              setSelectedDate(date);

              if (!date) return;

              const formatted = formatDate(date.actual);

              setFilters((prev) => ({
                ...prev,
                from_date: formatted,
                to_date: formatted,
                page: 1, // reset pagination
              }));
            }}
          />
        </div>
      </div>
      {/* tabs and action buttons */}
      <div className="pt-4 flex items-center justify-between">
        <Tabs tabs={APPOIN_TABS} defaultTab="#all" onChange={handleTabChange} />
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <button
              className="py-2.5 text-[#6070FF] text-[14px] font-medium px-[17px] border border-[#6070FF] border-r-0 rounded-tl-lg rounded-bl-lg flex gap-1 items-center"
              onClick={handleExportPdf}
            >
              {t("appointment.actions.export")} <ExportIcon />
            </button>
            <button
              className={`py-2.5 text-[14px] font-medium px-[17px] border rounded-tr-lg rounded-br-lg flex gap-1 items-center transition-colors
    ${
      isFilterActive ? "bg-[#D6DCFF] text-[#6070FF] border-[#6070FF]" : "bg-transparent text-[#6070FF] border-[#6070FF]"
    }
  `}
              onClick={() => setOpenFilter(true)}
            >
              {t("appointment.actions.filter")} <FilterIcon />
            </button>
          </div>
          <button
            onClick={() => setOpenOpd(true)}
            className="py-2.5 text-[#FFFFFF] text-[14px] font-medium px-[30px] border bg-[#6070FF] rounded-lg flex gap-1 items-center"
          >
            + {t("appointment.actions.createOpd")}
          </button>
        </div>
      </div>

      {/* table and pagination */}
      <div className="mt-4">
        <DataTable
          columns={[
            {
              field: "sno",
              headerName: `${t("appointment.table.serialNumber")}`,
              minWidth: 50,
              renderCell: (row) => {
                const index = rowData?.findIndex((r) => r?.id === row?.id);
                const serial = (filters.page - 1) * filters.limit + index + 1;
                return <span>{serial || ""}</span>;
              },
              // pinned: "left",
            },
            {
              field: "patient_name",
              headerName: `${t("appointment.table.patientName")}`,
              minWidth: 150,
              renderCell: (row: OpdData) => {
                const patientImage = row?.patient_image;
                const imageUrl = patientImage ? imageMap[patientImage] : null;
                const rawStatus = row.opd_status ?? "";
                const formattedStatus = StatusRenamer(rawStatus);
                return (
                  <div
                    className="flex items-center gap-2 w-full cursor-pointer"
                    onClick={() => {
                      // if (formattedStatus === "Start Now") {
                      //   handleChangeStatus(row?.id, "start");
                      // }
                      navigate(`/consultation?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-[#d2dbe9] flex items-center justify-center">
                      {!imageUrl ? (
                        <UserIcon className="w-8 h-8" />
                      ) : (
                        <img
                          src={imageUrl}
                          alt={row?.patient_name ?? ""}
                          className="h-10 w-10 rounded-full bg-[#B4D1C4]"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-[#01030F] text-[12px] font-semibold">
                        {row?.patient_salutation} &nbsp;
                        {row?.patient_name}
                      </p>
                      <p className="text-[#5B657A] text-[12px] font-medium text-nowrap">
                        PT{row?.patient_id} | {row?.patient_age} Years | {genderFormatter(row?.gender)}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              field: "opno",
              headerName: `${t("appointment.table.opNumber")}`,
              minWidth: 120,
              renderCell: (row) => {
                const rawStatus = row.opd_status ?? "";
                const formattedStatus = StatusRenamer(rawStatus);
                return (
                  <span
                    // onClick={() => navigate(`/consultation?patient_id=${row?.patient_id}&opd_id=${row?.id}`)}
                    // onClick={() => {
                    //   if (formattedStatus === "Start Now") {
                    //     handleChangeStatus(row?.id, "start");
                    //   }
                    //   navigate(`/consultation?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                    // }}
                    className="text-[#6070FF] cursor-pointer"
                    onClick={() => {
                      // if (formattedStatus === "Start Now") {
                      //   handleChangeStatus(row?.id, "start");
                      // }
                      navigate(`/consultation?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                    }}
                  >
                    {row?.id}
                  </span>
                );
              },
            },
            {
              field: "timeslot",
              headerName: t("appointment.table.timeSlot"),
              renderCell(row) {
                const formatTime24Hr = (time: string) => {
                  if (!time) return "--";
                  const [h, m] = time.split(":").map(Number);
                  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                };

                return (
                  <span>
                    {formatTime24Hr(row?.slot_start_time)} - {formatTime24Hr(row?.slot_end_time)}
                  </span>
                );
              },
              minWidth: 150,
            },
            {
              field: "patient_mobile",
              headerName: `${t("appointment.table.mobileNumber")}`,
              minWidth: 150,
            },
            {
              field: "doctor_name",
              headerName: `${t("appointment.table.consultantName")}`,
              minWidth: 150,
            },
            {
              field: "patient_email",
              headerName: `${t("appointment.table.emailId")}`,
              minWidth: 150,
            },
            {
              field: "token",
              headerName: `${t("appointment.table.tokenNumber")}`,
              minWidth: 150,
              renderCell: (row) => {
                const token = String(row.token).padStart(2, "0");
                return <div className="">{token || ""}</div>;
              },
            },

            {
              field: "opd_status",
              headerName: `${t("appointment.table.status")}`,
              pinned: "right",
              renderCell: (row) => {
                const rawStatus = row.opd_status ?? "";
                // const key = normalizeStatus(rawStatus);
                const formattedStatus = StatusRenamer(rawStatus);
                const { textColor, bgColor } = statusColor[formattedStatus] ?? statusColor.default;

                return (
                  <button
                    className="px-2.5 py-[3px] rounded-full text-[12px] font-medium text-nowrap min-w-[87px]"
                    style={{
                      color: textColor,
                      backgroundColor: bgColor,
                    }}
                    onClick={() => {
                      if (formattedStatus === "appointment.status.startNow") {
                        handleChangeStatus(row?.id, "start");
                      }
                      navigate(`/consultation?patient_id=${row?.patient_id}&opd_id=${row?.id}`);
                    }}
                  >
                    {t(formattedStatus) ?? ""}
                  </button>
                );
              },
            },
          ]}
          rows={rowData}
        />
        {rowData.length === 0 ? (
          <div className="min-h-[45vh] flex items-center justify-center w-full bg-[white]">
            <NoDataFallBack />
          </div>
        ) : (
          <Pagination
            page={filters.page}
            pageSize={filters.limit}
            total={totalCount}
            onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
            onPageSizeChange={(pageSize) => setFilters((p) => ({ ...p, limit: pageSize }))}
          />
        )}
      </div>

      <NewOpdDialog
        open={openOpd}
        onClose={() => {
          setOpenOpd(false);
        }}
        setOpenAddPatient={setOpenAddPatient}
        setNewPatientMobile={setNewPatientMobile}
        patientData={newPatientData}
      />
      <AddPatientDialog
        open={openAddPatient}
        onClose={() => {
          setOpenAddPatient(false);
        }}
        setOpenOpd={setOpenOpd}
        prefillMobile={newPatientMobile}
        onPatientCreated={(patient) => {
          setNewPatientData(patient); // KEY
          setOpenAddPatient(false);
          setOpenOpd(true);
        }}
      />
      <FilterOpdDoalog
        open={openFilter}
        onClose={() => {
          setOpenFilter(false);
        }}
        onFilter={(data) => {
          setFilters((prev) => ({
            ...prev,
            ...data,
            page: 1, // reset pagination on filter
          }));
        }}
        onClear={() => {
          setFilters({
            page: 1,
            limit: filters.limit,
            status: filters.status, // keep tab status
            from_date: undefined,
            to_date: undefined,
            gender_filter: undefined,
          });
          setSelectedDate(null);
        }}
        filters={filters}
      />
    </div>
  );
}
