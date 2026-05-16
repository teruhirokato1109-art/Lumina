import { createClient } from "@/lib/supabase/server";

export const MONTHLY_TOKEN_LIMIT = 50_000;
export const MAX_INPUT_CHARS = 4_000;
export const MAX_HISTORY_MESSAGES = 10;

export async function checkQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_tokens_used, quota_reset_at")
    .eq("id", userId)
    .single();

  if (!profile) return { allowed: false, reason: "Profile not found." };

  if (profile.quota_reset_at && new Date(profile.quota_reset_at) < new Date()) {
    await supabase.from("profiles").update({
      monthly_tokens_used: 0,
      quota_reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    }).eq("id", userId);
    return { allowed: true };
  }

  if ((profile.monthly_tokens_used ?? 0) >= MONTHLY_TOKEN_LIMIT) {
    return { allowed: false, reason: "You have reached your monthly usage limit. It resets at the start of next month." };
  }

  return { allowed: true };
}

export async function logUsage(userId: string, route: string, tokensEstimate: number) {
  const supabase = await createClient();
  await Promise.all([
    supabase.from("usage_logs").insert({ user_id: userId, route, tokens_estimate: tokensEstimate }),
    supabase.rpc("increment_tokens", { user_id_input: userId, amount: tokensEstimate }),
  ]);
}

export async function moderateInput(text: string, openai: import("openai").default): Promise<boolean> {
  try {
    const result = await openai.moderations.create({ input: text });
    return !result.results[0]?.flagged;
  } catch {
    return true; // fail open — don't block users if moderation is down
  }
}

export function sanitizeInput(text: string): string {
  return text.slice(0, MAX_INPUT_CHARS).trim();
}

export function trimHistory(messages: { role: string; content: string }[]) {
  // Always keep last N messages to cap context window costs
  return messages.slice(-MAX_HISTORY_MESSAGES);
}
