import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/duels", label: "Duels" },
  { href: "/dashboard/oral-exams", label: "Oral Exams" },
  { href: "/dashboard/notes", label: "My Notes" },
  { href: "/dashboard/merits", label: "Merits" },
  { href: "/dashboard/tutor", label: "Sage" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, school_name, grade, merits, subscription_status")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-zinc-900 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-zinc-900">
          <a href="/" className="text-base font-semibold tracking-tight text-white">Lumina</a>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${link.label === "Sage" ? "text-zinc-400 hover:bg-zinc-900 hover:text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
              <span>{link.label}</span>
              {link.label === "Sage" && (
                <span className="text-xs text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">AI</span>
              )}
            </a>
          ))}
        </nav>

        <div className="border-t border-zinc-900 px-5 py-4">
          <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? "—"}</p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{profile?.school_name} · {profile?.grade}</p>
          <p className="text-xs text-zinc-600 mt-1">{profile?.merits?.toLocaleString()} Merits</p>

          {profile?.subscription_status === "active" ? (
            <span className="inline-block text-xs text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded mt-2">Pro</span>
          ) : (
            <a href="/dashboard/upgrade"
              className="inline-block text-xs font-medium text-black bg-white px-2 py-0.5 rounded mt-2 hover:bg-zinc-200 transition-colors">
              Upgrade
            </a>
          )}

          <form action={logout}>
            <button className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-3 block">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
