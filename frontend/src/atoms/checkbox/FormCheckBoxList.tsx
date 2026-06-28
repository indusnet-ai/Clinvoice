import React from "react";

type Item = {
  label: string;
  name: string; // formik path e.g. "investigations.xray"
};

type Props = {
  items: Item[];
  values: any; // formik values
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  disabled?: boolean;

  layout?: "row" | "wrap" | "column";
  className?: string;

  // optional extra UI (ex: show input when bloodTests checked)
  renderAfterItem?: (itemName: string) => React.ReactNode;
};

const layoutMap = {
  row: "flex gap-6",
  wrap: "flex gap-6 flex-wrap",
  column: "flex flex-col gap-3",
};

const getByPath = (obj: any, path: string) => path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);

export const FormCheckboxList: React.FC<Props> = ({
  items,
  values,
  setFieldValue,
  disabled = false,
  layout = "wrap",
  className = "",
  renderAfterItem,
}) => {
  return (
    <div className={`${layoutMap[layout]} ${className}`}>
      {items.map((item) => {
        const checked = !!getByPath(values, item.name);

        return (
          <div key={item.name} className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setFieldValue(item.name, e.target.checked)}
                className="w-4 h-4"
                disabled={disabled}
              />
              <span className="text-[14px]">{item.label}</span>
            </label>

            {renderAfterItem ? renderAfterItem(item.name) : null}
          </div>
        );
      })}
    </div>
  );
};
