"use client";

import type React from "react";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        // Check if session was created successfully
        const session = await getSession();
        if (session) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* Background Image */}
      <Image
        src="/wallpaper.gif"
        alt="background"
        fill
        className="object-cover"
        priority
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md px-6 py-12 bg-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/20">
        {/* Pixel Art Decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 bg-blue-600"></div>
        <div className="absolute top-0 right-0 w-4 h-4 bg-blue-600"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 bg-blue-600"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-200">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-300 text-sm text-center bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        {/* Pixel Art Divider */}
        <div className="relative flex items-center justify-center mt-8 mb-6">
          <div className="w-full border-t border-white/30"></div>
          <div className="absolute px-2 bg-transparent">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500"></div>
              <div className="w-2 h-2 bg-blue-600"></div>
              <div className="w-2 h-2 bg-blue-500"></div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-200 text-sm">Admin access only</p>
        </div>
      </div>
    </div>
  );
}
