import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MeritsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles").select("full_name, merits, school_name, grade").eq("id", userId).single();

  const { data: transactions } = await supabase
    .from("merit_transactions").select("id, amount, reason, created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);

  const earned = transactions?.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) ?? 0;
  const spent = transactions?.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0) ?? 0;

  return (
    <div className="px-10 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Merits</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">Your Merits</h1>
        <p className="text-sm text-zinc-400 mt-1">Earn by winning. Wager to climb. Reputation you can lose.</p>
      </div>

      <div className="border border-zinc-800 rounded-lg px-6 py-6 mb-8 flex items-center justify-between bg-zinc-950">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Current balance</p>
          <p className="text-4xl font-black text-white">{profile?.merits?.toLocaleString() ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Merits</p>
        </div>
        <div className="text-right space-y-3">
          <div>
            <p className="text-xs text-zinc-500">Earned (all time)</p>
            <p className="text-base font-semibold text-white">+{earned.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Wagered / spent</p>
            <p className="text-base font-semibold text-zinc-400">{spent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="border border-zinc-900 rounded-lg px-5 py-5 mb-8 bg-zinc-950">
        <p className="text-sm font-semibold text-white mb-3">How to earn Merits</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { action: "Win a duel", amount: "Wager × 2" },
            { action: "Pass an oral exam", amount: "+150 M" },
            { action: "Complete a group bounty", amount: "+200–500 M" },
            { action: "First note upload", amount: "+50 M" },
            { action: "Join Lumina", amount: "+500 M" },
            { action: "Reach a new rank tier", amount: "+100 M" },
          ].map((item) => (
            <div key={item.action} className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">{item.action}</p>
              <p className="text-sm font-medium text-zinc-300">{item.amount}</p>
            </div>
          ))}
        </div>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Transaction history</h2>
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          {transactions && transactions.length > 0 ? transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-950 transition-colors">
              <div>
                <p className="text-sm text-zinc-300">{t.reason}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-semibold ${t.amount > 0 ? "text-white" : "text-zinc-500"}`}>
                {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()} M
              </span>
            </div>
          )) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-zinc-500">No transactions yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Win duels and pass exams to start earning.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
