import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkQuota, logUsage, moderateInput, sanitizeInput, trimHistory } from "@/lib/ai/cost-guard";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quota = await checkQuota(user.id);
  if (!quota.allowed) return NextResponse.json({ error: quota.reason }, { status: 429 });

  const { examId, subject, difficulty, history, questionNum, isLast } = await req.json();

  // Oral exam history uses { role, text } shape — trim manually
  const trimmed: { role: string; text: string }[] = history.slice(-10);
  const lastAnswer = [...trimmed].reverse().find((m) => m.role === "user");

  if (lastAnswer) {
    const safe = await moderateInput(sanitizeInput(lastAnswer.text), openai);
    if (!safe) return NextResponse.json({ error: "Input flagged by content policy." }, { status: 400 });
  }

  const sanitizedHistory = trimmed.map((m) => ({
    role: m.role === "ai" ? "assistant" as const : "user" as const,
    content: sanitizeInput(m.text),
  }));

  // Follow-ups use mini; final judgment uses gpt-4o for accuracy
  const model = isLast ? "gpt-4o" : "gpt-4o-mini";

  const messages = [
    {
      role: "system" as const,
      content: `You are a rigorous academic examiner conducting an oral exam on "${subject}" at ${difficulty} difficulty.
${isLast
  ? `This was the final answer. Evaluate the entire conversation and return JSON with exactly: { "score": <0-100>, "passed": <true if score >= 70>, "feedback": "<2-3 sentences of honest, specific feedback>" }. Output only valid JSON.`
  : `Ask one follow-up question that probes deeper into what the student just said. Output only the follow-up question.`}`,
    },
    ...sanitizedHistory,
  ];

  const completion = await openai.chat.completions.create({
    model,
    max_tokens: isLast ? 300 : 150,
    messages,
    response_format: isLast ? { type: "json_object" } : { type: "text" },
  });

  const content = completion.choices[0].message.content ?? "";
  await logUsage(user.id, "oral-exam-answer", isLast ? 800 : 400);

  if (isLast) {
    const result = JSON.parse(content);
    await supabase.from("oral_exams").update({
      score: result.score, passed: result.passed,
      question_count: questionNum, transcript: history,
    }).eq("id", examId);

    if (result.passed) {
      const { data: profile } = await supabase.from("profiles").select("merits").eq("id", user.id).single();
      await supabase.from("profiles").update({ merits: (profile?.merits ?? 0) + 150 }).eq("id", user.id);
      await supabase.from("merit_transactions").insert({ user_id: user.id, amount: 150, reason: `Passed oral exam: ${subject}` });
    }
    return NextResponse.json({ result });
  }

  return NextResponse.json({ followUp: content });
}
