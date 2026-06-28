// src/features/voice/hooks/useAudioRecorder.ts
import { useEffect, useRef, useState } from "react";

export type UseAudioRecorderOptions = {
  minDuration?: number;
  mimeType?: string;
};

export const useAudioRecorder = (opts: UseAudioRecorderOptions = {}) => {
  const MIN_DURATION = opts.minDuration ?? 5;
  const MIME_TYPE =
    opts.mimeType ??
    (MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string>("");

  // Start recording: request mic, create MediaRecorder, start timer & visual stream
  const startRecording = async () => {
    setError("");
    setAudioUrl("");
    setAudioBlob(null);
    chunksRef.current = [];
    setTimer(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: MIME_TYPE });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: MIME_TYPE });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // if too short, set error (but still keep blob/url so user can inspect)
        if (timer < MIN_DURATION) {
          setError(`Recording too short. Minimum ${MIN_DURATION} seconds required.`);
        }

        // stop timer if still running
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start();
      setRecording(true);
      setPaused(false);

      // start timer
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("startRecording error", err);
      setError("Microphone not detected or permission denied.");
    }
  };

  // Stop & finalize recording, stop tracks & timer
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("mediaRecorder.stop() error", e);
      }
    }

    // stop timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // stop microphone tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setRecording(false);
    setPaused(false);
  };

  // Pause if supported
  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording" &&
      typeof mediaRecorderRef.current.pause === "function"
    ) {
      mediaRecorderRef.current.pause();
      setPaused(true);

      // pause timer
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      console.warn("Pause not supported by MediaRecorder in this browser.");
      setError("Pause not supported by your browser.");
    }
  };

  // Resume if supported
  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused" &&
      typeof mediaRecorderRef.current.resume === "function"
    ) {
      mediaRecorderRef.current.resume();
      setPaused(false);

      // resume timer
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => {
          setTimer((prev) => prev + 1);
        }, 1000);
      }
    } else {
      console.warn("Resume not supported by MediaRecorder in this browser.");
      setError("Resume not supported by your browser.");
    }
  };

  // Download helper
  const downloadRecording = (filename = "recording.webm") => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      try {
        stopRecording();
      } catch {
        // ignore
      }
      // Revoke generated audioUrl
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // states
    recording,
    paused,
    timer,
    audioUrl,
    audioBlob,
    error,
    liveStream: streamRef.current ?? null, // may be null initially
    // actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setError,
    downloadRecording,
  } as const;
};
