"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewDuelPage() {
  const supabase = createClient();
  const [step, setStep] = useState<"pick" | "configure" | "sent">("pick");
  const [classmates, setClassmates] = useState<{ id: string; full_name: string; merits: number }[]>([]);
  const [selected, setSelected] = useState<{ id: string; full_name: string } | null>(null);
  const [topic, setTopic] = useState("");
  const [wager, setWager] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function loadClassmates() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: me } = await supabase.from("profiles").select("school_name, grade").eq("id", user.id).single();
    const { data } = await supabase.from("profiles").select("id, full_name, merits")
      .eq("school_name", me?.school_name).eq("grade", me?.grade).neq("id", user.id).order("merits", { ascending: false });
    setClassmates(data ?? []); setSearched(true); setLoading(false);
  }

  async function sendChallenge() {
    if (!selected || !topic.trim()) return;
    setLoading(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase.from("duels").insert({
      challenger_id: user.id, opponent_id: selected.id,
      topic: topic.trim(), merit_wager: parseInt(wager), status: "pending",
    });
    if (err) { setError(err.message); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("merits").eq("id", user.id).single();
    await supabase.from("profiles").update({ merits: (profile?.merits ?? 0) - parseInt(wager) }).eq("id", user.id);
    setStep("sent"); setLoading(false);
  }

  return (
    <div className="px-10 py-10 max-w-xl">
      <a href="/dashboard/duels" className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors">← Back to duels</a>
      <div className="mt-4 mb-8">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">New Duel</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">Open-Defiance Challenge</h1>
        <p className="text-sm text-zinc-400 mt-1">Pick a classmate, set the topic, wager your Merits.</p>
      </div>

      {step === "sent" ? (
        <div className="border border-zinc-900 rounded-lg px-6 py-10 text-center bg-zinc-950">
          <p className="text-lg font-bold text-white mb-2">Challenge sent</p>
          <p className="text-sm text-zinc-400 mb-6">
            {selected?.full_name} has been challenged on &ldquo;{topic}&rdquo;. Merits are held until the duel concludes.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/dashboard/duels" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-zinc-200 transition-colors">
              View my duels
            </a>
            <button onClick={() => { setStep("pick"); setSelected(null); setTopic(""); setWager("100"); setSearched(false); }}
              className="px-4 py-2 text-sm font-medium border border-zinc-800 text-zinc-400 rounded-md hover:bg-zinc-900 transition-colors">
              Challenge another
            </button>
          </div>
        </div>
      ) : step === "pick" ? (
        <div>
          {!searched ? (
            <div className="border border-zinc-900 rounded-lg px-6 py-10 text-center bg-zinc-950">
              <p className="text-sm text-zinc-400 mb-4">Load your classmates to pick an opponent.</p>
              <button onClick={loadClassmates} disabled={loading}
                className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40">
                {loading ? "Loading..." : "Load classmates"}
              </button>
            </div>
          ) : classmates.length === 0 ? (
            <div className="border border-zinc-900 rounded-lg px-6 py-10 text-center bg-zinc-950">
              <p className="text-sm text-zinc-500">No classmates found yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Invite peers to join Lumina first.</p>
            </div>
          ) : (
            <div className="border border-zinc-900 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950">
                <p className="text-xs font-medium text-zinc-500">Select your opponent</p>
              </div>
              {classmates.map((c) => (
                <button key={c.id} onClick={() => { setSelected(c); setStep("configure"); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 border-b border-zinc-900 last:border-0 hover:bg-zinc-950 transition-colors text-left">
                  <span className="text-sm font-medium text-white">{c.full_name}</span>
                  <span className="text-xs text-zinc-500">{c.merits.toLocaleString()} M</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="border border-zinc-900 rounded-lg px-5 py-4 flex items-center justify-between bg-zinc-950">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Challenging</p>
              <p className="text-sm font-semibold text-white">{selected?.full_name}</p>
            </div>
            <button onClick={() => setStep("pick")} className="text-xs text-zinc-500 hover:text-zinc-400">Change</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Cell Division, The French Revolution, Quadratic Equations..."
              className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
            <p className="text-xs text-zinc-600 mt-1.5">The AI generates a question from this topic for both of you.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Merit wager</label>
            <div className="flex gap-2">
              {["50", "100", "200", "500"].map((v) => (
                <button key={v} onClick={() => setWager(v)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${wager === v ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"}`}>
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-1.5">Winner takes the pot. Merits are locked until the duel ends.</p>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={sendChallenge} disabled={loading || !topic.trim()}
            className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40">
            {loading ? "Sending..." : "Send challenge"}
          </button>
        </div>
      )}
    </div>
  );
}
