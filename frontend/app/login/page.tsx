"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { validateLoginForm } from "@/features/auth/validation";
import { getStoredAuthNotice } from "@/features/auth/tokenStorage";
import ErrorAlert from "@/components/ErrorAlert";
import InfoAlert from "@/components/InfoAlert";
import Spinner from "@/components/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isReady, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedNotice = getStoredAuthNotice();

    if (storedNotice) {
      setNotice(storedNotice);
    }
  }, []);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isReady, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const validationError = validateLoginForm(email, password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            Control Center
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Login</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading && <Spinner />}
            <span>{loading ? "Signing in..." : "Sign in"}</span>
          </button>

          <ErrorAlert message={error} />
          <InfoAlert message={notice} />
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account yet?{" "}
          <Link className="font-semibold text-blue-600" href="/register">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
