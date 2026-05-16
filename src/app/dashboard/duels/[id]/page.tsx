"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

interface Duel {
  id: string; topic: string; status: string; merit_wager: number;
  challenger_id: string; opponent_id: string; winner_id: string | null;
  challenger_answer: string | null; opponent_answer: string | null;
  challenger: { full_name: string }; opponent: { full_name: string };
}

interface Judgment {
  winner: string; challenger_score: number; opponent_score: number; reasoning: string;
}

export default function DuelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [duel, setDuel] = useState<Duel | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("duels")
        .select("*, challenger:profiles!duels_challenger_id_fkey(full_name), opponent:profiles!duels_opponent_id_fkey(full_name)")
        .eq("id", id).single();

      setDuel(data);

      if (data?.status === "active" && data?.challenger_answer) {
        setQuestion(data.challenger_answer);
      }
    }
    load();
  }, [id]);

  async function generateQuestion() {
    setLoading(true);
    const res = await fetch("/api/duels/question", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duelId: id, topic: duel?.topic }),
    });
    const data = await res.json();
    setQuestion(data.question);
    setDuel((prev) => prev ? { ...prev, status: "active" } : prev);
    setLoading(false);
  }

  async function submitAnswer() {
    if (!answer.trim() || !duel || !userId) return;
    setLoading(true);

    const isChallenger = userId === duel.challenger_id;
    const field = isChallenger ? "challenger_answer" : "opponent_answer";

    await supabase.from("duels").update({ [field]: answer.trim() }).eq("id", id);
    setSubmitted(true);

    // Reload duel to check if both answered
    const { data: updated } = await supabase
      .from("duels")
      .select("*, challenger:profiles!duels_challenger_id_fkey(full_name), opponent:profiles!duels_opponent_id_fkey(full_name)")
      .eq("id", id).single();

    setDuel(updated);

    if (updated?.challenger_answer && updated?.opponent_answer) {
      const res = await fetch("/api/duels/judge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duelId: id }),
      });
      const result = await res.json();
      setJudgment(result.judgment);
      const { data: final } = await supabase
        .from("duels")
        .select("*, challenger:profiles!duels_challenger_id_fkey(full_name), opponent:profiles!duels_opponent_id_fkey(full_name)")
        .eq("id", id).single();
      setDuel(final);
    }

    setLoading(false);
  }

  if (!duel) return (
    <div className="px-10 py-10 text-sm text-zinc-500">Loading duel...</div>
  );

  const isChallenger = userId === duel.challenger_id;
  const isOpponent = userId === duel.opponent_id;
  const myAnswer = isChallenger ? duel.challenger_answer : duel.opponent_answer;
  const opponentAnswer = isChallenger ? duel.opponent_answer : duel.challenger_answer;
  const opponentName = isChallenger ? duel.opponent?.full_name : duel.challenger?.full_name;
  const won = duel.winner_id === userId;
  const isDraw = duel.status === "completed" && !duel.winner_id;

  return (
    <div className="px-10 py-10 max-w-2xl">
      <a href="/dashboard/duels" className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors">← Back to duels</a>

      <div className="mt-4 mb-8">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">Duel</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            duel.status === "pending" ? "border-zinc-800 text-zinc-500" :
            duel.status === "active" ? "border-zinc-700 text-zinc-400" :
            "border-zinc-800 text-zinc-500"
          }`}>{duel.status}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{duel.topic}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {duel.challenger.full_name} vs. {duel.opponent.full_name} · {duel.merit_wager} Merits wagered
        </p>
      </div>

      {/* Pending — challenger starts the duel */}
      {duel.status === "pending" && isChallenger && (
        <div className="border border-zinc-900 rounded-lg px-6 py-8 text-center bg-zinc-950 mb-6">
          <p className="text-sm text-zinc-400 mb-4">
            You challenged <span className="text-white font-medium">{opponentName}</span>. Generate the question to begin.
          </p>
          <button onClick={generateQuestion} disabled={loading}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40">
            {loading ? "Generating..." : "Generate duel question"}
          </button>
        </div>
      )}

      {duel.status === "pending" && isOpponent && (
        <div className="border border-zinc-900 rounded-lg px-6 py-8 text-center bg-zinc-950 mb-6">
          <p className="text-sm text-zinc-400">Waiting for <span className="text-white font-medium">{duel.challenger.full_name}</span> to generate the question.</p>
        </div>
      )}

      {/* Question */}
      {question && (
        <div className="border border-zinc-800 rounded-lg px-5 py-5 mb-6 bg-zinc-950">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">The Question</p>
          <p className="text-sm text-zinc-200 leading-relaxed">{question}</p>
        </div>
      )}

      {/* Answer input */}
      {duel.status === "active" && !myAnswer && !submitted && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your answer</label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6}
              placeholder="Write your answer here. Be thorough — the AI judge evaluates depth and accuracy."
              className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none" />
            <p className="text-xs text-zinc-600 mt-1.5">Your answer is hidden from your opponent until both have submitted.</p>
          </div>
          <button onClick={submitAnswer} disabled={loading || !answer.trim()}
            className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40">
            {loading ? "Submitting..." : "Submit answer"}
          </button>
        </div>
      )}

      {/* Waiting for opponent */}
      {(submitted || (duel.status === "active" && myAnswer)) && !duel.winner_id && !isDraw && (
        <div className="border border-zinc-900 rounded-lg px-5 py-6 text-center bg-zinc-950 mb-6">
          <p className="text-sm text-zinc-400">Your answer is locked in.</p>
          <p className="text-xs text-zinc-600 mt-1">Waiting for {opponentName} to submit — the AI judge runs automatically once both answers are in.</p>
        </div>
      )}

      {/* Judgment */}
      {(judgment || duel.status === "completed") && (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">AI Judgment</p>
            {duel.status === "completed" && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDraw ? "bg-zinc-800 text-zinc-400" : won ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"}`}>
                {isDraw ? "Draw" : won ? "You won" : "You lost"}
              </span>
            )}
          </div>

          {judgment && (
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-900 rounded-lg px-4 py-3">
                  <p className="text-xs text-zinc-500 mb-1">{duel.challenger.full_name}</p>
                  <p className="text-2xl font-bold text-white">{judgment.challenger_score}</p>
                  <p className="text-xs text-zinc-600">/ 100</p>
                </div>
                <div className="border border-zinc-900 rounded-lg px-4 py-3">
                  <p className="text-xs text-zinc-500 mb-1">{duel.opponent.full_name}</p>
                  <p className="text-2xl font-bold text-white">{judgment.opponent_score}</p>
                  <p className="text-xs text-zinc-600">/ 100</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Reasoning</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{judgment.reasoning}</p>
              </div>
            </div>
          )}

          {duel.status === "completed" && (
            <div className="px-5 py-4 border-t border-zinc-900 grid grid-cols-2 gap-4">
              {[
                { label: duel.challenger.full_name, answer: duel.challenger_answer },
                { label: duel.opponent.full_name, answer: duel.opponent_answer },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{s.label}&apos;s answer</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{s.answer ?? "No answer submitted"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
