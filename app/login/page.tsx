"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../_components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { loading, login, user } = useAuth();
  const [email, setEmail] = useState("creative911media@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await login(email, password);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.replace("/");
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090d] px-4 py-10"
      style={{
        backgroundImage: "url('/login-home-bg.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(14,165,233,0.22),transparent_34%),linear-gradient(120deg,rgba(2,6,23,0.9),rgba(2,6,23,0.34),rgba(2,6,23,0.92))]" />
      <div className="login-orbit login-orbit-one" />
      <div className="login-orbit login-orbit-two" />
      <div className="login-orbit login-orbit-three" />
      <div className="login-cube login-cube-one">
        <span />
      </div>
      <div className="login-cube login-cube-two">
        <span />
      </div>

      <section className="relative z-10 w-full max-w-md rounded-lg border border-white/15 bg-[#07090d]/70 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl md:p-7">
        <div className="flex flex-col items-center text-center">
          <Image
            className="h-40 w-80 max-w-full object-contain"
            src="/official%20adu%20logo.png"
            alt="ADU Home Builders"
            width={320}
            height={160}
            priority
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Private CRM
            </p>
            <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-zinc-400">
          Internal access for admins and sales reps. Supabase Auth is used for
          connected accounts; seeded workspace accounts can still sign in locally.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Email</span>
            <input
              className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/45 px-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Password</span>
            <div className="mt-2 flex h-12 overflow-hidden rounded-lg border border-white/10 bg-black/45 transition focus-within:border-sky-300/70">
              <input
                className="min-w-0 flex-1 bg-transparent px-3 text-base text-white outline-none placeholder:text-zinc-600"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                className="border-l border-white/10 px-4 text-sm font-semibold text-sky-200 transition hover:bg-white/[0.06] hover:text-white"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">
              {error}
            </p>
          )}

          <button
            className="h-12 w-full rounded-lg bg-sky-300 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
            type="submit"
          >
            Enter workspace
          </button>
        </form>

        <div className="mt-5 rounded-lg bg-black/20 p-3 text-xs leading-5 text-zinc-500">
          Initial admin: creative911media@gmail.com
          <br />
          Demo sales_rep: rep@adusales.local / rep123
          <br />
          Manny: manny@adusales.local / manny123
          <br />
          Jake: jake@adusales.local / jake123
        </div>
      </section>
    </main>
  );
}
