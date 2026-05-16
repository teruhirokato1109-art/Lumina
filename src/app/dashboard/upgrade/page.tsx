"use client";

import { useState } from "react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <div className="px-10 py-10 max-w-2xl">
      <div className="mb-10">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Upgrade</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">Lumina Pro</h1>
        <p className="text-sm text-zinc-400 mt-1">Everything you need to dominate your grade.</p>
      </div>

      {/* Pricing card */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-6 border-b border-zinc-900">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-black text-white">$20</span>
            <span className="text-zinc-500 mb-1">/ month</span>
          </div>
          <p className="text-sm text-zinc-500">Cancel anytime. No contracts.</p>
        </div>

        <div className="px-6 py-5 space-y-3">
          {[
            "Unlimited Open-Defiance duels",
            "Unlimited AI oral exams",
            "Unlimited note uploads",
            "Full access to Sage — your AI study guide",
            "Live grade leaderboard access",
            "Merit wagering and Study Syndicates",
            "School-isolated competitive arena",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <span className="text-white text-xs">✓</span>
              <span className="text-sm text-zinc-300">{feature}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-zinc-900">
          <button onClick={handleUpgrade} disabled={loading}
            className="w-full py-3 bg-white text-black text-sm font-semibold rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50">
            {loading ? "Redirecting to checkout..." : "Upgrade to Lumina Pro"}
          </button>
          <p className="text-xs text-zinc-600 text-center mt-3">
            Secured by Stripe. Your card details never touch our servers.
          </p>
        </div>
      </div>

      {/* Free vs Pro comparison */}
      <div className="border border-zinc-900 rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 px-5 py-3 border-b border-zinc-900 bg-zinc-950">
          <span className="text-xs font-medium text-zinc-500">Feature</span>
          <span className="text-xs font-medium text-zinc-500 text-center">Free</span>
          <span className="text-xs font-medium text-white text-center">Pro</span>
        </div>
        {[
          { feature: "Duels", free: "View only", pro: "Unlimited" },
          { feature: "Oral exams", free: "1 / month", pro: "Unlimited" },
          { feature: "Sage messages", free: "10 / month", pro: "Unlimited" },
          { feature: "Note uploads", free: "1", pro: "Unlimited" },
          { feature: "Leaderboard", free: "✓", pro: "✓" },
          { feature: "Merit wagers", free: "—", pro: "✓" },
          { feature: "Study Syndicates", free: "—", pro: "✓" },
        ].map((row) => (
          <div key={row.feature} className="grid grid-cols-3 px-5 py-3 border-b border-zinc-900 last:border-0">
            <span className="text-sm text-zinc-400">{row.feature}</span>
            <span className="text-sm text-zinc-600 text-center">{row.free}</span>
            <span className="text-sm text-zinc-300 text-center">{row.pro}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
