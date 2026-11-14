"use client";
import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return <Sonner
    theme="light"
    position="bottom-right"
    closeButton
    visibleToasts={3}
    gap={12}
    offset={24}
    mobileOffset={16}
    containerAriaLabel="Notifikasi"
    icons={{
      success: <CircleCheck className="size-5 text-emerald-600" />,
      error: <CircleX className="size-5 text-red-600" />,
      warning: <TriangleAlert className="size-5 text-amber-600" />,
      info: <Info className="size-5 text-blue-600" />,
      loading: <LoaderCircle className="size-5 animate-spin text-slate-500" />,
      close: <X className="size-3.5" />,
    }}
    toastOptions={{
      duration: 4500,
      closeButtonAriaLabel: "Tutup notifikasi",
      classNames: {
        toast: "app-toast",
        title: "app-toast-title",
        description: "app-toast-description",
        closeButton: "app-toast-close",
      },
    }}
    {...props}
  />;
}
