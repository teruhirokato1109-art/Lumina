"use client";

import { useState } from "react";

type Phase = "setup" | "question" | "followup" | "done";
interface Message { role: "ai" | "user"; text: string; }

export default function NewOralExamPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [questionNum, setQuestionNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; feedback: string } | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const TOTAL = 5;

  async function startExam() {
    if (!subject.trim()) return;
    setLoading(true);
    const res = await fetch("/api/oral-exam/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, difficulty }),
    });
    const data = await res.json();
    setMessages([{ role: "ai", text: data.question }]);
    setQuestionNum(1);
    setExamId(data.examId);
    setPhase("question");
    setLoading(false);
  }

  async function submitAnswer() {
    if (!input.trim()) return;
    setLoading(true);
    const userMsg: Message = { role: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    const isLast = questionNum >= TOTAL;
    const res = await fetch("/api/oral-exam/answer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examId, subject, difficulty, history: newMessages, questionNum, isLast }),
    });
    const data = await res.json();
    if (isLast) { setResult(data.result); setPhase("done"); }
    else { setMessages([...newMessages, { role: "ai", text: data.followUp }]); setQuestionNum((n) => n + 1); setPhase("followup"); }
    setLoading(false);
  }

  return (
    <div className="px-10 py-10 max-w-xl">
      <a href="/dashboard/oral-exams" className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors">← Back to exams</a>
      <div className="mt-4 mb-8">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Oral Exam</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">AI-Evaluated Exam</h1>
      </div>

      {phase === "setup" && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Cell Biology, The Cold War, Calculus..."
              className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border capitalize transition-colors ${difficulty === d ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="border border-zinc-900 rounded-lg px-4 py-4 bg-zinc-950">
            <p className="text-xs text-zinc-400 leading-relaxed">
              You will be asked <strong className="text-zinc-300">5 questions</strong>. The AI asks follow-ups based on your answers. Passing score is <strong className="text-zinc-300">70%</strong> — earned through depth and accuracy.
            </p>
          </div>
          <button onClick={startExam} disabled={loading || !subject.trim()}
            className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40">
            {loading ? "Starting..." : "Begin exam"}
          </button>
        </div>
      )}

      {(phase === "question" || phase === "followup") && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Question {questionNum} of {TOTAL}</span>
            <span className="text-xs text-zinc-500">{subject} · {difficulty}</span>
          </div>
          <div className="w-full h-px bg-zinc-900">
            <div className="h-px bg-zinc-500 transition-all" style={{ width: `${(questionNum / TOTAL) * 100}%` }} />
          </div>
          <div className="space-y-3 border border-zinc-900 rounded-lg p-4 max-h-72 overflow-y-auto bg-zinc-950">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm leading-relaxed ${m.role === "ai" ? "text-zinc-300" : "text-zinc-400 pl-3 border-l border-zinc-800"}`}>
                <span className="text-xs font-medium block mb-1 text-zinc-500">{m.role === "ai" ? "Examiner" : "You"}</span>
                {m.text}
              </div>
            ))}
            {loading && <p className="text-xs text-zinc-600 italic">Evaluating...</p>}
          </div>
          <div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) submitAnswer(); }}
              rows={4} placeholder="Type your answer here..."
              className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none" />
            <p className="text-xs text-zinc-600 mt-1">⌘ + Enter to submit</p>
          </div>
          <button onClick={submitAnswer} disabled={loading || !input.trim()}
            className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40">
            {loading ? "Submitting..." : questionNum >= TOTAL ? "Submit final answer" : "Submit answer"}
          </button>
        </div>
      )}

      {phase === "done" && result && (
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950">
          <div className="px-6 py-6 text-center border-b border-zinc-900">
            <p className="text-3xl font-black text-white mb-1">{result.score}%</p>
            <p className="text-sm text-zinc-400 mb-3">{subject} · {difficulty}</p>
            <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${result.passed ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"}`}>
              {result.passed ? "Passed — verified badge earned" : "Not passed — try again"}
            </span>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Examiner feedback</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{result.feedback}</p>
          </div>
          <div className="px-6 py-4 border-t border-zinc-900 flex gap-3">
            <a href="/dashboard/oral-exams" className="flex-1 text-center py-2 text-sm font-medium border border-zinc-800 text-zinc-400 rounded-md hover:bg-zinc-900 transition-colors">
              View all exams
            </a>
            <button onClick={() => { setPhase("setup"); setMessages([]); setQuestionNum(0); setResult(null); setSubject(""); }}
              className="flex-1 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-zinc-200 transition-colors">
              Take another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
