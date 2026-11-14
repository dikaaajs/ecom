"use client";
import { toast as sonner, type ExternalToast } from "sonner";

const labels = { success: "Berhasil", error: "Gagal", warning: "Periksa kembali", info: "Informasi", loading: "Sedang memproses" };
export type NotificationType = keyof typeof labels;
function show(type: NotificationType, message: string, options?: ExternalToast) {
  if (typeof message !== "string" || !message.trim()) return "";
  return sonner[type](labels[type], {
    description: message,
    duration: type === "loading" ? Infinity : type === "error" ? 6500 : type === "warning" ? 5500 : 4500,
    ...options,
  });
}
/** Shared status titles and appearance; use warning for input issues, error for failed operations. */
export const toast = {
  success: (message: string, options?: ExternalToast) => show("success", message, options),
  error: (message: string, options?: ExternalToast) => show("error", message, options),
  failed: (message: string, options?: ExternalToast) => show("error", message, options),
  warning: (message: string, options?: ExternalToast) => show("warning", message, options),
  info: (message: string, options?: ExternalToast) => show("info", message, options),
  loading: (message: string, options?: ExternalToast) => show("loading", message, options),
  dismiss: sonner.dismiss,
  promise: sonner.promise,
};
