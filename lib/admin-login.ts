import { signIn, type SignInResponse } from "next-auth/react";

export const ADMIN_LOGIN_FAILED = "Login gagal. Username/password salah atau percobaan login sedang dibatasi.";
export const ADMIN_LOGIN_UNAVAILABLE = "Login tidak dapat diproses. Periksa koneksi lalu coba lagi.";

export class AdminLoginError extends Error {}

type AdminLoginActions = {
  signIn: (provider: "credentials", options: {
    username: string; password: string; redirect: false; callbackUrl: string;
  }) => Promise<SignInResponse | undefined>;
  navigate: (url: string) => void;
};

export async function signInAdmin(
  credentials: { username: string; password: string },
  actions: AdminLoginActions = {
    signIn: (provider, options) => signIn(provider, options),
    navigate: (url: string) => window.location.replace(url),
  },
) {
  const result = await actions.signIn("credentials", {
    ...credentials,
    redirect: false,
    callbackUrl: "/dashboard",
  });
  if (!result?.ok || result.error) throw new AdminLoginError(ADMIN_LOGIN_FAILED);

  // Start a fresh page after the cookie is set. Client router navigation can
  // retain an unauthenticated SessionProvider and bounce back from the guard.
  actions.navigate("/dashboard");
}
