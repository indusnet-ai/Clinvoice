import { useRef, useState } from "react";

const CLINVOICE_HTTP_URL = import.meta.env.VITE_CLINVOICE_AI_URL as string;
const CLINVOICE_API_KEY = import.meta.env.VITE_CLINVOICE_API_KEY as string;

// Convert http(s) URL to ws(s) URL
function toWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
}

export type StreamResult = {
  transcript_id: string;
  transcript: string;
};

export type StreamStatus = "idle" | "connecting" | "streaming" | "finalising" | "done" | "error";

export const useStreamingTranscription = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [liveTranscript, setLiveTranscript] = useState("");
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");

  // Resolve/reject for the Promise returned by stopStream()
  const resolveRef = useRef<((r: StreamResult | null) => void) | null>(null);

  const startStream = (micStream: MediaStream) => {
    setLiveTranscript("");
    setStreamStatus("connecting");

    const wsUrl = `${toWsUrl(CLINVOICE_HTTP_URL)}/ws/stream_transcription?api_key=${CLINVOICE_API_KEY}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStreamStatus("streaming");

      // Second MediaRecorder on the same mic stream — doesn't affect the primary recorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(micStream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };
      recorder.start(1000); // 1-second chunks
      recorderRef.current = recorder;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);

        if (msg.type === "partial") {
          setLiveTranscript(msg.accumulated ?? msg.text ?? "");
        }

        if (msg.type === "done") {
          setStreamStatus("done");
          resolveRef.current?.({ transcript_id: msg.transcript_id, transcript: msg.transcript });
          resolveRef.current = null;
          ws.close();
        }

        if (msg.type === "error") {
          setStreamStatus("error");
          resolveRef.current?.(null);
          resolveRef.current = null;
          ws.close();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setStreamStatus("error");
      resolveRef.current?.(null);
      resolveRef.current = null;
    };

    ws.onclose = () => {
      if (streamStatus === "streaming" || streamStatus === "finalising") {
        setStreamStatus("idle");
      }
    };
  };

  const stopStream = (date: string): Promise<StreamResult | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      const ws = wsRef.current;

      // Stop the secondary recorder first so no more chunks are sent
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      recorderRef.current = null;

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        resolve(null);
        return;
      }

      resolveRef.current = resolve;
      setStreamStatus("finalising");

      ws.send(JSON.stringify({ action: "stop", date }));
    });
  };

  const pauseStream = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
    }
  };

  const resumeStream = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
    }
  };

  const resetStream = () => {
    wsRef.current?.close();
    wsRef.current = null;
    recorderRef.current?.stop();
    recorderRef.current = null;
    resolveRef.current = null;
    setLiveTranscript("");
    setStreamStatus("idle");
  };

  return { liveTranscript, streamStatus, startStream, stopStream, resetStream, pauseStream, resumeStream };
};

