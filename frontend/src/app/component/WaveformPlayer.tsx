import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import WaveSurfer, { WaveSurferOptions } from "wavesurfer.js";

export interface WaveformPlayerHandle {
  stop: () => void;
}
const formWaveSurferOptions = (ref: any): WaveSurferOptions => ({
  container: ref,
  waveColor: "#B4C4FF",
  progressColor: "#6070FF",
  cursorColor: "#6070FF",
  barWidth: 2,
  barRadius: 2,
  // responsive: true,
  height: 64,
  normalize: true,
  // partialRender: true,
  backend: "WebAudio",
});

const WaveformPlayer = forwardRef<WaveformPlayerHandle, { audioUrl: string }>(({ audioUrl }, ref) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  //expose stop method to parent via ref
  useImperativeHandle(ref, () => ({
    stop() {
      if (!wavesurfer.current) return;

      wavesurfer.current.pause();
      wavesurfer.current.stop();
      setIsPlaying(false);
    },
  }));

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurfer.current?.destroy();

    const ws = WaveSurfer.create(formWaveSurferOptions(waveformRef.current));
    wavesurfer.current = ws;

    ws.load(audioUrl);

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    return () => {
      if (ws.isPlaying()) {
        ws.pause(); // stop playback
      }
      ws.stop(); // reset position
      ws.destroy(); // cleanup safely
    };
  }, [audioUrl]);

  const togglePlay = () => {
    wavesurfer.current?.playPause();
  };

  return (
    <div className="flex items-center gap-2 bg-[#B4C4FF] rounded-full p-1 px-2 ">
      <button
        onClick={togglePlay}
        className="w-8 h-8 ml-1 rounded-full bg-white flex items-center justify-center text-[#6070FF] text-xs font-bold shadow-md hover:scale-105 transition-transform duration-150 ring-2 ring-[#6070FF"
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>
      <div ref={waveformRef} className="w-full overflow-hidden rounded-full" />
    </div>
  );
});

export default WaveformPlayer;
