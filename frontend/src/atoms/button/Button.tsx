import { ButtonArrow } from "@/assets/icons";
import React from "react";

interface ButtonProps {
  variant?: "outlined" | "contained" | "text";
  disable?: boolean;
  onClick?: () => void;
  label?: string;
  isBack?: boolean;
  isNext?: boolean;
  type?: "button" | "reset" | "submit";
  isRecord?: boolean;
  isStop?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  variant = "contained",
  disable = false,
  onClick,
  label,
  isNext,
  isBack,
  type = "button",
  isRecord = false,
  isStop = false,
}) => {
  return (
    <div>
      <button
        className={`text-[16px] font-semibold h-10 transition-transform duration-300 ${
          disable ? `cursor-not-allowed` : `cursor-pointer`
        } ${
          variant === "contained"
            ? `text-white bg-[#6070FF] hover:scale-105`
            : `text-[#6070FF]  border border-[#6070FF]`
        }  px-[34px]  rounded-lg flex gap-2 items-center justify-center`}
        onClick={onClick}
        type={type}
        disabled={disable}
      >
        {isBack && <ButtonArrow className="rotate-180" color="#6070FF" />}
        {label}
        {isNext && <ButtonArrow />}
      </button>
    </div>
  );
};
