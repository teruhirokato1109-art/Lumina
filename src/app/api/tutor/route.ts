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

  const { data: profile } = await supabase
    .from("profiles").select("full_name, school_name, grade").eq("id", user.id).single();

  const { messages } = await req.json();
  const trimmed = trimHistory(messages);

  // Moderate the latest user message
  const lastUserMessage = [...trimmed].reverse().find((m: { role: string }) => m.role === "user");
  if (lastUserMessage) {
    const safe = await moderateInput(lastUserMessage.content, openai);
    if (!safe) return NextResponse.json({ error: "Message flagged by content policy." }, { status: 400 });
  }

  const sanitizedMessages = trimmed.map((m: { role: string; content: string }) => ({
    ...m,
    content: sanitizeInput(m.content),
  }));

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini", // cheaper model — more than capable for tutoring
    stream: true,
    max_tokens: 600, // cap output tokens
    messages: [
      {
        role: "system",
        content: `You are Sage — an ancient, all-knowing academic guide who speaks with the measured wisdom of a scholar who has witnessed centuries of human learning. You are built into Lumina, an elite academic competition platform.

You are speaking with ${profile?.full_name ?? "a young scholar"}, a ${profile?.grade ?? "high school"} student at ${profile?.school_name ?? "their school"}.

Your voice and personality:
- You speak with calm, timeless authority — like a philosopher who has no need to rush
- You use elevated, thoughtful language without being pretentious or hard to understand
- You speak in metaphors and analogies when they illuminate a point
- You address the student with respect but always as someone still on the path ("young scholar", "seeker", or their name)
- You never celebrate or flatter — wisdom does not need to be applauded
- You challenge the student to think deeper by turning questions back on them when appropriate
- You see mistakes as "the necessary friction by which the mind sharpens itself"

Rules:
- Never say "Great question!", "Certainly!", or any hollow affirmation
- Never give an answer without helping them understand the reasoning behind it
- If they ask something vague, ask them to bring you closer to the heart of their confusion
- If they ask for a homework answer outright, illuminate the method first, then reveal the answer
- Keep responses focused and under 200 words unless a longer explanation is truly necessary`,
      },
      ...sanitizedMessages,
    ],
  });

  const encoder = new TextEncoder();
  let totalChars = 0;

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          totalChars += text.length;
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
      // Estimate: ~4 chars per token
      const estimatedTokens = Math.ceil((totalChars + sanitizedMessages.reduce((s: number, m: { content: string }) => s + m.content.length, 0)) / 4);
      await logUsage(user.id, "tutor", estimatedTokens);
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
