import { useEffect, useRef, useState } from "react";
import WaveSurfer, { WaveSurferOptions } from "wavesurfer.js";

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
  backend: "MediaElement",
});

const WaveformPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!waveformRef.current) return;

    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    wavesurfer.current = WaveSurfer.create(formWaveSurferOptions(waveformRef.current));

    setTimeout(() => {
      wavesurfer.current?.load(audioUrl);
    }, 10); // tiny delay fixes webm loading

    return () => wavesurfer.current?.destroy();
  }, [audioUrl]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(!isPlaying);
    }
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
};

export default WaveformPlayer;
