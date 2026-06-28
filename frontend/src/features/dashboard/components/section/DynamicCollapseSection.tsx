import React from "react";
import { FieldArray } from "formik";
import { DropDownIcon, DeleteIcon } from "@/assets/icons";
import { FormUnitInput, TextArea } from "@/atoms";
import { useLanguage } from "@/language/context/LanguageContext";

type FieldType = "input" | "textarea";

interface NormalFieldConfig {
  type: FieldType;
  label?: string;
  name: string;
  placeholder?: string;
}

interface FieldArrayColumn {
  label: string;
  field: string;
  placeholder?: string;
}

interface FieldArrayConfig {
  title?: string;
  name: string;
  columns: FieldArrayColumn[];
  addNewRow?: any;
}

interface DynamicCollapseSectionProps {
  title: string;
  isCollapse?: boolean;
  maxHeight?: string;
  disabled?: boolean;
  isColored?: boolean;
  fields?: NormalFieldConfig[];
  fieldArray?: FieldArrayConfig;
}

const DynamicCollapseSection: React.FC<DynamicCollapseSectionProps> = ({
  title,
  isCollapse = true,
  maxHeight = "600px",
  isColored = true,
  fields = [],
  disabled = false,
  fieldArray,
}) => {
  const [extend, setExtend] = React.useState(true);
  const { t } = useLanguage();

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className={`${isColored ? "bg-[#B8BFFF] py-5" : ""} flex items-center justify-between px-1 rounded-xl`}>
        <text
          className={
            isColored ? "text-[#01030F] text-xs font-semibold pl-2" : "text-[16px] text-[#01030F]  font-semibold"
          }
        >
          {title}
        </text>
        {isCollapse && (
          <DropDownIcon
            className={`transition-transform duration-300 ${extend ? "rotate-180" : ""}`}
            onClick={() => setExtend(!extend)}
          />
        )}
      </div>

      {/* BODY */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          !isCollapse ? "max-h-full opacity-100" : extend ? `max-h-[${maxHeight}] opacity-100` : "max-h-0 opacity-0"
        }`}
      >
        {/* NORMAL FIELDS */}
        {fields.length > 0 && (
          <div className="grid gap-3">
            {fields.map((field, index) => (
              <div key={index}>
                {field.type === "input" && (
                  <FormUnitInput
                    name={field.name}
                    placeholder={field.placeholder || field.label}
                    type="text"
                    disabled={disabled}
                  />
                )}

                {field.type === "textarea" && (
                  <TextArea
                    label={field.label || ""}
                    name={field.name}
                    placeholder={field.placeholder || "Type Here..."}
                    disabled={disabled}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* FIELD ARRAY TABLE */}
        {fieldArray && (
          <div className="mt-4">
            {fieldArray.title && <p className="text-[#01030F] text-[14px] font-semibold mb-2">{fieldArray.title}</p>}

            <FieldArray name={fieldArray.name}>
              {({ push, remove, form }) => (
                <>
                  {/* TABLE HEADER */}
                  <div
                    className="grid bg-[#B8BFFF] text-[#01030F] text-[14px] font-medium py-4 px-2 items-center text-center rounded-md"
                    style={{
                      gridTemplateColumns: `repeat(${fieldArray.columns.length}, 1fr) 60px`,
                    }}
                  >
                    {fieldArray.columns.map((col, idx) => (
                      <p key={idx}>{col.label}</p>
                    ))}
                    <p>{t("casesheet.action")}</p>
                  </div>

                  {/* TABLE ROWS */}
                  {form?.values?.[fieldArray.name]?.map((_: any, index: number) => (
                    <div
                      key={index}
                      className="grid gap-2 bg-[#FBFBFF] items-center py-4 mt-2 px-2 rounded-xl"
                      style={{
                        gridTemplateColumns: `repeat(${fieldArray.columns.length}, 1fr) 60px`,
                      }}
                    >
                      {fieldArray.columns.map((col, colIndex) => (
                        <FormUnitInput
                          key={colIndex}
                          name={`${fieldArray.name}.${index}.${col.field}`}
                          placeholder={col.placeholder || col.label}
                          type="text"
                          disabled={disabled}
                        />
                      ))}

                      {/* DELETE */}
                      {!disabled && (
                        <div className="flex justify-center">
                          {form.values[fieldArray.name].length > 1 && (
                            <DeleteIcon className="cursor-pointer text-red-500" onClick={() => remove(index)} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* ADD NEW */}
                  {!disabled && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => push(fieldArray.addNewRow)}
                        className="text-blue-600 text-sm font-medium"
                      >
                        {t("casesheet.addNew")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </FieldArray>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicCollapseSection;
