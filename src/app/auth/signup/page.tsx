"use client";

import { useState } from "react";
import { signup } from "@/app/auth/actions";

const GRADES = ["Grade 9","Grade 10","Grade 11","Grade 12","Year 1","Year 2","Year 3","Year 4"];

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signup(new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900">
        <a href="/" className="text-lg font-semibold tracking-tight text-white">Lumina</a>
        <p className="text-sm text-zinc-500">
          Already have an account?{" "}
          <a href="/auth/login" className="text-white font-medium hover:underline">Sign in</a>
        </p>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Create your account</h1>
          <p className="text-sm text-zinc-400 mb-8">Claim your rank and join your school&apos;s arena</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-950 border border-red-900 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full name</label>
              <input name="fullName" type="text" required placeholder="Alex Morgan"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">School email</label>
              <input name="email" type="email" required placeholder="you@school.edu"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
              <p className="text-xs text-zinc-600 mt-1.5">Used to verify and isolate your school community.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">School name</label>
              <input name="schoolName" type="text" required placeholder="Westview High School"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Grade / Year</label>
              <select name="grade" required defaultValue=""
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-zinc-600">
                <option value="" disabled>Select your grade</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <input name="password" type="password" required minLength={8} placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
              <p className="text-xs text-zinc-600 mt-1.5">At least 8 characters.</p>
            </div>

            <div className="pt-1">
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>

            <p className="text-xs text-zinc-600 text-center leading-relaxed">
              By signing up you agree to Lumina&apos;s{" "}
              <a href="#" className="underline text-zinc-400">Terms</a> and{" "}
              <a href="#" className="underline text-zinc-400">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
