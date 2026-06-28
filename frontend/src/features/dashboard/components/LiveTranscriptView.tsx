import React, { useEffect, useRef } from "react";
import { StreamStatus } from "../hooks/useStreamingTranscription";

type Props = {
  text: string;
  status: StreamStatus;
};

const statusLabel: Record<StreamStatus, string> = {
  idle: "",
  connecting: "Connecting to live transcription…",
  streaming: "Listening…",
  finalising: "Finalising transcript…",
  done: "",
  error: "Live transcription unavailable — audio will still be saved.",
};

const LiveTranscriptView: React.FC<Props> = ({ text, status }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text]);

  if (status === "idle" || status === "done") return null;

  return (
    <div className="w-full mt-4 rounded-xl border border-[#6070FF33] bg-[#F5F6FF] p-3 flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            status === "streaming"
              ? "bg-green-500 animate-pulse"
              : status === "finalising"
              ? "bg-yellow-500 animate-pulse"
              : status === "error"
              ? "bg-red-400"
              : "bg-gray-400"
          }`}
        />
        <span className="text-xs font-medium text-[#6070FF]">{statusLabel[status]}</span>
      </div>

      {/* Transcript scroll area */}
      {text && (
        <div className="max-h-48 overflow-y-auto text-sm text-[#01030F] leading-relaxed whitespace-pre-wrap">
          {text}
          <div ref={bottomRef} />
        </div>
      )}

      {!text && status === "streaming" && (
        <p className="text-xs text-gray-400 italic">Waiting for speech…</p>
      )}
    </div>
  );
};

export default LiveTranscriptView;
