"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

type Step = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "At least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      e.password = "Must contain uppercase, lowercase, and a number";
    if (password !== confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase().trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || "Registration failed"); setSubmitting(false); return; }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 overflow-hidden border border-slate-100">

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-7">
            <div className="flex items-center gap-3 mb-1">
              {!success && (
                <div className="flex gap-2">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === step ? "w-6 bg-white" : "w-2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mt-2">
              {success ? "Account created!" : step === 1 ? "Create your account" : "Set your password"}
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              {success
                ? "Redirecting to sign in…"
                : step === 1
                ? "Step 1 of 2 — Your details"
                : "Step 2 of 2 — Secure your account"}
            </p>
          </div>

          <div className="px-8 py-7">

            {success && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">Welcome aboard!</h2>
                <p className="text-sm text-slate-500">Your account has been created. Redirecting to sign in…</p>
              </div>
            )}

            {!success && step === 1 && (
              <form onSubmit={handleNext} noValidate className="space-y-4">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {serverError}
                  </div>
                )}

          
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    autoFocus
                    onChange={(e) => { setName(e.target.value); setErrors({}); }}
                    className={`w-full text-black px-4 py-3 text-sm rounded-xl border outline-none transition-all ${
                      errors.name
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                    autoComplete="email"
                    className={`w-full text-black px-4 py-3 text-sm rounded-xl border outline-none transition-all ${
                      errors.email
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "STUDENT",    emoji: "🎓", label: "Learn",  desc: "Enroll in courses" },
                      { value: "INSTRUCTOR", emoji: "🏫", label: "Teach",  desc: "Create & sell courses" },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value as any)}
                        className={`p-4 text-black rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          role === r.value
                            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                            : "border-slate-200 hover:border-blue-200 bg-white"
                        }`}
                      >
                        <div className="text-2xl mb-1">{r.emoji}</div>
                        <div className="text-sm font-bold text-slate-800">{r.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {!success && step === 2 && (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {serverError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      autoFocus
                      onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                      autoComplete="new-password"
                      className={`w-full text-black px-4 py-3 pr-11 text-sm rounded-xl border outline-none transition-all ${
                        errors.password
                          ? "border-red-400 focus:ring-2 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
                  {password && !errors.password && (
                    <div className="flex gap-1 mt-1">
                      {[
                        password.length >= 8,
                        /[A-Z]/.test(password),
                        /[a-z]/.test(password),
                        /\d/.test(password),
                      ].map((ok, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${ok ? "bg-emerald-400" : "bg-slate-200"}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
                      autoComplete="new-password"
                      className={`w-full px-4 py-3 text-black pr-11 text-sm rounded-xl border outline-none transition-all ${
                        errors.confirmPassword
                          ? "border-red-400 focus:ring-2 focus:ring-red-100"
                          : confirmPassword && confirmPassword === password
                          ? "border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
                  {confirmPassword && confirmPassword === password && !errors.confirmPassword && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition flex-shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By creating an account you agree to our{" "}
          <span className="text-slate-500 font-medium">Terms of Service</span> and{" "}
          <span className="text-slate-500 font-medium">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}