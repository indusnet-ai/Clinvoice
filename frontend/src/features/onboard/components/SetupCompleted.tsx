import React from "react";
import stepCompletedImg from "@/assets/imgs/welcome_setup.png";

export const SetupCompleted = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div>
        <img src={stepCompletedImg} alt="onboard completed" />
        <h1 className="text-center mt-15 text-[#01030F] text-[16px] font-semibold">
          Congratulations! Setup completed <br /> successfully
        </h1>
      </div>
    </div>
  );
};
