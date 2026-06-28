interface ToothInputProps {
  tooth: number;
  fieldName: string;
  values: Record<number, string>;
  setFieldValue: (field: string, value: any) => void;
  labelPosition?: "top" | "bottom";
  disabled?: boolean;
}

export const ToothInput = ({
  tooth,
  fieldName,
  values = {},
  setFieldValue,
  labelPosition = "top",
  disabled,
}: ToothInputProps) => {
  return (
    <div className="flex flex-col items-center">
      {labelPosition === "top" && <span className="text-[10px] mb-0.5 font-semibold text-black">{tooth}</span>}

      <input
        type="text"
        maxLength={2}
        value={values[tooth] || ""}
        disabled={disabled}
        onChange={(e) => setFieldValue(`${fieldName}.${tooth}`, e.target.value.toUpperCase())}
        className="w-[22px] h-[22px] text-center text-[10px]
        border border-gray-500 rounded-[3px] outline-none"
      />

      {labelPosition === "bottom" && <span className="text-[10px] mt-0.5 font-semibold text-black">{tooth}</span>}
    </div>
  );
};
