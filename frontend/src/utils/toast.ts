import { toast, ToastOptions } from "react-toastify";

type ToastType = "success" | "error" | "info" | "warning";

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  theme: "light",
};

export const showToast = (message: string, type: ToastType = "success", options?: ToastOptions) => {
  const config = { ...defaultOptions, ...options };

  switch (type) {
    case "success":
      toast.success(message, config);
      break;
    case "error":
      toast.error(message, config);
      break;
    case "info":
      toast.info(message, config);
      break;
    case "warning":
      toast.warn(message, config);
      break;
    default:
      toast(message, config);
  }
};
