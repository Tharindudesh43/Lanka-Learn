"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, CreditCard, TrendingUp, GraduationCap, ShieldCheck } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalPublishedCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  signupsByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); else setError(res.error); })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>;
  if (!data) return null;

  const maxSignup = Math.max(...data.signupsByMonth.map((m) => m.count), 1);
  const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.revenue), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-purple-500" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers}
          sub={`${data.totalStudents} students · ${data.totalInstructors} instructors`} color="bg-blue-500" />
        <StatCard icon={BookOpen} label="Total Courses" value={data.totalCourses}
          sub={`${data.totalPublishedCourses} published`} color="bg-amber-500" />
        <StatCard icon={GraduationCap} label="Total Enrollments" value={data.totalEnrollments} color="bg-indigo-500" />
        <StatCard icon={CreditCard} label="Total Revenue" value={`$${data.totalRevenue.toFixed(2)}`}
          sub="Completed transactions" color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Published Courses" value={data.totalPublishedCourses}
          sub={`${data.totalCourses - data.totalPublishedCourses} pending/draft`} color="bg-purple-500" />
        <StatCard icon={Users} label="Instructors" value={data.totalInstructors}
          sub={`${data.totalStudents} students enrolled`} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">User Signups (Last 12 Months)</h2>
          <div className="flex items-end gap-1 h-32">
            {data.signupsByMonth.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500 rounded-t-sm transition-all"
                  style={{ height: `${(m.count / maxSignup) * 100}%`, minHeight: m.count > 0 ? "4px" : "0" }}
                  title={`${m.month}: ${m.count}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400">{data.signupsByMonth[0]?.month}</span>
            <span className="text-xs text-slate-400">{data.signupsByMonth[11]?.month}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Revenue (Last 12 Months)</h2>
          <div className="flex items-end gap-1 h-32">
            {data.revenueByMonth.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-emerald-500 rounded-t-sm transition-all"
                  style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: m.revenue > 0 ? "4px" : "0" }}
                  title={`${m.month}: $${m.revenue}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400">{data.revenueByMonth[0]?.month}</span>
            <span className="text-xs text-slate-400">{data.revenueByMonth[11]?.month}</span>
          </div>
        </div>
      </div>

      {/* <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/users" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition">
            Manage Users
          </a>
          <a href="/admin/courses" className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 transition">
            Moderation Queue
          </a>
          <a href="/admin/transactions" className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition">
            View Transactions
          </a>
        </div>
      </div> */}
    </div>
  );
}