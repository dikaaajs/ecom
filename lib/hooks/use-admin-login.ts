"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/notify";
import { AdminLoginError, ADMIN_LOGIN_UNAVAILABLE, signInAdmin } from "@/lib/admin-login";

export function useAdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef(false);

  const login = async (username: string, password: string) => {
    if (submitting.current) return;
    submitting.current = true;
    setIsLoading(true);
    toast.dismiss("admin-login-error");
    try {
      await signInAdmin({ username, password });
      // Stay disabled until the new document loads.
    } catch (cause) {
      const message = cause instanceof AdminLoginError ? cause.message : ADMIN_LOGIN_UNAVAILABLE;
      toast.error(message, { id: "admin-login-error" });
      submitting.current = false;
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
