import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("school_name, grade, merits").eq("id", user.id).single();

  const { data: leaderboard } = await supabase
    .from("profiles").select("id, full_name, merits, grade")
    .eq("school_name", profile?.school_name)
    .eq("grade", profile?.grade)
    .order("merits", { ascending: false });

  const userRank = leaderboard?.findIndex((p) => p.id === user.id) ?? -1;

  return (
    <div className="px-10 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Leaderboard</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">Grade rankings</h1>
        <p className="text-sm text-zinc-400 mt-1">{profile?.school_name} · {profile?.grade} · {leaderboard?.length ?? 0} students</p>
      </div>

      {userRank >= 0 && (
        <div className="border border-zinc-800 rounded-lg px-5 py-4 mb-6 flex items-center justify-between bg-zinc-950">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Your position</p>
            <p className="text-lg font-bold text-white">#{userRank + 1} of {leaderboard?.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-0.5">Your Merits</p>
            <p className="text-lg font-bold text-white">{profile?.merits?.toLocaleString()} M</p>
          </div>
        </div>
      )}

      <div className="border border-zinc-900 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-900 bg-zinc-950">
          <span className="col-span-1 text-xs font-medium text-zinc-500">#</span>
          <span className="col-span-7 text-xs font-medium text-zinc-500">Student</span>
          <span className="col-span-4 text-xs font-medium text-zinc-500 text-right">Merits</span>
        </div>

        {leaderboard && leaderboard.length > 0 ? leaderboard.map((p, i) => {
          const isUser = p.id === user.id;
          return (
            <div key={p.id} className={`grid grid-cols-12 items-center px-5 py-3.5 border-b border-zinc-900 last:border-0 transition-colors ${isUser ? "bg-zinc-900" : "hover:bg-zinc-950"}`}>
              <span className="col-span-1 text-sm text-zinc-600 font-medium">{i + 1}</span>
              <div className="col-span-7 flex items-center gap-2">
                <span className={`text-sm ${isUser ? "font-semibold text-white" : "text-zinc-300"}`}>
                  {isUser ? `${p.full_name} (You)` : p.full_name}
                </span>
                {i === 0 && <span className="text-xs text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">1st</span>}
              </div>
              <div className="col-span-4 text-right">
                <span className="text-sm text-zinc-400 font-medium">{p.merits.toLocaleString()} M</span>
              </div>
            </div>
          );
        }) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-500">No students ranked yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Start winning duels to appear here.</p>
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-700 mt-4 text-center">Rankings update instantly after each duel, bounty, or oral exam.</p>
    </div>
  );
}
