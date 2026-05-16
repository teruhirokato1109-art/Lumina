"use client";

import { useState } from "react";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900">
        <a href="/" className="text-lg font-semibold tracking-tight text-white">Lumina</a>
        <p className="text-sm text-zinc-500">
          No account?{" "}
          <a href="/auth/signup" className="text-white font-medium hover:underline">Sign up</a>
        </p>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-400 mb-8">Sign in to your Lumina account</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-950 border border-red-900 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
              <input name="email" type="email" required placeholder="you@school.edu"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-zinc-300">Password</label>
                <a href="#" className="text-xs text-zinc-500 hover:text-zinc-400">Forgot password?</a>
              </div>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
