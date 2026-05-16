import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkQuota, logUsage, moderateInput, sanitizeInput } from "@/lib/ai/cost-guard";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quota = await checkQuota(user.id);
  if (!quota.allowed) return NextResponse.json({ error: quota.reason }, { status: 429 });

  const { subject, difficulty } = await req.json();
  const safeSubject = sanitizeInput(subject);

  const safe = await moderateInput(safeSubject, openai);
  if (!safe) return NextResponse.json({ error: "Input flagged by content policy." }, { status: 400 });

  const difficultyGuide = {
    easy: "straightforward recall and basic understanding",
    medium: "application and analysis requiring genuine understanding",
    hard: "synthesis, evaluation, and deep conceptual reasoning",
  }[difficulty as "easy" | "medium" | "hard"];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content: `You are a rigorous academic examiner conducting an oral exam. Ask one open-ended question about the given subject at ${difficulty} difficulty (${difficultyGuide}). The question should require a thoughtful answer — not a yes/no. Output only the question itself.`,
      },
      { role: "user", content: `Subject: ${safeSubject}` },
    ],
  });

  const question = completion.choices[0].message.content ?? "";
  await logUsage(user.id, "oral-exam-start", 300);

  const { data: exam } = await supabase
    .from("oral_exams")
    .insert({ user_id: user.id, subject: safeSubject, difficulty, transcript: [] })
    .select("id").single();

  return NextResponse.json({ question, examId: exam?.id });
}
