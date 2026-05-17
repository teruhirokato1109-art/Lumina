import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles").select("full_name, school_name, grade, merits, created_at, subscription_status, subscription_period_end, stripe_customer_id").eq("id", userId).single();

  const { data: leaderboard } = await supabase
    .from("profiles").select("id, merits")
    .eq("school_name", profile?.school_name).eq("grade", profile?.grade)
    .order("merits", { ascending: false });

  const rank = leaderboard?.findIndex((p) => p.id === userId) ?? -1;
  const total = leaderboard?.length ?? 0;

  const { data: exams } = await supabase
    .from("oral_exams").select("id, subject, passed, score, created_at")
    .eq("user_id", userId).eq("passed", true).order("created_at", { ascending: false });

  const { data: duels } = await supabase
    .from("duels").select("id, winner_id, status")
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .eq("status", "completed");

  const wins = duels?.filter((d) => d.winner_id === userId).length ?? 0;
  const totalDuels = duels?.length ?? 0;
  const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;

  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—";

  return (
    <div className="px-10 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Profile</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">Your Profile</h1>
      </div>

      {/* Identity card */}
      <div className="border border-zinc-900 rounded-lg px-6 py-6 mb-6 flex items-center gap-5 bg-zinc-950">
        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{profile?.full_name}</p>
          <p className="text-sm text-zinc-400">{profile?.school_name} · {profile?.grade}</p>
          <p className="text-xs text-zinc-600 mt-0.5">Member since {memberSince}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-500 mb-0.5">Grade rank</p>
          <p className="text-2xl font-black text-white">#{rank + 1}</p>
          <p className="text-xs text-zinc-600">of {total}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: "Merits", value: profile?.merits?.toLocaleString() ?? "0" },
          { label: "Duels won", value: wins },
          { label: "Win rate", value: `${winRate}%` },
          { label: "Exams passed", value: exams?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="border border-zinc-900 rounded-lg px-4 py-4 text-center bg-zinc-950">
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Verified badges */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Verified badges</h2>
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          {exams && exams.length > 0 ? exams.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-900 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-xs text-zinc-400">✓</span>
                </div>
                <p className="text-sm text-zinc-300">{e.subject}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{e.score}%</span>
                <span className="text-xs text-zinc-600">{new Date(e.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-500">No verified badges yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Pass an oral exam to earn your first badge.</p>
              <a href="/dashboard/oral-exams/new" className="text-xs text-zinc-400 underline mt-2 block">Start an exam →</a>
            </div>
          )}
        </div>
      </section>

      {/* Account info */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Account</h2>
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          {[
            { label: "Email", value: user.email ?? "—" },
            { label: "School", value: profile?.school_name ?? "—" },
            { label: "Grade", value: profile?.grade ?? "—" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-900 last:border-0">
              <span className="text-sm text-zinc-500">{item.label}</span>
              <span className="text-sm text-zinc-300">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Billing */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Billing</h2>
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
            <div>
              <p className="text-sm text-zinc-300">
                {profile?.subscription_status === "active" ? "Lumina Pro" :
                 profile?.subscription_status === "past_due" ? "Lumina Pro — payment overdue" :
                 "Free plan"}
              </p>
              {profile?.subscription_period_end && profile.subscription_status === "active" && (
                <p className="text-xs text-zinc-600 mt-0.5">
                  Renews {new Date(profile.subscription_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              profile?.subscription_status === "active" ? "bg-white text-black" :
              profile?.subscription_status === "past_due" ? "bg-zinc-900 text-red-400" :
              "bg-zinc-900 text-zinc-500"}`}>
              {profile?.subscription_status === "active" ? "Active" :
               profile?.subscription_status === "past_due" ? "Past due" : "Free"}
            </span>
          </div>
          <div className="px-5 py-4">
            {profile?.subscription_status === "active" || profile?.stripe_customer_id ? (
              <ManageBillingButton />
            ) : (
              <a href="/dashboard/upgrade"
                className="inline-block px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors">
                Upgrade to Pro — $20/month
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ManageBillingButton() {
  return (
    <form action={async () => {
      "use server";
      // Client-side portal redirect handled in client component below
    }}>
      <a href="/dashboard/upgrade" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
        Manage billing →
      </a>
    </form>
  );
}
