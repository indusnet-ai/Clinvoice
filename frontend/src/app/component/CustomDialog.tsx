import React, { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  customWidth?: string;
  disableBackdropClose?: boolean;
  disableEscClose?: boolean;
}

const MAX_WIDTH_MAP: Record<string, string> = {
  xs: "360px",
  sm: "480px",
  md: "640px",
  lg: "768px",
  xl: "1024px",
};

export const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  children,
  actions,
  maxWidth = "sm",
  customWidth,
  disableBackdropClose,
  disableEscClose,
}) => {
  // ESC key close
  // useEffect(() => {
  //   if (!open) return;

  //   const handleEsc = (e: KeyboardEvent) => {
  //     if (e.key === "Escape") onClose();
  //   };

  //   document.addEventListener("keydown", handleEsc);
  //   return () => document.removeEventListener("keydown", handleEsc);
  // }, [open, onClose]);
  useEffect(() => {
    if (!open || disableEscClose) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose, disableEscClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!disableBackdropClose ? onClose : undefined}
      />

      {/* Dialog */}
      <div
        className="relative bg-white rounded shadow-xl animate-scaleIn"
        style={{
          width: customWidth || MAX_WIDTH_MAP[maxWidth],
          maxWidth: "95%",
        }}
      >
        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Actions */}
        {actions && <div className="flex justify-end gap-3 px-6 pb-6">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
};
