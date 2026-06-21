import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { DollarSign, Percent, TrendingUp, Landmark } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InstructorRevenuePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/instructor/revenue");
  }

  const instructorId = session.user.id;

  // 1. Fetch transactions for instructor's courses
  const transactions = await prisma.transaction.findMany({
    where: {
      status: "COMPLETED",
      enrollment: {
        course: { instructorId },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  // Calculate gross, platform fee, and net payouts
  const grossSales = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const platformFees = transactions.reduce((sum, t) => sum + Number(t.platformFee), 0);
  const netEarnings = transactions.reduce((sum, t) => sum + Number(t.instructorPayout), 0);

  const METRICS = [
    { label: "Gross Sales", value: formatPrice(grossSales), icon: <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" /> },
    { label: "Platform Commission (15%)", value: formatPrice(platformFees), icon: <Percent className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> },
    { label: "Net Payout Earnings", value: formatPrice(netEarnings), icon: <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100">
          Revenue & Payments
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 dark:text-slate-400">
          Manage your course sale receipts and monitor bank deposit payouts.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {m.label}
              </span>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/45">
                {m.icon}
              </div>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white leading-none">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Transaction History list */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
          Receipt Invoices History
        </h3>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-550 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-50 text-slate-400 font-bold uppercase tracking-wider dark:border-slate-800/60">
                  <th className="py-2.5">Transaction ID</th>
                  <th className="py-2.5">Student</th>
                  <th className="py-2.5">Course Purchased</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Gross</th>
                  <th className="py-2.5">Platform Fee</th>
                  <th className="py-2.5">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10">
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[100px]" title={t.id}>
                      #{t.id}
                    </td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {t.enrollment.user.name || "Student"}
                      <span className="block text-[10px] text-slate-450 font-normal">
                        {t.enrollment.user.email}
                      </span>
                    </td>
                    <td className="py-3 font-medium truncate max-w-[150px]" title={t.enrollment.course.title}>
                      {t.enrollment.course.title}
                    </td>
                    <td className="py-3 text-slate-400 font-medium">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-350">
                      {formatPrice(Number(t.amount))}
                    </td>
                    <td className="py-3 text-red-500 font-semibold">
                      -{formatPrice(Number(t.platformFee))}
                    </td>
                    <td className="py-3 text-emerald-600 font-extrabold dark:text-emerald-400">
                      {formatPrice(Number(t.instructorPayout))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No transaction records found.
          </div>
        )}
      </div>

    </div>
  );
}
