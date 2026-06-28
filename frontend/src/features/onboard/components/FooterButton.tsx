import { Button } from "@/atoms";
import React from "react";

interface FooterButtonProps {
  onNext: () => void;
  onBack?: () => void;
  hasBack?: boolean;
}

const FooterButton: React.FC<FooterButtonProps> = ({ onNext, onBack, hasBack }) => {
  return (
    <div className="w-full flex items-center justify-end gap-3">
      {hasBack && <Button label="Previous" onClick={onBack} variant="outlined" isBack />}
      <Button label="Next" onClick={onNext} variant="contained" isNext />
    </div>
  );
};

export default FooterButton;
