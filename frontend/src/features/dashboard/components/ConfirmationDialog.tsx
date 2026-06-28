import { Button } from "@/atoms";
import { CustomDialog } from "@/app/component";
import React from "react";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRetake: () => void;
}
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ open, onClose, onConfirm, onRetake }) => {
  return (
    <div>
      <CustomDialog open={open} onClose={onClose} maxWidth="sm">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="font-semibold text-[16px]">Recording Time Reached</h1>
          <p className="font-medium text-[14px]">
            The maximum recording duration has been reached. Please choose whether to process this recording for
            documentation or discard it.
          </p>
        </div>
        <div className="flex gap-4 items-center justify-center">
          <Button label="Retake" variant="outlined" onClick={onRetake} />
          <Button label="Save" variant="contained" onClick={onConfirm} />
        </div>
      </CustomDialog>
    </div>
  );
};

export default ConfirmationDialog;
