import React from "react";
import { AlertTriangleIcon, InfoCircleIcon } from "@/assets/icons";

type Props = {
  micError: string | null;
  opd_id?: number;
};

export const MicStatusLine: React.FC<Props> = ({ micError, opd_id }) => {
  return (
    <div className="h-4 mt-2 flex items-center justify-center">
      {micError ? (
        <div className="flex items-center gap-2 px-0.5 pt-2 text-red-600 text-sm">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          <p className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{micError}</p>
        </div>
      ) : !opd_id ? (
        <div className="flex items-center gap-2 px-0.5 pt-2 text-amber-700 text-sm">
          <InfoCircleIcon className="h-4 w-4 shrink-0" />
          <p className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            Please create or start an OPD to begin consultation recording.
          </p>
        </div>
      ) : null}
    </div>
  );
};
