import { CustomDialog } from "@/app/component";
import { Button } from "@/atoms";
import React from "react";

export type NavigationReason = "navigation" | "manual";

interface NavigateConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const NavigateConfirmDialog: React.FC<NavigateConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onClose,
  onConfirm,
}) => {
  return (
    <CustomDialog open={open} onClose={onClose} customWidth="500px">
      <div>
        <p className="text-[16px] font-semibold text-[#030313]">{title}</p>
        <p className="text-[14px] text-[#555] mt-2">{message}</p>

        <div className="flex items-center justify-between gap-3 mt-6">
          <Button variant="outlined" onClick={onConfirm} label={confirmText} />
          <Button onClick={onClose} label={cancelText} />
        </div>
      </div>
    </CustomDialog>
  );
};
