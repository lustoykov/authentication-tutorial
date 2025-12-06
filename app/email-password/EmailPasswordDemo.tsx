"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { AuthDemoPage } from "../components/AuthDemoPage";

type EmailPasswordDemoProps = {
  user: User | null;
};

type Mode = "signup" | "signin";
type ResetMode = "none" | "request" | "update";

function hasRecoveryParams() {
  if (typeof window === "undefined") {
    return false;
  }
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (hashParams.get("type") === "recovery") {
    return true;
  }
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("password-reset") === "true";
}

export default function EmailPasswordDemo({ user }: EmailPasswordDemoProps) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(() =>
    hasRecoveryParams() ? "Enter a new password to finish resetting your account." : ""
  );
  const [resetMode, setResetMode] = useState<ResetMode>(() =>
    hasRecoveryParams() ? "update" : "none"
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setStatus("Signed out successfully");
    setResetMode("none");
    setNewPassword("");
    setConfirmPassword("");
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user ?? null);
        if (event === "PASSWORD_RECOVERY") {
          setResetMode("update");
          setStatus("Enter a new password to finish resetting your account.");
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!hasRecoveryParams() || typeof window === "undefined") {
      return;
    }
    setResetMode("update");
    setStatus("Enter a new password to finish resetting your account.");

    const searchParams = new URLSearchParams(window.location.search.replace(/^\?/, ""));
    if (searchParams.has("password-reset")) {
      searchParams.delete("password-reset");
    }
    window.history.replaceState(
      null,
      document.title,
      `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    );
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode == "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
        }
      });
      if (error) {
        setStatus(error.message);
      } else {
        setStatus("Check your inbox to confirm the new account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setStatus(error.message);
      } else {
        setStatus("Signed in successfully");
      }
    }
  }

  async function handlePasswordResetRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/email-password?password-reset=true`,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Password reset email sent. Check your inbox.");
    setResetMode("none");
    setMode("signin");
  }

  async function handlePasswordUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 6) {
      setStatus("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Password updated. You're now signed in.");
    setResetMode("none");
    setNewPassword("");
    setConfirmPassword("");
  }

  function startPasswordReset() {
    setResetMode("request");
    setStatus("");
    setMode("signin");
    setPassword("");
  }

  function cancelPasswordReset() {
    setResetMode("none");
    setMode("signin");
    setStatus("");
    setNewPassword("");
    setConfirmPassword("");
    setPassword("");
  }

  const isResetRequest = resetMode === "request";
  const isPasswordUpdate = resetMode === "update";
  const handleFormSubmit = isResetRequest
    ? handlePasswordResetRequest
    : isPasswordUpdate
      ? handlePasswordUpdate
      : handleSubmit;
  const primaryButtonLabel = isResetRequest
    ? "Send reset email"
    : isPasswordUpdate
      ? "Update password"
      : mode === "signup"
        ? "Create account"
        : "Sign in";
  const primaryHeading = isResetRequest
    ? "Request password reset"
    : isPasswordUpdate
      ? "Choose a new password"
      : mode === "signup"
        ? "Create an account"
        : "Welcome back";
  const primarySubheading = isResetRequest
    ? "Enter your account email and we'll send recovery instructions."
    : isPasswordUpdate
      ? "Supabase opened a recovery session—set a new password to finish."
      : null;
  const badgeLabel = isResetRequest || isPasswordUpdate ? "Recovery" : "Credentials";

  return (
    <AuthDemoPage
      title="Email + Password"
      intro="Classic credentials—users enter details, Supabase secures the rest while getSession + onAuthStateChange keep the UI live."
      steps={[
        "Toggle between sign up and sign in.",
        "Submit to watch the session card refresh instantly.",
        "Use “Forgot password?” to request a reset and follow the emailed link.",
        "Sign out to reset the listener.",
      ]}
    >
      {(!currentUser || resetMode !== "none") && (
        <>
          <form
            className="relative overflow-hidden rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-[#05130d] via-[#04100c] to-[#0c2a21] p-8 text-slate-100 shadow-[0_35px_90px_rgba(2,6,23,0.65)]"
            onSubmit={handleFormSubmit}
          >
            <div
              className="pointer-events-none absolute -left-4 -top-4 -z-10 h-20 w-28 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.25),_transparent)] blur-lg"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-10 right-2 -z-10 h-28 w-40 rounded-full bg-[linear-gradient(140deg,_rgba(45,212,191,0.32),_rgba(59,130,246,0.12))] blur-xl"
              aria-hidden="true"
            />
            <div className="absolute inset-x-8 top-6 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300/80">
              <span>Primary</span>
              <span>Flow</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                  {badgeLabel}
                </p>
                <h3 className="text-xl font-semibold text-white">
                  {primaryHeading}
                </h3>
                {primarySubheading && (
                  <p className="mt-1 text-sm text-emerald-100/80">
                    {primarySubheading}
                  </p>
                )}
              </div>
              {resetMode === "none" ? (
                <div className="flex rounded-full border border-white/10 bg-white/[0.07] p-1 text-xs font-semibold text-slate-300">
                  {(["signup", "signin"] as Mode[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={mode === option}
                      onClick={() => {
                        setMode(option);
                        setStatus("");
                      }}
                      className={`rounded-full px-4 py-1 transition ${mode === option
                        ? "bg-emerald-500/30 text-white shadow shadow-emerald-500/20"
                        : "text-slate-400"
                        }`}
                    >
                      {option === "signup" ? "Sign up" : "Sign in"}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={cancelPasswordReset}
                  className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
                >
                  Back to sign in
                </button>
              )}
            </div>
            <div className="mt-6 space-y-4">
              {resetMode !== "update" && (
                <label className="block text-sm font-medium text-slate-200">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </label>
              )}
              {resetMode === "none" && (
                <label className="block text-sm font-medium text-slate-200">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                    placeholder="At least 6 characters"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </label>
              )}
              {isPasswordUpdate && (
                <>
                  <label className="block text-sm font-medium text-slate-200">
                    New password
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      minLength={6}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-200">
                    Confirm new password
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={6}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      placeholder="Re-enter the new password"
                      autoComplete="new-password"
                    />
                  </label>
                </>
              )}
            </div>
            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-600/40"
            >
              {primaryButtonLabel}
            </button>
            {resetMode === "none" && mode === "signin" && (
              <button
                type="button"
                onClick={startPasswordReset}
                className="mt-3 w-full text-center text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                Forgot password?
              </button>
            )}
            {status && (
              <p className="mt-4 text-sm text-slate-300" role="status" aria-live="polite">
                {status}
              </p>
            )}
          </form>
        </>
      )}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-7 text-slate-200 shadow-[0_25px_70px_rgba(2,6,23,0.65)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Session</h3>
            <p className="mt-1 text-sm text-slate-400">
              {currentUser
                ? "Hydrated by getSession + onAuthStateChange."
                : "Sign in to hydrate this panel instantly."}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${currentUser
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-white/10 text-slate-400"
              }`}
          >
            {currentUser ? "Active" : "Idle"}
          </span>
        </div>
        {currentUser ? (
          <>
            <dl className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-6">
                <dt className="text-slate-400">User ID</dt>
                <dd className="font-mono text-xs">{currentUser.id}</dd>
              </div>
              <div className="flex items-center justify-between gap-6">
                <dt className="text-slate-400">Email</dt>
                <dd>{currentUser.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-6">
                <dt className="text-slate-400">Last sign in</dt>
                <dd>
                  {currentUser.last_sign_in_at
                    ? new Date(currentUser.last_sign_in_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
            <button
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-5 text-sm text-slate-400">
            Session metadata will show up here after a successful sign in.
          </div>
        )}
      </section>
    </AuthDemoPage>
  );
}
