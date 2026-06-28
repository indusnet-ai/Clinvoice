import React from "react";
import { Button } from "@/atoms";
import { MaximizeIcon, MinimizeIcon } from "@/assets/icons";
import { RecordingMainView } from "./RecordingMainView";
import { RecordingActionArea } from "./RecordingActionArea";
import { MicStatusLine } from "./MicStatusLine";
import { RecordingStopped } from "./RecordingStopped";
import { StreamStatus } from "../hooks/useStreamingTranscription";

type Props = {
  shouldShowPastRecords: boolean;

  isMaximize: boolean;
  setIsMaximize: (v: boolean) => void;

  expandProfile: boolean;
  setExpandProfile: (v: boolean) => void;

  isInitailLoading: boolean;

  opd_id?: number;
  currentOpd: any;

  isCompletedOpd: boolean;

  effectiveHasTranscript: boolean;
  notes: any;
  transId: string;
  currentOpdTransId?: string;

  recordingState: "idle" | "checking" | "recording" | "paused" | "processing" | "result" | "max_reached";
  audioPreviewUrl: string;

  t: (k: string) => string;

  shouldShowStartStop: boolean;
  shouldShowSaveRetake: boolean;
  isSaveDisabled: boolean;

  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onPause: () => void;
  onResume: () => void;

  onSave: () => void;
  onRetake: () => void;
  onConfirmSave: () => void;

  micError: string | null;

  remainingSeconds: number;
  elapsedSeconds: number;
  MIN_DURATION: number;
  formatTime: (s: number) => string;

  liveTranscript?: string;
  streamStatus?: StreamStatus;
};

export const AiConsultationPanel: React.FC<Props> = ({
  shouldShowPastRecords,

  isMaximize,
  setIsMaximize,

  expandProfile,
  setExpandProfile,

  isInitailLoading,

  opd_id,
  currentOpd,

  isCompletedOpd,

  effectiveHasTranscript,
  notes,
  transId,
  currentOpdTransId,

  recordingState,
  audioPreviewUrl,

  t,

  shouldShowStartStop,
  shouldShowSaveRetake,
  isSaveDisabled,

  onStart,
  onStop,
  onPause,
  onResume,

  onSave,
  onRetake,
  onConfirmSave,

  micError,

  remainingSeconds,
  elapsedSeconds,
  MIN_DURATION,
  formatTime,

  liveTranscript,
  streamStatus,
}) => {
  return (
    // <div className={`flex flex-col w-full justify-center items-center`}>
    <div
      className={`mt-4 relative bg-[#FDFDFD] p-4 rounded-xl transition-all duration-500 ease-in-out ${
        isMaximize ? "min-h-[90vh]" : "min-h-[55vh]"
      }`}
    >
      <div className="flex items-center justify-end">
        {!isMaximize ? (
          <MaximizeIcon
            className="cursor-pointer"
            onClick={() => {
              setIsMaximize(true);
              setExpandProfile(false);
            }}
          />
        ) : (
          <MinimizeIcon className="cursor-pointer" onClick={() => setIsMaximize(false)} />
        )}
      </div>
      {isInitailLoading ? (
        <>loading...</>
      ) : recordingState === "max_reached" ? (
        <RecordingStopped onRetake={onRetake} onSave={onConfirmSave} isSaveDisabled={isSaveDisabled} />
      ) : (
        <>
          <RecordingMainView
            expandProfile={expandProfile}
            isMaximize={isMaximize}
            opd_id={opd_id}
            currentOpd={currentOpd}
            isCompletedOpd={isCompletedOpd}
            recordingState={recordingState}
            effectiveHasTranscript={effectiveHasTranscript}
            notes={notes}
            transId={transId}
            currentOpdTransId={currentOpdTransId}
            t={t}
            audioPreviewUrl={audioPreviewUrl}
            liveTranscript={liveTranscript}
            streamStatus={streamStatus}
          />

          <div className="w-full flex items-center justify-center">
            <RecordingActionArea
              shouldShowStartStop={shouldShowStartStop}
              shouldShowSaveRetake={shouldShowSaveRetake}
              recordingState={recordingState === "max_reached" ? "recording" : recordingState}
              opd_id={opd_id}
              t={t}
              onStart={onStart}
              onStop={onStop}
              onPause={onPause}
              onResume={onResume}
              onRetake={onRetake}
              onSave={onSave}
              isSaveDisabled={isSaveDisabled}
            />
          </div>

          <MicStatusLine micError={micError} opd_id={opd_id} />
        </>
      )}

      {(recordingState === "recording" || recordingState === "paused") && (
        <div className="mt-4 text-center">
          <p
            className={`text-lg font-semibold transition-colors duration-300 ${
              recordingState === "paused"
                ? "text-yellow-600 animate-pulse"
                : remainingSeconds <= 30
                ? "text-red-500 animate-pulse"
                : "text-[#04aa04e7]"
            }`}
          >
            ⏱ {recordingState === "paused" ? "Paused at " : ""}{formatTime(remainingSeconds)}
          </p>
          {elapsedSeconds < MIN_DURATION && (
            <p className="text-sm text-gray-500 mt-1">Recording must be at least 30 seconds</p>
          )}
        </div>
      )}
    </div>
    // </div>
  );
};
