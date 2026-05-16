import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkQuota, logUsage, moderateInput } from "@/lib/ai/cost-guard";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_FILE_BYTES = 500_000; // 500KB hard limit

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quota = await checkQuota(user.id);
  if (!quota.allowed) return NextResponse.json({ error: quota.reason }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = (formData.get("title") as string ?? "").slice(0, 200);
  const subject = (formData.get("subject") as string ?? "").slice(0, 200);

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File too large. Maximum size is 500KB." }, { status: 400 });

  const text = await file.text();
  const truncated = text.slice(0, 6_000); // ~1500 tokens

  const safe = await moderateInput(truncated.slice(0, 1000), openai);
  if (!safe) return NextResponse.json({ error: "File content flagged by content policy." }, { status: 400 });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content: `Generate exactly 5 study challenge questions from the provided class notes. Questions should test genuine understanding, ranging from recall to application. Return a JSON object: { "questions": ["q1", "q2", "q3", "q4", "q5"] }`,
      },
      { role: "user", content: `Subject: ${subject}\n\nNotes:\n${truncated}` },
    ],
    response_format: { type: "json_object" },
  });

  await logUsage(user.id, "notes-upload", 2000);

  let challengeCount = 5;
  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    challengeCount = Array.isArray(parsed.questions) ? parsed.questions.length : 5;
  } catch {}

  const { error } = await supabase.from("notes").insert({
    user_id: user.id, title, subject, content: truncated, challenge_count: challengeCount,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  if (count === 1) {
    const { data: profile } = await supabase.from("profiles").select("merits").eq("id", user.id).single();
    await supabase.from("profiles").update({ merits: (profile?.merits ?? 0) + 50 }).eq("id", user.id);
    await supabase.from("merit_transactions").insert({ user_id: user.id, amount: 50, reason: "First note upload bonus" });
  }

  return NextResponse.json({ success: true, challengeCount });
}
