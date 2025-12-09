import { toast } from "react-hot-toast";

type ToastType = "success" | "error";

export const showToast = (type: ToastType, message: string) => {
  if (!message) return;
  toast[type](message, { duration: 3500 });
};

export const formatErrorMessage = (input?: string | null) => {
  if (!input) return "Ocurrió un error. Intenta nuevamente.";
  return input;
};
