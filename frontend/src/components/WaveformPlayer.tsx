// src/components/WaveformPlayer.tsx
import React, { useEffect, useRef } from "react";

type Props = {
  audioUrl?: string | null; // when playback
  liveStream?: MediaStream | null; // when recording
  width?: number;
  height?: number;
  backgroundColor?: string;
  lineWidth?: number;
};

const WaveformPlayer: React.FC<Props> = ({
  audioUrl = null,
  liveStream = null,
  width = 600,
  height = 120,
  backgroundColor = "#0f172a", // dark-ish default
  lineWidth = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // prepare audio context + analyser
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    // Create or reuse
    const audioCtx = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = audioCtx;

    // create analyser
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    // connect source depending on liveStream or audioUrl
    const connectStream = async () => {
      // disconnect any existing source
      try {
        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch {}
          sourceRef.current = null;
        }

        if (liveStream) {
          // live input stream
          const src = audioCtx.createMediaStreamSource(liveStream);
          sourceRef.current = src;
          src.connect(analyser);
        } else if (audioUrl) {
          // playback: create hidden audio element
          const audioEl = audioElRef.current ?? document.createElement("audio");
          audioElRef.current = audioEl;
          audioEl.src = audioUrl;
          audioEl.crossOrigin = "anonymous";
          audioEl.controls = true; // you can hide if you have custom controls
          // play is optional — show waveform without autoplay
          const src = audioCtx.createMediaElementSource(audioEl);
          sourceRef.current = src;
          src.connect(analyser);
          analyser.connect(audioCtx.destination); // audible during playback
        } else {
          // nothing to visualize
        }
      } catch (e) {
        console.warn("WaveformPlayer connect error", e);
      }
    };

    connectStream();

    // draw loop
    const draw = () => {
      if (!canvasRef.current || !ctx || !analyserRef.current || !dataArrayRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = "#6ee7b7"; // light greenish; change in CSS if you want
      ctx.beginPath();

      const sliceWidth = (w * 1.0) / dataArrayRef.current.length;
      let x = 0;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = dataArrayRef.current[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    // set canvas pixel ratio for sharpness
    const setCanvasSize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(ratio, ratio);
      }
    };

    setCanvasSize();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        if (analyserRef.current) analyserRef.current.disconnect();
        if (sourceRef.current) sourceRef.current.disconnect();
      } catch {}
      // do not close audioContext here if you reuse it globally in app.
      // audioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStream, audioUrl, width, height, backgroundColor, lineWidth]);

  // optional: show audio element controls when playback
  return (
    <div>
      <canvas ref={canvasRef} style={{ width, height, borderRadius: 6, display: "block" }} />
      {audioUrl && (
        <div style={{ marginTop: 8 }}>
          <audio ref={audioElRef} src={audioUrl} controls style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
};

export default WaveformPlayer;
