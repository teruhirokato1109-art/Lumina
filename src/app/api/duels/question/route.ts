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

  const { duelId, topic } = await req.json();
  const safeTopic = sanitizeInput(topic);

  const safe = await moderateInput(safeTopic, openai);
  if (!safe) return NextResponse.json({ error: "Topic flagged by content policy." }, { status: 400 });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content: `Generate one duel question for two students competing on this topic. The question must require genuine understanding, be answerable in 3-5 sentences, and allow objective comparison of answers. Output only the question.`,
      },
      { role: "user", content: `Topic: ${safeTopic}` },
    ],
  });

  const question = completion.choices[0].message.content ?? "";
  await logUsage(user.id, "duel-question", 300);

  await supabase.from("duels").update({ status: "active", challenger_answer: question }).eq("id", duelId);

  return NextResponse.json({ question });
}
