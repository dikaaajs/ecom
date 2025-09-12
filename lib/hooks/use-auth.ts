"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const logout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: "/auth/signin"
      })
      router.push("/auth/signin")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"
  const isAdmin = session?.user?.role === "admin"

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    isAdmin,
    logout,
    status
  }
}