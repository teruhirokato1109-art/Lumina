"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Note { id: string; title: string; subject: string; created_at: string; challenge_count: number; }

export default function NotesPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notes").select("id, title, subject, created_at, challenge_count")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setNotes(data ?? []);
  }

  async function uploadFile(file: File) {
    if (!subject.trim() || !title.trim()) { setError("Please fill in a title and subject before uploading."); return; }
    setUploading(true); setError(null); setSuccess(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("subject", subject.trim());
    const res = await fetch("/api/notes/upload", { method: "POST", body: formData });
    const result = await res.json();
    if (result.error) { setError(result.error); }
    else { setSuccess(`"${title}" uploaded — ${result.challengeCount} challenges generated.`); setTitle(""); setSubject(""); loadNotes(); }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="px-10 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-1">Notes</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">My Notes</h1>
        <p className="text-sm text-zinc-400 mt-1">Upload class notes. Lumina converts them into targeted study challenges.</p>
      </div>

      <div className="border border-zinc-900 rounded-lg p-6 mb-8 bg-zinc-950">
        <p className="text-sm font-semibold text-white mb-4">Upload new notes</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 4 Notes"
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology 11"
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
          </div>
        </div>
        <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)} onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg px-6 py-10 text-center cursor-pointer transition-colors ${dragOver ? "border-zinc-600 bg-zinc-900" : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"}`}>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {uploading ? <p className="text-sm text-zinc-400">Processing your notes...</p> : (
            <>
              <p className="text-sm text-zinc-400 mb-1">Drop your notes here, or click to browse</p>
              <p className="text-xs text-zinc-600">Supports PDF, TXT, DOCX, Markdown</p>
            </>
          )}
        </div>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        {success && <p className="text-sm text-zinc-400 mt-3">{success}</p>}
      </div>

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Uploaded notes</h2>
        <div className="border border-zinc-900 rounded-lg overflow-hidden">
          {notes.length > 0 ? notes.map((n) => (
            <div key={n.id} className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 last:border-0 hover:bg-zinc-950 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{n.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{n.subject} · {new Date(n.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-xs text-zinc-500">{n.challenge_count} challenges</p>
            </div>
          )) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-zinc-500">No notes uploaded yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Upload your first set of class notes above.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
