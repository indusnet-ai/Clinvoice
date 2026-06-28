import React from "react";
import AiNotes from "./AiNotes";

type Props = {
  shouldShowPastRecords: boolean;
  otherPastTransId?: string;
};

export const PastRecordsPanel: React.FC<Props> = ({ shouldShowPastRecords, otherPastTransId }) => {
  if (!shouldShowPastRecords) return null;

  return (
    <div>
      <p className="font-semibold text-[16px]">Past Records</p>
      <div className="w-full">
        <AiNotes notes={[]} isPastRecord={true} transId={otherPastTransId} />
      </div>
    </div>
  );
};
