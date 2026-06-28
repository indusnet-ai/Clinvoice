import React from "react";
import { CloseIcon } from "@/assets/icons";
import { Button, FormDateInput, SearchableSelect } from "@/atoms";
import { CustomDialog } from "@/app/component/CustomDialog";
import { Form, Formik } from "formik";
import { GenderOptions } from "@/data/dropdown.js";
import { useAppSelector } from "@/app/hook";
import * as Yup from "yup";
import { useLanguage } from "@/language/context/LanguageContext";

interface FilterOpdDialogProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  onFilter: (_data: any) => void;
  filters: { from_date?: string; to_date?: string; gender_filter?: string };
}

const FilterOpdDoalog: React.FC<FilterOpdDialogProps> = ({ open, onClose, onFilter, onClear, filters }) => {
  const { t } = useLanguage();
  const hospitalId = useAppSelector((state) => state.auth.hospital_id) ?? Number(localStorage.getItem("hospital_id"));
  const today = new Date().toISOString().split("T")[0];

  const FilterOpdValidationSchema = Yup.object().shape({
    fromDate: Yup.date()
      .transform((value, originalValue) => (originalValue === "" ? null : value))
      .nullable()
      .typeError(t("filter.validation.invalidFromDate"))
      .max(today, t("filter.validation.futureFromDate")),

    toDate: Yup.date()
      .transform((value, originalValue) => (originalValue === "" ? null : value))
      .nullable()
      .typeError(t("filter.validation.invalidToDate"))
      .when("fromDate", (fromDate, schema) =>
        fromDate instanceof Date && !isNaN(fromDate.getTime())
          ? schema.min(fromDate, t("filter.validation.toDateBeforeFromDate"))
          : schema,
      ),
    gender: Yup.string().nullable(),
  });

  return (
    <CustomDialog open={open} onClose={onClose} maxWidth="xl">
      <Formik
        enableReinitialize
        initialValues={{ fromDate: filters.from_date || "", toDate: filters.to_date || "", gender: filters.gender_filter || "" }}
        validationSchema={FilterOpdValidationSchema}
        onSubmit={(values) => {
          onFilter({ from_date: values.fromDate || undefined, to_date: values.toDate || undefined, gender_filter: values.gender || undefined });
          onClose();
        }}
      >
        {(formik) => {
          const showClear = !!formik.values.fromDate || !!formik.values.toDate || !!formik.values.gender;
          return (
            <div className="p-1">
              <div className="flex items-center w-full justify-between">
                <h1 className="text-[#000000] font-semibold text-[16px]">{t("filter.title")}</h1>
                <div className="flex items-center gap-4">
                  {showClear && (
                    <button className="text-[#6070FF] text-[14px] font-medium" onClick={() => { formik.resetForm(); onClear(); }}>
                      {t("filter.clearFilter")}
                    </button>
                  )}
                  <CloseIcon color="#98999E" className="cursor-pointer" onClick={onClose} />
                </div>
              </div>
              <Form className="grid grid-cols-1 md:grid-cols-3 gap-x-6 mt-7">
                <FormDateInput name="fromDate" label={t("filter.fromDate")} maxdate={today} />
                <FormDateInput name="toDate" label={t("filter.toDate")} mindate={formik.values.fromDate} maxdate={today} />
                <SearchableSelect name="gender" options={GenderOptions} label={t("filter.gender")} />
                <div className="mt-5 flex items-center justify-end gap-4 w-full col-span-1 md:col-span-3">
                  <Button label={t("filter.cancel")} variant="outlined" onClick={() => { formik.resetForm(); onClose(); }} />
                  <Button label={t("filter.apply")} variant="contained" onClick={formik.handleSubmit} />
                </div>
              </Form>
            </div>
          );
        }}
      </Formik>
    </CustomDialog>
  );
};

export default FilterOpdDoalog;
