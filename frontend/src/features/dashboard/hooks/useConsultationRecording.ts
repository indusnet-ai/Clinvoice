import { useEffect, useRef, useState } from "react";
import { convertWebmToWav, showToast } from "@/utils";
import {
  requestMicrophoneAccess,
  setupAudioPipeline,
  startRecorder,
  stopRecorder,
  stopMicCompletely,
} from "@/utils/recorderHelpers";

type ConsultationState = "idle" | "checking" | "recording" | "paused" | "processing" | "result" | "max_reached";

export const useConsultationRecording = ({
  opd_id,
  block,
  unblock,
  uploadAudio,
  updateClinVoiceTrans,
  triggerGetTranscript,
  triggerGetSoapNotes,
  onTranscriptReady, // callback(transcriptId)
  dispatchSetTransId,
  onMicStreamReady,  // (stream: MediaStream) => void — called once mic is granted
  onPause,
  onResume,
}: any) => {
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  const MAX_DURATION = 10 * 60;
  const MAX_SIZE_MB = 25;
  const MIN_DURATION = 30;

  const [recordingState, setRecordingState] = useState<ConsultationState>("idle");
  const [micError, setMicError] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(MAX_DURATION);

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");

  const consecutiveLowVolumeRef = useRef(0);

  useEffect(() => {
    if (!recordedBlob) {
      setAudioPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(recordedBlob);
    setAudioPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);

  const startRecording = async () => {
    if (!opd_id) {
      showToast("Please create or start an OPD before recording.", "warning");
      return;
    }

    setRecordingState("checking");
    setMicError(null);
    consecutiveLowVolumeRef.current = 0;

    try {
      const stream = await requestMicrophoneAccess();
      micStreamRef.current = stream;

      onMicStreamReady?.(stream);

      const refs = { mediaRecorderRef, audioContextRef, micStreamRef, analyserRef, chunksRef, startTimeRef };
      const processed = setupAudioPipeline(stream, refs);
      await startRecorder(processed, refs, 1000);

      const analyser = refs.analyserRef.current;
      if (!analyser) throw new Error("Analyser not available");

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setRecordingState("recording");
      block({
        title: "Are you sure you want to leave?",
        message: "Recording is in progress. Leaving will stop the recording.",
        confirmText: "Stop & Leave",
        cancelText: "Continue Recording",
        reason: "navigation",
      });

      accumulatedTimeRef.current = 0;
      setElapsedSeconds(0);
      setRemainingSeconds(MAX_DURATION);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = accumulatedTimeRef.current + Math.floor((Date.now() - startTimeRef.current!) / 1000);
        const remaining = MAX_DURATION - elapsed;

        setElapsedSeconds(elapsed);
        setRemainingSeconds(remaining);

        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const amp = (dataArray[i] - 128) / 128;
          sumSquares += amp * amp;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const volumeLevel = rms * 100;

        if (volumeLevel < 1.2) consecutiveLowVolumeRef.current += 1;
        else {
          consecutiveLowVolumeRef.current = 0;
          setMicError(null);
        }

        if (consecutiveLowVolumeRef.current >= 2) {
          setMicError("Microphone input is too low or muted. Please check your audio settings.");
        }

        if (elapsed >= MAX_DURATION) {
          stopRecording({ forceStop: true, deferSend: true, reason: "manual" });
          setRecordingState("max_reached");
        }
      }, 1000);
    } catch (e) {
      console.log(e);
      setMicError("Microphone is not connected. Please check.");
      setRecordingState("idle");
    }
  };
 
  const pauseRecording = async () => {
    if (recordingState !== "recording") return;
 
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
    }
 
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
 
    if (startTimeRef.current !== null) {
      accumulatedTimeRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      startTimeRef.current = null;
    }
 
    setRecordingState("paused");
    onPause?.();
  };
 
  const resumeRecording = async () => {
    if (recordingState !== "paused") return;
 
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
    }
 
    startTimeRef.current = Date.now();
    setRecordingState("recording");
    onResume?.();
 
    const analyser = analyserRef.current;
    if (!analyser) return;
 
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
 
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = accumulatedTimeRef.current + Math.floor((Date.now() - startTimeRef.current!) / 1000);
      const remaining = MAX_DURATION - elapsed;
 
      setElapsedSeconds(elapsed);
      setRemainingSeconds(remaining);
 
      analyser.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const amp = (dataArray[i] - 128) / 128;
        sumSquares += amp * amp;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      const volumeLevel = rms * 100;
 
      if (volumeLevel < 1.2) consecutiveLowVolumeRef.current += 1;
      else {
        consecutiveLowVolumeRef.current = 0;
        setMicError(null);
      }
 
      if (consecutiveLowVolumeRef.current >= 2) {
        setMicError("Microphone input is too low or muted. Please check your audio settings.");
      }
 
      if (elapsed >= MAX_DURATION) {
        stopRecording({ forceStop: true, deferSend: true, reason: "manual" });
        setRecordingState("max_reached");
      }
    }, 1000);
  };

  const sendAudioToApi = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("conversation_file", audioBlob, "consultation.wav");
      formData.append("date", Math.floor(Date.now() / 1000).toString());

      const response = await uploadAudio(formData).unwrap();
      const transcriptId = response?.Transcript_Id;
      if (!transcriptId) throw new Error("Transcript ID missing");

      dispatchSetTransId(transcriptId);

      try {
        await Promise.all([
          triggerGetTranscript({ transcript_id: transcriptId }),
          triggerGetSoapNotes({ transcript_id: transcriptId }),
        ]);

        await updateClinVoiceTrans({ opd_id: Number(opd_id), trans_id: transcriptId });
      } catch (e) {
        console.warn("Failed to trigger transcript/soap fetch", e);
      }

      await onTranscriptReady(transcriptId);
      return transcriptId;
    } catch (err: any) {
      console.error(err);
      showToast(err?.detail || err?.message || "Invalid Audio", "error");
      setRecordingState("idle");
      return null;
    }
  };

  const stopRecording = async (
    options: { forceStop?: boolean; deferSend?: boolean; reason?: "manual" | "navigation" } = {},
  ): Promise<boolean> => {
    const { forceStop = false, deferSend = false } = options;

    setMicError(null);
    consecutiveLowVolumeRef.current = 0;

    const recorder = mediaRecorderRef.current;
    if (!recorder) return false;

    const refs = { mediaRecorderRef, audioContextRef, micStreamRef, analyserRef, chunksRef, startTimeRef };

    if (!forceStop && elapsedSeconds < MIN_DURATION) {
      stopRecorder(refs);
      await stopMicCompletely(refs);
      if (timerRef.current) clearInterval(timerRef.current);

      chunksRef.current = [];
      setRecordingState("idle");
      unblock();
      showToast("Conversation is too short. Minimum 30 seconds required.", "info");
      return false;
    }

    recorder.onstop = async () => {
      try {
        const webmBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (deferSend) {
          setRecordedBlob(webmBlob);
          unblock();
          return;
        }

        const wavBlob = await convertWebmToWav(webmBlob);
        const sizeMB = wavBlob.size / (1024 * 1024);

        if (sizeMB > MAX_SIZE_MB) {
          showToast("Audio exceeds 25MB limit", "error");
          unblock();
          setRecordingState("idle");
          return;
        }

        await sendAudioToApi(wavBlob);
        unblock();
      } catch (e) {
        console.error(e);
        setRecordingState("idle");
      }
    };

    stopRecorder(refs);
    await stopMicCompletely(refs);
    if (timerRef.current) clearInterval(timerRef.current);

    return true;
  };

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
        recorder.stream.getTracks().forEach((t) => t.stop());
      }

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;

      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    recordingState,
    setRecordingState,
    micError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    sendAudioToApi,

    MAX_DURATION,
    MIN_DURATION,
    elapsedSeconds,
    remainingSeconds,
    setElapsedSeconds,
    setRemainingSeconds,

    recordedBlob,
    setRecordedBlob,
    audioPreviewUrl,
  };
};
