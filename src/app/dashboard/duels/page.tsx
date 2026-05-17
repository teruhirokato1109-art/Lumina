import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DuelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: duels } = await supabase
    .from("duels")
    .select("id, topic, status, merit_wager, winner_id, created_at, challenger_id, opponent_id, challenger:profiles!duels_challenger_id_fkey(full_name), opponent:profiles!duels_opponent_id_fkey(full_name)")
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const userId = user!.id;

  const pending = duels?.filter((d) => d.status === "pending" && d.opponent_id === userId) ?? [];
  const active = duels?.filter((d) => d.status === "active") ?? [];
  const completed = duels?.filter((d) => d.status === "completed") ?? [];

  function DuelRow({ d }: { d: NonNullable<typeof duels>[0] }) {
    const isChallenger = d.challenger_id === userId;
    const opponent = isChallenger
      ? (d.opponent as { full_name: string } | null)?.full_name
      : (d.challenger as { full_name: string } | null)?.full_name;
    const won = d.winner_id === userId;
    return (
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 last:border-0 hover:bg-zinc-950 transition-colors">
        <div>
          <p className="text-sm font-medium text-white">vs. {opponent ?? "—"}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{d.topic} · {d.merit_wager} M wagered</p>
        </div>
        <div className="flex items-center gap-3">
          {d.status === "completed" && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${won ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"}`}>
              {won ? "Won" : "Lost"}
            </span>
          )}
          {d.status === "pending" && d.opponent_id === userId && (
            <a href={`/dashboard/duels/${d.id}`} className="text-xs font-medium px-3 py-1.5 bg-white text-black rounded-md hover:bg-zinc-200 transition-colors">
              Respond
            </a>
          )}
          {d.status === "active" && (
            <a href={`/dashboard/duels/${d.id}`} className="text-xs font-medium px-3 py-1.5 border border-zinc-800 text-zinc-400 rounded-md hover:bg-zinc-900 transition-colors">
              Continue
            </a>
          )}
          {d.status === "pending" && d.challenger_id === userId && (
            <span className="text-xs text-zinc-600">Awaiting response</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 py-10 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Duels</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Open-Defiance</h1>
          <p className="text-sm text-zinc-400 mt-1">Challenge classmates. Wager Merits. Prove your knowledge.</p>
        </div>
        <a href="/dashboard/duels/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors">
          New duel
        </a>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Waiting for you · {pending.length}</h2>
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            {pending.map((d) => <DuelRow key={d.id} d={d} />)}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Active · {active.length}</h2>
          <div className="border border-zinc-900 rounded-lg overflow-hidden">
            {active.map((d) => <DuelRow key={d.id} d={d} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">History</h2>
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          {completed.length > 0 ? completed.map((d) => <DuelRow key={d.id} d={d} />) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-500">No completed duels yet.</p>
              <a href="/dashboard/duels/new" className="text-xs text-zinc-400 underline mt-1 block">Start your first duel →</a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
