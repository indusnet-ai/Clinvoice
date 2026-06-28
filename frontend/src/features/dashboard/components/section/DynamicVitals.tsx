import React from "react";

type Field = {
  label: string;
  name: string;
  placeholder?: string;
};

type Props = {
  fields: Field[];

  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;

  disabled?: boolean;

  InputComponent?: React.ComponentType<any>; // optional custom input (FormUnitInput etc)
};

export const DynamicVitalsTable: React.FC<Props> = ({
  fields,
  values,
  setFieldValue,
  disabled = false,
  InputComponent,
}) => {
  return (
    <div className="w-full">
      {/* Header Row */}
      <div
        className={`grid bg-[#B8BFFF] text-[#01030F] text-[14px] font-medium py-4 px-2 rounded-md text-center`}
        style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr)` }}
      >
        {fields.map((field) => (
          <p key={field.name}>{field.label}</p>
        ))}
      </div>

      {/* Input Row */}
      <div
        className={`grid gap-2 bg-[#FBFBFF] items-center py-4 mt-2 px-2 rounded-md`}
        style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr)` }}
      >
        {fields.map((field) => (
          <div key={field.name}>
            {InputComponent ? (
              <InputComponent name={field.name} disabled={disabled} placeholder={field.placeholder} />
            ) : (
              <input
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
                value={values[field.name] ?? ""}
                placeholder={field.placeholder || ""}
                disabled={disabled}
                onChange={(e) => setFieldValue(field.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
