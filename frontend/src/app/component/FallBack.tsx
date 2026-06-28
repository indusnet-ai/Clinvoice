import React from "react";
import warningImg from "@/assets/imgs/warning.png";

export const FallBack = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center">
      <div>
        <img src={warningImg} alt="something went wrong image" />
        <p className="text-[#01030F] font-semibold text-[16px] mt-10">Something went worng</p>
      </div>
    </div>
  );
};
