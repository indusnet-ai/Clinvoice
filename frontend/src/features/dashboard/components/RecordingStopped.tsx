import React from "react";
import warningImg from "@/assets/imgs/warning.png";
import { Button } from "@/atoms";

type Props = {
  onSave: () => void;
  onRetake: () => void;
  isSaveDisabled?: boolean;
};

export const RecordingStopped: React.FC<Props> = ({ onSave, onRetake, isSaveDisabled }) => {
  return (
    <div className="w-full flex-1 min-h-[50vh] flex flex-col items-center justify-center p-6 bg-white rounded-xl text-center">
      <div className="max-w-[150px] mb-6">
        <img src={warningImg} alt="Warning" className="w-full h-auto object-contain" />
      </div>

      <h2 className="text-2xl font-bold text-black mb-4">Recording stopped</h2>

      <p className="text-[#5B657A] font-medium text-[16px] max-w-[300px] mb-8 leading-relaxed">
        Reached 10 Minutes which is maximum time allowed to record
      </p>

      {/* <p className="text-red-500 font-medium text-[15px] mb-8">
        Redirecting to render audio page in {countdown} Seconds
      </p> */}

      <div className="flex items-center justify-center gap-4 ">
        <div className="flex-1">
          <Button variant="outlined" label="Retake" onClick={onRetake} />
        </div>
        <div className="flex-1">
          <Button label="Save" onClick={onSave} disable={isSaveDisabled} />
        </div>
      </div>
    </div>
  );
};
