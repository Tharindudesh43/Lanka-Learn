import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, User, GraduationCap, Shield, LogOut, ChevronRight } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/login?callbackUrl=/dashboard");

  const role = session.user.role;

  const initials = session.user.name
    ?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

      <aside className="
        w-full md:w-60 shrink-0
        bg-white border-b md:border-b-0 md:border-r border-slate-100
        md:min-h-[calc(100vh-64px)] md:sticky md:top-16
        flex flex-col
      ">

        <div className="px-5 py-5 border-b border-slate-100">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
            My Profile
          </p>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 overflow-hidden">
              {session.user.image
                ? <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {session.user.name || "Student User"}
              </p>
              <span className="inline-block mt-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                {role.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-x-auto md:overflow-x-visible">
          <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">

            <p className="hidden md:block text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2 mb-2">
              Student Center
            </p>

            <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group whitespace-nowrap md:whitespace-normal">
              <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              </span>
              <span className="flex-1">My Courses</span>
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 hidden md:block" />
            </Link>

            <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group whitespace-nowrap md:whitespace-normal">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-indigo-500" />
              </span>
              <span className="flex-1">Edit Profile</span>
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 hidden md:block" />
            </Link>

            {(role === "INSTRUCTOR" || role === "ADMIN") && (
              <>
                <div className="hidden md:block h-px bg-slate-100 my-3" />
                <p className="hidden md:block text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2 mb-2">
                  Instructor Console
                </p>
                <Link href="/instructor" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group whitespace-nowrap md:whitespace-normal">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                  <span className="flex-1">Instructor Dashboard</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 hidden md:block" />
                </Link>
              </>
            )}

            {role === "ADMIN" && (
              <>
                <div className="hidden md:block h-px bg-slate-100 my-3" />
                <p className="hidden md:block text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2 mb-2">
                  Administration
                </p>
                <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group whitespace-nowrap md:whitespace-normal">
                  <span className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-purple-500" />
                  </span>
                  <span className="flex-1">Admin Dashboard</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 hidden md:block" />
                </Link>
              </>
            )}
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