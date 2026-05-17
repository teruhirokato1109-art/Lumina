import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles").select("full_name, school_name, grade, merits").eq("id", userId).single();

  const { data: leaderboard } = await supabase
    .from("profiles").select("id, full_name, merits")
    .eq("school_name", profile?.school_name).eq("grade", profile?.grade)
    .order("merits", { ascending: false }).limit(5);

  const { data: recentDuels } = await supabase
    .from("duels")
    .select("id, topic, status, challenger_id, opponent_id, winner_id, merit_wager, created_at, challenger:profiles!duels_challenger_id_fkey(full_name), opponent:profiles!duels_opponent_id_fkey(full_name)")
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .order("created_at", { ascending: false }).limit(4);

  const { data: pendingDuels } = await supabase
    .from("duels")
    .select("id, topic, merit_wager, challenger_id, challenger:profiles!duels_challenger_id_fkey(full_name)")
    .eq("opponent_id", userId).eq("status", "pending").limit(3);

  const { data: recentExams } = await supabase
    .from("oral_exams").select("id, subject, score, passed, created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(3);

  const rank = leaderboard?.findIndex((p) => p.id === userId) ?? -1;
  const displayRank = rank === -1 ? "—" : `#${rank + 1}`;
  const totalInGrade = leaderboard?.length ?? 0;
  const wins = recentDuels?.filter((d) => d.winner_id === userId).length ?? 0;
  const losses = recentDuels?.filter((d) => d.winner_id && d.winner_id !== userId).length ?? 0;

  return (
    <div className="px-10 py-10 max-w-5xl space-y-10">

      {/* Header */}
      <div>
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Overview</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome back, {profile?.full_name?.split(" ")[0] ?? "—"}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">{profile?.school_name} · {profile?.grade}</p>
      </div>

      {/* Pending challenges banner */}
      {pendingDuels && pendingDuels.length > 0 && (
        <div className="border border-zinc-800 rounded-lg divide-y divide-zinc-900">
          <div className="px-5 py-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
            <p className="text-sm font-semibold text-white">
              {pendingDuels.length} open challenge{pendingDuels.length > 1 ? "s" : ""} waiting for you
            </p>
          </div>
          {pendingDuels.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-zinc-300">
                  <span className="font-medium">{(d.challenger as unknown as { full_name: string } | null)?.full_name}</span> challenged you · {d.topic}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{d.merit_wager} Merits wagered</p>
              </div>
              <a href="/dashboard/duels" className="text-xs font-medium px-3 py-1.5 bg-white text-black rounded-md hover:bg-zinc-200 transition-colors">
                Respond
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Grade Rank", value: displayRank, sub: `of ${totalInGrade} students` },
          { label: "Merits", value: profile?.merits?.toLocaleString() ?? "0", sub: "your balance" },
          { label: "Record", value: `${wins}W / ${losses}L`, sub: "duels this session" },
          { label: "Exams Passed", value: recentExams?.filter((e) => e.passed).length.toString() ?? "0", sub: "AI oral exams" },
        ].map((s) => (
          <div key={s.label} className="border border-zinc-900 rounded-lg px-5 py-5 bg-zinc-950">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard + Quick actions */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
            <p className="text-sm font-semibold text-white">Grade leaderboard</p>
            <a href="/dashboard/leaderboard" className="text-xs text-zinc-500 hover:text-zinc-300">View all →</a>
          </div>
          {leaderboard && leaderboard.length > 0 ? leaderboard.map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between px-5 py-3 border-b border-zinc-900 last:border-0 ${p.id === userId ? "bg-zinc-900" : "hover:bg-zinc-950"} transition-colors`}>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-700 w-4">{i + 1}</span>
                <span className={`text-sm ${p.id === userId ? "font-semibold text-white" : "text-zinc-400"}`}>
                  {p.id === userId ? "You" : p.full_name}
                </span>
              </div>
              <span className="text-xs text-zinc-500">{p.merits.toLocaleString()} M</span>
            </div>
          )) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-zinc-500">No classmates yet.</p>
              <p className="text-xs text-zinc-600 mt-1">You&apos;re first — invite peers to compete.</p>
            </div>
          )}
        </div>

        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-900">
            <p className="text-sm font-semibold text-white">Quick actions</p>
          </div>
          <div className="divide-y divide-zinc-900">
            {[
              { href: "/dashboard/duels/new", title: "Open-Defiance Duel", desc: "Challenge a classmate on any topic" },
              { href: "/dashboard/oral-exams/new", title: "Start Oral Exam", desc: "Prove your mastery — AI evaluated" },
              { href: "/dashboard/notes", title: "Upload Notes", desc: "Turn your notes into study challenges" },
              { href: "/dashboard/tutor", title: "Ask Sage", desc: "Your personal AI study guide" },
            ].map((action) => (
              <a key={action.href} href={action.href} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-950 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{action.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{action.desc}</p>
                </div>
                <span className="text-zinc-700 text-sm">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent duels + Recent exams */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
            <p className="text-sm font-semibold text-white">Recent duels</p>
            <a href="/dashboard/duels" className="text-xs text-zinc-500 hover:text-zinc-300">View all →</a>
          </div>
          {recentDuels && recentDuels.length > 0 ? recentDuels.map((d) => {
            const isChallenger = d.challenger_id === user.id;
            const opponent = isChallenger
              ? (d.opponent as unknown as { full_name: string } | null)?.full_name
              : (d.challenger as unknown as { full_name: string } | null)?.full_name;
            const won = d.winner_id === userId;
            return (
              <div key={d.id} className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 last:border-0 hover:bg-zinc-950 transition-colors">
                <div>
                  <p className="text-sm text-zinc-300">vs. <span className="font-medium text-white">{opponent ?? "—"}</span></p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-40">{d.topic}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  d.status === "pending" ? "bg-zinc-900 text-zinc-400" :
                  d.status === "active" ? "border border-zinc-700 text-zinc-400" :
                  won ? "bg-white text-black" : "bg-zinc-900 text-zinc-500"
                }`}>
                  {d.status === "pending" ? "Pending" : d.status === "active" ? "Active" : won ? "Won" : "Lost"}
                </span>
              </div>
            );
          }) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-zinc-500">No duels yet.</p>
              <a href="/dashboard/duels/new" className="text-xs text-zinc-400 underline mt-1 block">Start one →</a>
            </div>
          )}
        </div>

        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
            <p className="text-sm font-semibold text-white">Recent oral exams</p>
            <a href="/dashboard/oral-exams" className="text-xs text-zinc-500 hover:text-zinc-300">View all →</a>
          </div>
          {recentExams && recentExams.length > 0 ? recentExams.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 last:border-0 hover:bg-zinc-950 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{e.subject}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Score: {e.score ?? "—"} / 100</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.passed ? "bg-white text-black" : "bg-zinc-900 text-zinc-500"}`}>
                {e.passed ? "Passed" : "Failed"}
              </span>
            </div>
          )) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-zinc-500">No exams yet.</p>
              <a href="/dashboard/oral-exams/new" className="text-xs text-zinc-400 underline mt-1 block">Start your first →</a>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
