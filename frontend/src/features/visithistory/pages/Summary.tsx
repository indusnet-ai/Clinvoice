import { CloseIcon, DownLoadIcon, PrintIcon } from "@/assets/icons";
import React from "react";
import { useNavigate } from "react-router";

function Summary() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h2 className="text-[#01030F] text-[16px] font-semibold">AI Notes Summary</h2>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <PrintIcon className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <DownLoadIcon className="w-6 h-6" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {
              navigate(-1);
            }}
          >
            <CloseIcon color="#98999E" className="cursor-pointer w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Summary;
