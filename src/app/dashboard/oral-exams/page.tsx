import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OralExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: exams } = await supabase
    .from("oral_exams").select("id, subject, score, passed, question_count, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false });

  const passed = exams?.filter((e) => e.passed).length ?? 0;
  const avgScore = exams && exams.length > 0
    ? Math.round(exams.reduce((s, e) => s + (e.score ?? 0), 0) / exams.length) : null;

  return (
    <div className="px-10 py-10 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Oral Exams</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI-Evaluated Exams</h1>
          <p className="text-sm text-zinc-400 mt-1">Answer questions out loud. The AI follows up. No shortcuts.</p>
        </div>
        <a href="/dashboard/oral-exams/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors">
          Start exam
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Exams taken", value: exams?.length ?? 0 },
          { label: "Passed", value: passed },
          { label: "Avg. score", value: avgScore !== null ? `${avgScore}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="border border-zinc-900 rounded-lg px-5 py-4 bg-zinc-950">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-zinc-900 rounded-lg px-5 py-5 mb-8 bg-zinc-950">
        <p className="text-sm font-semibold text-white mb-2">How oral exams work</p>
        <ol className="space-y-1.5">
          {[
            "Choose a subject and difficulty level.",
            "The AI asks you an open-ended question.",
            "Type your answer.",
            "The AI asks follow-up questions based on what you said.",
            "After 5 questions, you receive a score and pass/fail verdict.",
            "Passing earns a verified badge on your profile and 150 Merits.",
          ].map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-400">
              <span className="text-zinc-600 shrink-0">{i + 1}.</span>{step}
            </li>
          ))}
        </ol>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Exam history</h2>
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          {exams && exams.length > 0 ? exams.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 last:border-0 hover:bg-zinc-950 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{e.subject}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{e.question_count ?? 5} questions · {new Date(e.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">{e.score ?? "—"}%</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.passed ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"}`}>
                  {e.passed ? "Passed" : "Failed"}
                </span>
              </div>
            </div>
          )) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-zinc-500">No exams taken yet.</p>
              <a href="/dashboard/oral-exams/new" className="text-xs text-zinc-400 underline mt-1 block">Take your first exam →</a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
