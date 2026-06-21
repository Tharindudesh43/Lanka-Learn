import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, BookOpen, CreditCard, ArrowLeft,
  LogOut, LayoutDashboard, ChevronRight, Tag
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/admin",              icon: LayoutDashboard, label: "Overview",        color: "text-blue-500",   bg: "bg-blue-50"   },
  { href: "/admin/users",        icon: Users,           label: "User Accounts",   color: "text-violet-500", bg: "bg-violet-50" },
  { href: "/admin/courses",      icon: BookOpen,        label: "Moderation Queue",color: "text-amber-500",  bg: "bg-amber-50"  },
  { href: "/admin/categories",   icon: Tag,             label: "Categories",      color: "text-blue-500",   bg: "bg-blue-50"   },
  { href: "/admin/transactions", icon: CreditCard,      label: "System Sales",    color: "text-emerald-500",bg: "bg-emerald-50"},
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const initials = session.user.name
    ?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">

      <aside className="
        w-full md:w-60 shrink-0
        bg-white border-b md:border-b-0 md:border-r border-slate-100
        md:min-h-[calc(100vh-64px)] md:sticky md:top-16
        flex flex-col
      ">

        <div className="px-5 py-5 border-b border-slate-100">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
            Admin Panel
          </p>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0 overflow-hidden">
              {session.user.image
                ? <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {session.user.name || "Administrator"}
              </p>
              <span className="inline-block mt-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-600 uppercase tracking-wider">
                Global Admin
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-x-auto md:overflow-x-visible">

          <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">
            <p className="hidden md:block text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2 mb-2">
              Moderation
            </p>

            {NAV_LINKS.map(({ href, icon: Icon, label, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group whitespace-nowrap md:whitespace-normal"
              >
                <span className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </span>
                <span className="flex-1">{label}</span>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 hidden md:block transition-colors" />
              </Link>
            ))}

            <div className="hidden md:block h-px bg-slate-100 my-3" />

            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors whitespace-nowrap md:whitespace-normal"
            >
              <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              </span>
              Back to Dashoard
            </Link>
          </div>
        </nav>

        <div className="hidden md:block px-3 py-4 border-t border-slate-100">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-3.5 h-3.5 text-red-400" />
            </span>
            Sign Out
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-8 min-h-[calc(100vh-64px)] overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
