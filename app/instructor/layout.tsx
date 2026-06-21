import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart, BookOpen, GraduationCap, DollarSign, ArrowLeft, LogOut } from "lucide-react";

interface InstructorLayoutProps {
  children: React.ReactNode;
}

export default async function InstructorLayout({ children }: InstructorLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/instructor");
  }

  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-zinc-800 antialiased">
      
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200/80 shrink-0 md:h-[calc(100vh-80px)] p-6 flex flex-col justify-between">
        <div className="space-y-8">
          
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Instructor Console
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-sm border border-zinc-200/50">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name || "Instructor"} className="h-full w-full object-cover" />
                ) : (
                  session.user.name?.[0]?.toUpperCase() || "I"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {session.user.name || "Instructor"}
                </p>
                <span className="mt-0.5 inline-block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Manager Account
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Management
            </div>
            
            <Link
              href="/instructor"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 transition-all"
            >
              <BarChart className="h-4 w-4 text-blue-500" />
              Overview
            </Link>
            
            <Link
              href="/instructor/courses"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 transition-all"
            >
              <BookOpen className="h-4 w-4 text-violet-500" />
              My Courses
            </Link>
            
            <Link
              href="/instructor/revenue"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 transition-all"
            >
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Revenue & Payouts
            </Link>

            <div className="pt-6 pb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Exit
            </div>
            
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-zinc-400" />
              Back to Dashboard
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-200/80">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/60 hover:text-rose-700 transition-all border border-transparent hover:border-rose-100"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="flex-1 bg-white p-6 sm:p-8 overflow-y-auto md:h-[calc(100vh-80px)]">
        {children}
      </main>

    </div>
  );
}