import React from "react";
import AshwinAiImg from "@/assets/imgs/ClinVoice_robo.png";
import { VoiceWaveAnimation } from "@/app/component";
import AiNotes from "./AiNotes";
import { ProcessingView } from "./ProcessingView";
import LiveTranscriptView from "./LiveTranscriptView";
import { StreamStatus } from "../hooks/useStreamingTranscription";

type Props = {
  expandProfile: boolean;
  isMaximize: boolean;

  opd_id?: number;
  currentOpd: any;

  isCompletedOpd: boolean;

  recordingState: "idle" | "checking" | "recording" | "paused" | "processing" | "result";

  effectiveHasTranscript: boolean;
  notes: any;
  transId: string;
  currentOpdTransId?: string;

  t: (k: string) => string;

  audioPreviewUrl: string;

  liveTranscript?: string;
  streamStatus?: StreamStatus;
};

export const RecordingMainView: React.FC<Props> = ({
  expandProfile,
  isMaximize,
  opd_id,
  currentOpd,
  isCompletedOpd,
  recordingState,
  effectiveHasTranscript,
  notes,
  transId,
  currentOpdTransId,
  t,
  audioPreviewUrl,
  liveTranscript = "",
  streamStatus = "idle",
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center transition-all duration-500 ease-in-out w-full ${
        expandProfile ? `min-h-[40vh]` : isMaximize ? `min-h-[80vh]` : `min-h-[55vh]`
      } `}
    >
      {(effectiveHasTranscript || recordingState === "result") && (
        <div className="w-full">
          <AiNotes notes={notes} isPastRecord={false} transId={transId || currentOpdTransId} />
        </div>
      )}

      {!effectiveHasTranscript && recordingState !== "result" && recordingState !== "idle" && (
        <div className="flex items-center justify-start w-full gap-3 mb-4">
          <img src={AshwinAiImg} alt="ClinVoice AI" className="h-10 w-10" />
          <h1 className="text-[#01030F] text-[20px] font-semibold">ClinVoice AI</h1>
        </div>
      )}

      <div className="flex flex-1 items-center justify-center w-full transition-all duration-500">
        {!opd_id && recordingState === "idle" && (
          <div className="flex flex-col items-center">
            <h1 className="text-[32px] font-semibold text-center">{t("consultation.hereIam")}</h1>
            <img src={AshwinAiImg} className="mt-10" />
          </div>
        )}

        {opd_id && !currentOpd && recordingState === "idle" && (
          <div className="flex flex-col items-center">
            <h1 className="text-[32px] font-semibold text-center">{t("consultation.hereIam")}</h1>
            <img src={AshwinAiImg} className="mt-10" />
          </div>
        )}

        {opd_id && currentOpd && !effectiveHasTranscript && !isCompletedOpd && recordingState === "idle" && (
          <div className="flex flex-col items-center">
            <h1 className="text-[32px] font-semibold text-center">{t("consultation.hereIam")}</h1>
            <img src={AshwinAiImg} className="mt-10" />
          </div>
        )}

        {opd_id && currentOpd && isCompletedOpd && !effectiveHasTranscript && recordingState === "idle" && (
          <div className="flex flex-col items-center">
            <h1 className="text-[22px] font-semibold text-center">
              No recording found for this completed consultation.
            </h1>
          </div>
        )}

        {(recordingState === "recording" || recordingState === "paused") && (
          <div className="flex flex-col items-center w-full gap-2">
            <VoiceWaveAnimation isRecording={recordingState === "recording"} />
            <LiveTranscriptView text={liveTranscript} status={streamStatus} />
          </div>
        )}

        {recordingState === "checking" && (
          <div className="flex flex-col items-center gap-4">
            <VoiceWaveAnimation isRecording={true} />
            <p className="text-[#6070FF] font-medium animate-pulse">Checking microphone...</p>
          </div>
        )}

        {recordingState === "processing" && (
          <>
            <ProcessingView />
            {/* {audioPreviewUrl && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-1">Recording preview</p>
                <audio controls src={audioPreviewUrl} className="w-full" />
              </div>
            )} */}
          </>
        )}
      </div>
    </div>
  );
};
