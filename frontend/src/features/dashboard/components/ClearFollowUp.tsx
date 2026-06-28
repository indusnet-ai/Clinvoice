import { useFormikContext } from "formik";
import { DeleteIcon, RefreshIcon } from "@/assets/icons";

export const ClearFollowUpButton = () => {
  const { setFieldValue } = useFormikContext<any>();

  const handleClear = () => {
    setFieldValue("followup.day", "");
    setFieldValue("followup.day.unit", "days"); // reset to default
    setFieldValue("followup.followdate", "");
    setFieldValue("followup.followremark", "");
    setFieldValue("followup.day", {
      value: "",
      unit: "days", // default unit
    });
  };

  return (
    <div className="flex justify-center">
      <RefreshIcon className="cursor-pointer" onClick={handleClear} />
    </div>
  );
};
