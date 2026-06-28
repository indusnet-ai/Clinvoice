import React from "react";
import { Button } from "@/atoms";

type Props = {
  shouldShowStartStop: boolean;
  shouldShowSaveRetake: boolean;
  recordingState: "idle" | "checking" | "recording" | "paused" | "processing" | "result";
  opd_id?: number;
  t: (k: string) => string;
  onStart: () => Promise<void> | void;
  onStop: () => Promise<void> | void;
  onPause: () => void;
  onResume: () => void;
  onRetake: () => void;
  onSave: () => void;
  isSaveDisabled: boolean;
};

export const RecordingActionArea: React.FC<Props> = ({
  shouldShowStartStop,
  shouldShowSaveRetake,
  recordingState,
  opd_id,
  t,
  onStart,
  onStop,
  onPause,
  onResume,
  onRetake,
  onSave,
  isSaveDisabled,
}) => {
  if (shouldShowStartStop) {
    if (recordingState === "recording" || recordingState === "paused") {
      return (
        <div className="flex gap-4 items-center justify-center w-full">
          <Button
            label={recordingState === "paused" ? "Resume" : "Hold"}
            onClick={async () => {
              if (recordingState === "recording") onPause();
              else if (recordingState === "paused") onResume();
            }}
            variant="outlined"
          />
          <Button
            label={t("label.stopRec")}
            onClick={async () => {
              await onStop();
            }}
          />
        </div>
      );
    }
    return (
      <Button
        label={recordingState === "checking" ? "Checking..." : t("label.startRec")}
        onClick={async () => {
          if (recordingState === "idle") await onStart();
        }}
        disable={!opd_id}
      />
    );
  }

  if (shouldShowSaveRetake) {
    return (
      <div className="flex gap-4 items-center justify-end w-full">
        <Button label={t("label.retake")} variant="outlined" onClick={onRetake} />
        <Button label={isSaveDisabled ? "Preparing..." : t("label.save")} onClick={onSave} disable={isSaveDisabled} variant="contained" />
      </div>
    );
  }

  return null;
};
