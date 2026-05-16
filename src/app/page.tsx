export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900 sticky top-0 bg-black z-10">
        <span className="text-lg font-semibold tracking-tight">Lumina</span>
        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">How it works</a>
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">Features</a>
          <a href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign in</a>
          <a href="/auth/signup" className="text-sm font-medium px-4 py-2 bg-white text-black rounded-md hover:bg-zinc-200 transition-colors">
            Get started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-36 text-center border-b border-zinc-900">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-6">
          Your school. Your grade. Your arena.
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white max-w-2xl leading-tight mb-6">
          Study harder.<br />Rank higher.
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl leading-relaxed mb-10">
          Lumina is a competitive study platform scoped to your exact school and grade. Upload your notes, challenge classmates, and prove your knowledge — no passive watching, no shortcuts.
        </p>
        <div className="flex gap-3">
          <a href="/auth/signup" className="px-6 py-3 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors">
            Claim your rank
          </a>
          <a href="#how-it-works" className="px-6 py-3 border border-zinc-800 text-zinc-400 text-sm font-medium rounded-md hover:border-zinc-600 hover:text-white transition-colors">
            See how it works
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section className="grid grid-cols-3 divide-x divide-zinc-900 border-b border-zinc-900">
        {[
          { value: "100%", label: "School-isolated" },
          { value: "0 shortcuts", label: "AI-verified answers only" },
          { value: "Live", label: "Real-time leaderboards" },
        ].map((s) => (
          <div key={s.label} className="py-8 text-center">
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* What is Lumina */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center border-b border-zinc-900">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-4">What is Lumina</p>
        <h2 className="text-3xl font-bold tracking-tight mb-6">Studying is broken. Lumina fixes it.</h2>
        <p className="text-zinc-400 leading-relaxed text-base mb-6">
          Most study tools are passive — you watch, you scroll, you forget. Lumina replaces passive consumption with active competition. You upload your class notes, Lumina generates challenges from them, and you go head-to-head with the exact peers you sit next to in class.
        </p>
        <p className="text-zinc-400 leading-relaxed text-base">
          Everything is scoped to your school and grade. The leaderboard you climb, the classmates you duel, the bounties you complete — it all maps to your actual academic reality. Lumina connects to platforms like Edsby to pull your real assignment and grade data, so the challenges you face are never random. They target exactly where you need the most work.
        </p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-4 text-center">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-center mb-16">Up and competing in three steps</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { step: "01", title: "Connect your school", body: "Sign up with your school email. Lumina isolates your environment to your school and grade — you only ever compete against real classmates." },
              { step: "02", title: "Upload your notes", body: "Drop in your class notes or sync with Edsby. Lumina reads your actual syllabus and weak spots, then generates targeted challenges from your own material." },
              { step: "03", title: "Compete and climb", body: "Challenge peers to duels, join group bounties, sit AI oral exams. Every win earns Merits. Merits build your rank. Your rank is public to your grade." },
            ].map((s) => (
              <div key={s.step}>
                <p className="text-3xl font-black text-zinc-700 mb-4">{s.step}</p>
                <p className="text-base font-semibold text-white mb-2">{s.title}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24 border-b border-zinc-900">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase mb-4 text-center">Features</p>
        <h2 className="text-3xl font-bold tracking-tight text-center mb-16">Every mechanism designed around real learning</h2>

        <div className="space-y-20">

          {/* Leaderboard */}
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">School Leaderboard</p>
              <h3 className="text-xl font-bold mb-3">Your rank, updated in real time</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Every student in your grade has a public rank. It updates the moment a duel ends, a bounty is claimed, or an oral exam is passed. There is nowhere to hide — and no algorithm curating what you see. Just a clean, honest ranking of everyone in your year.</p>
            </div>
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
              <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Grade 11 — Westview High</span>
                <span className="text-xs text-zinc-600">Live</span>
              </div>
              {[
                { rank: 1, name: "Alex M.", merits: 2840 },
                { rank: 2, name: "Priya K.", merits: 2710 },
                { rank: 3, name: "Jordan T.", merits: 2590 },
                { rank: 4, name: "You", merits: 2480, highlight: true },
                { rank: 5, name: "Sam R.", merits: 2310 },
              ].map((row) => (
                <div key={row.rank} className={`flex items-center justify-between px-4 py-3 border-b border-zinc-900 last:border-0 ${row.highlight ? "bg-zinc-900" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 w-4">{row.rank}</span>
                    <span className={`text-sm ${row.highlight ? "font-semibold text-white" : "text-zinc-400"}`}>{row.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{row.merits.toLocaleString()} M</span>
                </div>
              ))}
            </div>
          </div>

          {/* Duels */}
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 order-2 sm:order-1">
              <div className="border-b border-zinc-800 px-4 py-3">
                <span className="text-xs font-medium text-zinc-400">Open-Defiance Challenge</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Alex M. challenged you</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Topic: Cell Division — Bio 11</p>
                  </div>
                  <span className="text-xs border border-zinc-700 px-2 py-1 rounded text-zinc-400">500 M wagered</span>
                </div>
                <div className="text-sm text-zinc-400 bg-zinc-900 rounded p-3 leading-relaxed">
                  &ldquo;Explain the difference between mitosis and meiosis, and describe one scenario where each is necessary.&rdquo;
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 text-xs font-medium py-2 bg-white text-black rounded-md">Accept duel</button>
                  <button className="flex-1 text-xs font-medium py-2 border border-zinc-700 text-zinc-400 rounded-md">Decline</button>
                </div>
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Open-Defiance Duels</p>
              <h3 className="text-xl font-bold mb-3">Challenge any classmate, on any topic</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Pick a peer, pick a topic from your shared syllabus, and wager Merits. Both of you answer the same AI-generated question. A neutral AI judge evaluates both responses for depth and accuracy — not speed, not luck. The better answer wins the pot.</p>
            </div>
          </div>

          {/* Oral exams */}
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">AI Oral Exams</p>
              <h3 className="text-xl font-bold mb-3">The only exam you cannot cheat</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Lumina&apos;s oral exam mode asks follow-up questions based on your answers, in real time. If you actually understand the material, you pass. If you&apos;re reciting something you copied, it finds out within two follow-ups. Passing earns a verified badge on your profile and Merits.</p>
            </div>
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
              <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Oral Exam — Calculus 12</span>
                <span className="text-xs font-medium text-zinc-500">Q 2 / 5</span>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-zinc-300 leading-relaxed">&ldquo;You said the derivative measures rate of change. Can you give a real-world example where that rate of change is itself changing?&rdquo;</p>
                <div className="border border-zinc-800 rounded p-3 min-h-16 text-sm text-zinc-500 italic">Your spoken answer is transcribed here...</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                  <span className="text-xs text-zinc-500">Listening — speak your answer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Merits */}
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 order-2 sm:order-1">
              <div className="border-b border-zinc-800 px-4 py-3">
                <span className="text-xs font-medium text-zinc-400">Merit Activity</span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { action: "Won duel vs. Jordan T.", change: "+500", positive: true },
                  { action: "Completed Group Bounty: Thermodynamics", change: "+320", positive: true },
                  { action: "Wagered on duel vs. Priya K.", change: "−200", positive: false },
                  { action: "Passed Oral Exam: Calculus 12", change: "+150", positive: true },
                ].map((item) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{item.action}</span>
                    <span className={`text-sm font-medium ${item.positive ? "text-white" : "text-zinc-500"}`}>{item.change} M</span>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-zinc-800 flex justify-between">
                  <span className="text-sm font-semibold text-white">Total Merits</span>
                  <span className="text-sm font-semibold text-white">2,480 M</span>
                </div>
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Merits</p>
              <h3 className="text-xl font-bold mb-3">Reputation you earn, reputation you can lose</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Merits are the currency of Lumina. You earn them by winning duels, completing group bounties, and passing oral exams. You can wager them on duels or pool them with peers to unlock Study Syndicates — private groups with shared resources and combined rank weight.</p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-zinc-900 px-6 py-24 text-center bg-zinc-950">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Your grade already has a leaderboard.</h2>
        <p className="text-zinc-400 text-base max-w-md mx-auto mb-8">You just can&apos;t see it yet. Join Lumina and find out exactly where you stand.</p>
        <a href="/auth/signup" className="inline-block px-6 py-3 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors">
          Claim your rank
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-8 py-6 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">Lumina</span>
        <p className="text-xs text-zinc-700">Built for students who take it seriously.</p>
      </footer>

    </main>
  );
}
