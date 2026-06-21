"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle, Loader2, ArrowRight } from "lucide-react";

type Step = "email" | "password";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Enter a valid email"); return; }
    setEmailError("");
    setStep("password");
    setTimeout(() => passwordRef.current?.focus(), 100);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setPasswordError("Password is required"); return; }
    if (password.length < 6) { setPasswordError("Password is too short"); return; }
    setPasswordError("");
    setSubmitting(true);

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setSubmitting(false);
      setPasswordError(
        result.error === "CredentialsSignin"
          ? "Invalid email or password"
          : result.error
      );
      return;
    }

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => router.push(callbackUrl), 1200);
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
    setPasswordError("");
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
            <h1 className="text-xl font-bold text-white">
              {success ? "Welcome back!" : step === "email" ? "Sign in" : "Enter your password"}
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              {success
                ? "You're being redirected…"
                : step === "email"
                ? "Enter your email to get started"
                : `Signing in as ${email}`}
            </p>
          </div>

          <div className="px-8 py-7">

            {success && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">You're in!</h2>
                <p className="text-sm text-slate-500">Redirecting you to your dashboard…</p>
              </div>
            )}

            {!success && step === "email" && (
              <form onSubmit={handleEmailNext} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    autoFocus
                    autoComplete="email"
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    className={`w-full text-black px-4 py-3 text-sm rounded-xl border outline-none transition-all ${
                      emailError
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 font-medium">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-center text-sm text-slate-500">
                  New here?{" "}
                  <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
                    Create an account
                  </Link>
                </p>
              </form>
            )}

            {!success && step === "password" && (
              <form onSubmit={handleSignIn} noValidate className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <span className="text-sm text-slate-700 font-medium truncate">{email}</span>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex-shrink-0 ml-3 transition"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                      className={`w-full px-4 py-3 pr-11 text-sm rounded-xl border outline-none transition-all ${
                        passwordError
                          ? "border-red-400 focus:ring-2 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-500 font-medium">{passwordError}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-sm text-slate-500">Keep me signed in</span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                  ) : (
                    <>Sign in <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>

                <p className="text-center text-sm text-slate-500">
                  New here?{" "}
                  <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
                    Create an account
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by{" "}
          <span className="text-slate-500 font-medium">LankaLearn</span>
          {" "}· Your data is safe with us
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" />}>
      <SignInContent />
    </Suspense>
  );
}