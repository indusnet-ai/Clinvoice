// components/form/CheckboxInput.tsx
import React from "react";
import { useField, useFormikContext } from "formik";

interface Props {
  label: string;
  name: string;
}

export const CheckboxInput = ({ label, ...props }: Props) => {
  const [field] = useField({ ...props, type: "checkbox" });
  const { setFieldError } = useFormikContext<any>();

  return (
    <div className="mb-4 flex items-center gap-2">
      <input
        type="checkbox"
        {...field}
        onChange={(e) => {
          field.onChange(e);
          setFieldError("days", undefined); // clear group error
        }}
        className="focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
      />

      <label className="font-medium">{label}</label>
    </div>
  );
};
