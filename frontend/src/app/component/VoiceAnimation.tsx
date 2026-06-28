import { VoiceAnimateSvg } from "@/assets/icons";
import React from "react";

interface VoiceWaveAnimationProps {
  isRecording?: boolean;
}
export const VoiceWaveAnimation: React.FC<VoiceWaveAnimationProps> = ({ isRecording = false }) => {
  return (
    <div className={isRecording ? "voice-container recording" : "voice-container"}>
      <div className={isRecording ? "voice-smoke-recording" : "voice-smoke"}>
        <VoiceAnimateSvg />
      </div>
      <div className={isRecording ? "voice-smoke-recording" : "voice-smoke"}>
        <VoiceAnimateSvg className="opacity-50" />
      </div>

      <div className={isRecording ? "voice-dots-recording" : "voice-dots"}>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};
