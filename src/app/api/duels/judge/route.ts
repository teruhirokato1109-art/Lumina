import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { duelId } = await req.json();

  const { data: duel } = await supabase
    .from("duels")
    .select("*, challenger:profiles!duels_challenger_id_fkey(full_name, merits), opponent:profiles!duels_opponent_id_fkey(full_name, merits)")
    .eq("id", duelId).single();

  if (!duel) return NextResponse.json({ error: "Duel not found" }, { status: 404 });
  if (!duel.challenger_answer || !duel.opponent_answer) {
    return NextResponse.json({ error: "Both answers must be submitted first" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an impartial academic judge evaluating two student answers to the same question.
Judge based solely on depth of understanding, accuracy, and clarity of explanation.
Return a JSON object with exactly these fields:
{
  "winner": "challenger" | "opponent" | "draw",
  "challenger_score": <integer 0-100>,
  "opponent_score": <integer 0-100>,
  "reasoning": "<2-3 sentences explaining your decision fairly>"
}
Output only valid JSON.`,
      },
      {
        role: "user",
        content: `Topic: ${duel.topic}

Challenger (${(duel.challenger as { full_name: string })?.full_name}):
${duel.challenger_answer}

Opponent (${(duel.opponent as { full_name: string })?.full_name}):
${duel.opponent_answer}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const judgment = JSON.parse(completion.choices[0].message.content ?? "{}");
  const winnerId = judgment.winner === "challenger" ? duel.challenger_id
    : judgment.winner === "opponent" ? duel.opponent_id : null;

  // Update duel
  await supabase.from("duels").update({
    status: "completed",
    winner_id: winnerId,
  }).eq("id", duelId);

  // Distribute Merits
  const wager = duel.merit_wager;
  if (winnerId) {
    const loserId = winnerId === duel.challenger_id ? duel.opponent_id : duel.challenger_id;
    const { data: winner } = await supabase.from("profiles").select("merits").eq("id", winnerId).single();
    const { data: loser } = await supabase.from("profiles").select("merits").eq("id", loserId).single();

    await supabase.from("profiles").update({ merits: (winner?.merits ?? 0) + wager * 2 }).eq("id", winnerId);
    await supabase.from("profiles").update({ merits: Math.max(0, (loser?.merits ?? 0) - wager) }).eq("id", loserId);

    await supabase.from("merit_transactions").insert([
      { user_id: winnerId, amount: wager * 2, reason: `Won duel: ${duel.topic}` },
      { user_id: loserId, amount: -wager, reason: `Lost duel: ${duel.topic}` },
    ]);
  } else {
    // Draw — refund both
    const { data: challenger } = await supabase.from("profiles").select("merits").eq("id", duel.challenger_id).single();
    const { data: opponent } = await supabase.from("profiles").select("merits").eq("id", duel.opponent_id).single();
    await supabase.from("profiles").update({ merits: (challenger?.merits ?? 0) + wager }).eq("id", duel.challenger_id);
    await supabase.from("profiles").update({ merits: (opponent?.merits ?? 0) + wager }).eq("id", duel.opponent_id);
    await supabase.from("merit_transactions").insert([
      { user_id: duel.challenger_id, amount: wager, reason: `Draw — refund: ${duel.topic}` },
      { user_id: duel.opponent_id, amount: wager, reason: `Draw — refund: ${duel.topic}` },
    ]);
  }

  return NextResponse.json({ judgment, winnerId });
}
