"use client";
import { useCallback, useState } from "react";
import { toast, type NotificationType } from "@/lib/notify";

/** Retains error context for empty/retry screens and emits only on actual feedback, not render. */
export function useToastFeedback(type: NotificationType, id: string, initial = "") {
  const [message, setMessage] = useState(initial);
  const report = useCallback((value: string) => {
    setMessage(value);
    if (value) toast[type](value, { id });
  }, [type, id]);
  return [message, report] as const;
}
