import React from "react";

type Option = {
  label: string;
  value: string;
};

type Props = {
  name: string; // formik field name
  value: string; // current value (values[name])
  options: Option[];

  onChange: (value: string) => void;

  disabled?: boolean;
  layout?: "row" | "column" | "wrap";
  className?: string;
};

const layoutMap = {
  row: "flex gap-4",
  column: "flex flex-col gap-3",
  wrap: "flex gap-4 flex-wrap",
};

export const SingleSelectCheckbox: React.FC<Props> = ({
  name,
  value,
  options,
  onChange,
  disabled = false,
  layout = "wrap",
  className = "",
}) => {
  return (
    <div className={`${layoutMap[layout]} ${className}`}>
      {options.map((opt) => {
        const checked = value === opt.value;

        return (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer bg-[#FBFBFF] px-3 py-2 rounded">
            <input
              type="checkbox"
              name={name}
              value={opt.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(checked ? "" : opt.value)}
              className="w-4 h-4"
            />
            <span className="text-[#666666] text-[14px]">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
};
