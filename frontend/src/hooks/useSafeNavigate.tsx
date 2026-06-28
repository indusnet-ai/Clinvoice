import { useNavigate } from "react-router-dom";
import { useRef } from "react";

export const useSafeNavigate = (isRecording: boolean, onBlocked: (cb: () => void) => void) => {
  const navigate = useNavigate();

  return (to: string) => {
    if (isRecording) {
      onBlocked(() => navigate(to));
    } else {
      navigate(to);
    }
  };
};
