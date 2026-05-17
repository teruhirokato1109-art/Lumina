"use client";

import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }

function SageAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? 64 : size === "md" ? 36 : 24;
  return (
    <svg width={dim} height={dim} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" stroke="white" strokeWidth="1.5" />
      {/* Eyes */}
      <rect x="18" y="26" width="10" height="3" rx="1.5" fill="white" />
      <rect x="36" y="26" width="10" height="3" rx="1.5" fill="white" />
      {/* Mouth — subtle, straight */}
      <rect x="22" y="38" width="20" height="2" rx="1" fill="white" opacity="0.5" />
      {/* Crown mark — a small triangle above head */}
      <path d="M32 4 L35 10 L32 9 L29 10 Z" fill="white" opacity="0.4" />
    </svg>
  );
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "An error occurred." }));
      setMessages([...newMessages, { role: "assistant", content: `Error: ${err.error ?? "Something went wrong."}` }]);
      setStreaming(false);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      setMessages([...newMessages, { role: "assistant", content: full }]);
    }

    setStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen">

      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-5 border-b border-zinc-900 shrink-0">
        <SageAvatar size="md" />
        <div>
          <p className="text-sm font-semibold text-white">Sage</p>
          <p className="text-xs text-zinc-500">Lumina&apos;s AI study guide — ask anything</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Sage greeting — always shown */}
        <div className="flex gap-3 justify-start">
          <div className="shrink-0 mt-0.5"><SageAvatar size="sm" /></div>
          <div className="max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed bg-zinc-950 border border-zinc-900 text-zinc-300">
            Greetings, young scholar. It seems as though you seek my wisdom — a worthy pursuit. Whether you are lost in the labyrinth of calculus, tangled in the threads of history, or simply trying to make sense of what your teacher said, I am here. Ask, and I shall illuminate the path.
          </div>
        </div>

        {/* Prompt suggestions — only when no messages yet */}
        {isEmpty && (
          <div className="flex gap-3 justify-start">
            <div className="shrink-0 mt-0.5 w-6" />
            <div className="grid grid-cols-1 gap-2 max-w-xl w-full">
              {[
                "Explain photosynthesis like I've never heard of it",
                "What's the difference between velocity and acceleration?",
                "Help me understand how to solve quadratic equations",
                "What caused World War I?",
              ].map((prompt) => (
                <button key={prompt} onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-left text-sm text-zinc-400 border border-zinc-900 rounded-lg px-4 py-2.5 hover:border-zinc-700 hover:text-zinc-300 transition-colors">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="shrink-0 mt-0.5"><SageAvatar size="sm" /></div>
            )}
            <div className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-zinc-900 text-zinc-200"
                : "bg-zinc-950 border border-zinc-900 text-zinc-300"
            }`}>
              {m.content}
              {m.role === "assistant" && streaming && i === messages.length - 1 && (
                <span className="inline-block w-1 h-4 bg-zinc-600 ml-0.5 align-middle" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-900 px-8 py-4">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask Sage anything..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none"
            style={{ minHeight: "44px", maxHeight: "160px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 160) + "px";
            }}
          />
          <button onClick={send} disabled={!input.trim() || streaming}
            className="px-4 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-30 shrink-0">
            Send
          </button>
        </div>
        <p className="text-xs text-zinc-700 text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
