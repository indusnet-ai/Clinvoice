import { VoiceAnimateSvg } from "@/assets/icons";
import React from "react";

const VoiceWaveAnimation = () => {
  return (
    <div className="voice-container">
      <div className="voice-smoke">
        <VoiceAnimateSvg />
      </div>
      <div className="voice-smoke">
        <VoiceAnimateSvg className="opacity-50" />
      </div>

      <div className="voice-dots">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

export default VoiceWaveAnimation;
