import { Button, CheckboxInput, FormInput, FormTimePicker, SearchableSelect } from "@/atoms";
import { Form, Formik } from "formik";
import React, { useEffect } from "react";
import { DurationOptions } from "@/data/dropdown.js";
import {
  useDeleteSlotMutation,
  useGetSlotInfoQuery,
  usePatchSlotInfoMutation,
  usePostSlotInfoMutation,
} from "../services/SettingApi";
import { useAppSelector } from "@/app/hook";
import { SlotValidationSchema } from "../hooks/slotValidation";
import { mapSlotApiToForm } from "../hooks/mapSlotApitoForm";
import { showToast } from "@/utils";
import { skipToken } from "@reduxjs/toolkit/query";
import { useLanguage } from "@/language/context/LanguageContext";

const SlotSetting = () => {
  const user = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const { t } = useLanguage();
  const doctorId = useAppSelector((state) => state.onboard.doctorId) ?? Number(localStorage.getItem("doctor_id"));
  const hospitalId = useAppSelector((state) => state.onboard.hospitalId) ?? Number(localStorage.getItem("hospital_id"));

  const [slotDetails, setSlotDetails] = React.useState(null);
  const [slotId, setSlotId] = React.useState<number | null>(null);
  const [existingSlots, setExistingSlots] = React.useState<Record<string, number>>({});

  const { data: slotData } = useGetSlotInfoQuery(
    hospitalId && doctorId ? { hospitalId: Number(hospitalId), doctorId: Number(doctorId) } : skipToken,
    { refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (slotData?.data?.length) {
      const mapped = mapSlotApiToForm(slotData.data);

      setSlotDetails(mapped);

      const dayMap: Record<string, number> = {};
      slotData.data.forEach((slot) => {
        dayMap[slot.dayname.toLowerCase()] = slot.id;
      });

      setExistingSlots(dayMap);
    }
  }, [slotData]);

  const [postSlot, { isLoading }] = usePostSlotInfoMutation();
  const [patchSlot, { isLoading: isPatchLoading }] = usePatchSlotInfoMutation();
  const [deleteSlot] = useDeleteSlotMutation();

  const DAYS = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <div>
      <h1 className="text-[#01030F] font-semibold text-[16px] mb-4">{t("label.slots")}</h1>
      <div className="bg-[white] min-h-[80vh] p-10 rounded-lg">
        <Formik
          enableReinitialize
          initialValues={
            slotDetails ?? {
              from: "",
              to: "",
              slotDuration: "",
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
            }
          }
          validationSchema={SlotValidationSchema}
          onSubmit={async (values) => {
            const selectedDays = DAYS.filter((d) => values[d.key]).map((d) => d.key);

            const existingDays = Object.keys(existingSlots);

            const daysToDelete = existingDays.filter((day) => !selectedDays.includes(day));

            const daysToCreate = selectedDays.filter((day) => !existingDays.includes(day));

            const daysToUpdate = selectedDays.filter((day) => existingDays.includes(day));

            try {
              /** DELETE unchecked days */
              await Promise.all(
                daysToDelete.map((day) =>
                  deleteSlot({
                    doctor_slot_id: existingSlots[day],
                  }).unwrap(),
                ),
              );

              /** PATCH existing checked days */
              if (daysToUpdate.length) {
                await patchSlot({
                  doctor_id: Number(doctorId),
                  hospital_id: Number(hospitalId),
                  user_id: Number(user),
                  start_time: values.from.length === 5 ? `${values.from}:00` : values.from,
                  end_time: values.to.length === 5 ? `${values.to}:00` : values.to,
                  duration: values.slotDuration,
                }).unwrap();
              }

              /** POST newly checked days */
              if (daysToCreate.length) {
                const slots = daysToCreate.map((day) => ({
                  dayname: day,
                  start_time: values.from.length === 5 ? `${values.from}:00` : values.from,
                  end_time: values.to.length === 5 ? `${values.to}:00` : values.to,
                  duration: values.slotDuration,
                  status: "1",
                }));

                await postSlot({
                  user_id: Number(user),
                  hospital_id: Number(hospitalId),
                  doctor_id: Number(doctorId),
                  slots,
                }).unwrap();
              }

              showToast("Slots updated successfully", "success");
            } catch (err) {
              console.error(err);
              showToast(err?.data?.message || "Failed to update slots", "error");
            }
          }}
        >
          {(formik) => (
            <Form className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
              <FormTimePicker name="from" label={t("label.from")} />
              <FormTimePicker name="to" label={t("label.to")} />
              <SearchableSelect options={DurationOptions} name="slotDuration" label={t("label.duration")} />
              <div className="flex flex-wrap items-center gap-2 justify-between w-full  col-span-3">
                <CheckboxInput label={t("label.monday")} name="monday" />
                <CheckboxInput label={t("label.tuesday")} name="tuesday" />
                <CheckboxInput label={t("label.wednesday")} name="wednesday" />
                <CheckboxInput label={t("label.thursday")} name="thursday" />
                <CheckboxInput label={t("label.friday")} name="friday" />
                <CheckboxInput label={t("label.saturday")} name="saturday" />
                <CheckboxInput label={t("label.sunday")} name="sunday" />
              </div>
              {/* {formik.submitCount > 0 && formik.errors.days && (
                <p className="text-red-500 text-sm mt-2 col-span-3">{formik.errors?.days}</p>
              )} */}
              {formik.submitCount > 0 && typeof formik.errors.days === "string" && (
                <p className="text-red-500 text-sm mt-2 col-span-3">{formik.errors.days}</p>
              )}
              <div className="mt-10 w-full flex justify-end col-span-1 md:col-span-3">
                <Button type="submit" label={t("label.save")} disable={!formik.dirty} />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SlotSetting;
