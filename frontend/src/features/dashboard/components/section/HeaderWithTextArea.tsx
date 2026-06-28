import { DropDownIcon } from "@/assets/icons";
import { TextArea } from "@/atoms";
import React from "react";

interface HeaderWithTextAreaPropa {
  title?: string;
  data?: any;
  isColored?: boolean;
  name?: string;
  label?: string;
  placeholder?: string;
  isCollapse?: boolean;
  disabled: boolean;
}

const HeaderWithTextArea: React.FC<HeaderWithTextAreaPropa> = ({
  isCollapse = false,
  title,
  isColored = true,
  name = "",
  label = "",
  placeholder,
  disabled = false,
}) => {
  const [extend, setExtend] = React.useState(true);
  return (
    <div className="bg-white rounded-xl p-2">
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

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out
                    ${extend ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        {/* Table Inputs */}
        <div className="grid gap-2 bg-[#FBFBFF] py-4 mt-2 px-2 rounded-xl">
          <TextArea label={label} name={name} placeholder={placeholder} disabled={disabled} />
        </div>
      </div>
    </div>
  );
};

export default HeaderWithTextArea;
