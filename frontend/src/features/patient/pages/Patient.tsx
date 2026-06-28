import { Button } from "@/atoms";
import { useLanguage } from "@/language/context/LanguageContext";
import { DataTable, NoDataFallBack, Pagination, PatientAvatar } from "@/app/component";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AddPatientDialog from "./AddPatientDialog";
import { useGetPatientListQuery } from "../services/PatientApi";
import { PatientData } from "../types";
import { genderFormatter } from "@/utils";
import { EditIcon } from "@/assets/icons";
import DeleteDialog from "./DeleteDialog";

const Patient = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [openPatientDialog, setOpenPatientDialog] = useState(false);
  const [patientList, setPatientList] = useState<PatientData[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedID, setSelectedID] = useState(0);
  const [selectedData, setSelectedData] = useState<PatientData | null>(null);
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    page: 1,
    limit: 10,
    from_date: undefined,
    to_date: undefined,
    gender_filter: undefined,
  });

  const { data: patientData } = useGetPatientListQuery({ limit: filters.limit, page: filters.page });

  useEffect(() => {
    if (patientData) {
      setPatientList(patientData?.data);
    }
  }, [patientData]);
  const totalCount = patientData?.count;

  const handleConsultant = (id: number) => {
    navigate(`/consultation?patient_id=${id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <h1 className="text-[#01030F] font-semibold text-[18px]">{t("patientList.title")}</h1>
        <Button onClick={() => setOpenPatientDialog(true)} label={t("patientList.newPatient")} />
      </div>

      <div className="mt-4">
        <DataTable
          height="100vh"
          columns={[
            {
              field: "sno",
              headerName: `${t("appointment.table.serialNumber")}`,
              minWidth: 50,
              renderCell: (row) => {
                const index = patientList?.findIndex((r) => r?.id === row?.id);
                const serial = (filters.page - 1) * filters.limit + index + 1;
                return <span>{serial || ""}</span>;
              },
            },
            {
              field: "patient_name",
              headerName: `${t("appointment.table.patientName")}`,
              minWidth: 150,
              renderCell: (row) => (
                <div className="flex items-center gap-2 w-full cursor-pointer" onClick={() => handleConsultant(row.id)}>
                  <PatientAvatar imageName={row?.image} name={row?.patient_name} />
                  <div>
                    <p className="text-[#01030F] text-[12px] font-semibold">{row?.patient_name}</p>
                    <p className="text-[#5B657A] text-[12px] font-medium text-nowrap">
                      PT{row?.id} | {row?.age} {t("patient.years")} | {genderFormatter(row?.gender)}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              field: "patient_id",
              headerName: `${t("patient.patientid")}`,
              minWidth: 120,
              renderCell: (row) => (
                <span className="text-[#6070FF] cursor-pointer" onClick={() => handleConsultant(row.id)}>
                  PT{row?.id}
                </span>
              ),
            },
            {
              field: "mobile_no",
              headerName: `${t("patient.mobile")}`,
              minWidth: 150,
            },
            {
              field: "email",
              headerName: `${t("patient.email")}`,
              minWidth: 150,
            },
            {
              field: "address",
              headerName: `${t("patient.address")}`,
              minWidth: 150,
              maxWidth: 150,
              renderCell: (row) => {
                const address = row?.address || "";
                return (
                  <div className="w-full truncate" title={address ?? ""}>
                    {address}
                  </div>
                );
              },
            },
            {
              field: "Action",
              headerName: `${t("patient.action")}`,
              minWidth: 150,
              renderCell: (row) => {
                return (
                  <div className="flex gap-2 items-center">
                    <p>
                      <span>
                        <EditIcon
                          onClick={() => {
                            setSelectedData(row);
                            setOpenPatientDialog(true);
                          }}
                        />
                      </span>
                    </p>
                  </div>
                );
              },
            },
          ]}
          rows={patientList}
        />
        {patientList?.length === 0 ? (
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
      <AddPatientDialog
        open={openPatientDialog}
        onClose={() => {
          setSelectedData(null);
          setOpenPatientDialog(false);
        }}
        selectedData={selectedData}
      />
      <DeleteDialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
        }}
        selectedID={selectedID}
      />
    </div>
  );
};

export default Patient;
