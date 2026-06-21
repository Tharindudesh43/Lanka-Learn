"use client";

import { useEffect, useState } from "react";
import { CreditCard, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  platformFee: number;
  instructorPayout: number;
  status: string;
  createdAt: string;
  stripePaymentIntentId: string | null;
  student: { id: string; name: string | null; email: string };
  course: { id: string; title: string };
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REFUNDED: "bg-red-100 text-red-600",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  async function fetchTransactions() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/transactions?${params}`);
    const data = await res.json();
    if (data.success) {
      setTransactions(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      const rev = data.data
        .filter((t: Transaction) => t.status === "COMPLETED")
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      setTotalRevenue(rev);
    }
    setLoading(false);
  }

  useEffect(() => { fetchTransactions(); }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-500" />
          System Sales
        </h1>
        <p className="text-sm text-slate-500 mt-1">{totalCount} transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-medium">Page Revenue</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-0.5">From current page</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-medium">Filter</p>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No transactions found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Fee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payout</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">{t.student.name || "—"}</p>
                    <p className="text-xs text-slate-400">{t.student.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700 text-xs font-medium line-clamp-2 max-w-[180px]">{t.course.title}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800">${t.amount.toFixed(2)}</td>
                  <td className="px-5 py-4 text-slate-500">${t.platformFee.toFixed(2)}</td>
                  <td className="px-5 py-4 text-emerald-700 font-medium">${t.instructorPayout.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status] || "bg-slate-100 text-slate-500"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
