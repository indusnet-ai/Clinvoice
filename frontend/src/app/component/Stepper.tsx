import React from "react";

interface StepperProps {
  steps: string[];
  activeStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, activeStep }) => {
  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="relative w-full max-w-5xl">
        <div className="flex justify-between items-center w-full">
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === activeStep;
            const isCompleted = activeStep > stepNum;

            return (
              <div key={label} className="flex flex-col items-center relative w-full transition-all duration-300">
                {/* CONNECTOR LINE SEGMENT */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-3.5 left-[50%] w-full h-[7px] 
                      ${activeStep > stepNum ? "bg-blue-600" : "bg-[#4A5361]"}
                    `}
                  ></div>
                )}

                {/* CIRCLE */}
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-white z-10
                    text-sm font-semibold border-[1.5px] transition-all
                    ${
                      isActive || isCompleted
                        ? "bg-blue-600 border-blue-600 shadow-[0_0_6px_2px_rgba(59,130,246,0.4)]"
                        : "bg-[#4A5361] border-[#4A5361]"
                    }
                  `}
                >
                  {stepNum}
                </div>

                {/* LABEL */}
                <span
                  className={`mt-[25px] text-sm font-semibold
                    ${isActive || isCompleted ? "text-blue-600 font-semibold" : "text-[#4A5361]"}
                  `}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
