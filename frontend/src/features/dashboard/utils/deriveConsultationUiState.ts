export const deriveConsultationUiState = ({
  currentOpd,
  opd_id,
  ignoreTranscript,
  recordingState,
}: {
  currentOpd: any;
  opd_id?: number;
  ignoreTranscript: boolean;
  recordingState: string;
}) => {
  const opdStatus = (currentOpd?.opd_status ?? "").toLowerCase();
  const isCompletedOpd = opdStatus === "completed";
  const isInProgressOpd = ["inprocess", "inprogress", "in_progress"].includes(opdStatus);
  const isInProcessOpd = currentOpd?.opd_status === "inprocess";

  const currentHasTranscript = !!currentOpd?.clinvoice_transaction_id;
  const effectiveHasTranscript = currentHasTranscript && !ignoreTranscript;

  const canAutoLoadCurrentOpd = effectiveHasTranscript && (isCompletedOpd || isInProgressOpd);

  const shouldShowStartStop = !isCompletedOpd && recordingState !== "processing" && recordingState !== "result" && recordingState !== "max_reached";

  const shouldShowSaveRetake =
    recordingState !== "processing" && recordingState !== "max_reached" && isInProgressOpd && (recordingState === "result" || effectiveHasTranscript);

  return {
    opdStatus,
    isCompletedOpd,
    isInProgressOpd,
    isInProcessOpd,
    currentHasTranscript,
    effectiveHasTranscript,
    canAutoLoadCurrentOpd,
    shouldShowStartStop,
    shouldShowSaveRetake,
  };
};
