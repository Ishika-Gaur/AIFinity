import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { authApi } from "../services/api";
import { useStudentAuth } from "../context/StudentAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import logoImg from "../assets/logo.svg";

const BENEFITS = [
  "Pick up your Skill Gap right where you left off",
  "Mistake Map keeps tracking automatically",
  "One dashboard for every subject you're prepping",
];

function EyeIcon({ show }) {
  return show ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-1.418-1.418a4 4 0 11-5.656-5.656m5.656 5.656L3 3l18 18" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { applySession } = useStudentAuth();
  const { refreshUser: refreshAdminUser } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const res = await authApi.login(trimmedEmail, password);
    setLoading(false);

    if (res && res.success) {
      if (res.user?.role === "admin") {
        applySession(null);
        await refreshAdminUser();
        navigate("/admin/dashboard");
      } else {
        applySession(res.user || null);
        if (!res.user?.onboardingCompleted) {
          navigate("/onboardingpage");
        } else {
          navigate("/dashboard");
        }
      }
    } else {
      const networkUnavailable = res?.error && (
        res.error.includes("Network") ||
        res.error.includes("Failed to fetch") ||
        res.error.includes("Failed to reach server")
      );
      setError(networkUnavailable
        ? "Unable to connect to the server. Please try again."
        : res?.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[#FBF8F0]">
      {/* Left — login form */}
      <div className="flex items-start justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="sticky top-16 w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-3 group">
            <div className="flex h-12 w-28 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img src={logoImg} alt="AIFINITY Logo" className="h-full w-full object-contain" />
            </div>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-h)]" style={{ fontFamily: "var(--font-display)" }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Log in to pick up where you left off.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <form
            className="mt-6 flex flex-col gap-4"
            autoComplete="on"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-h)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-base text-[var(--color-text-h)] placeholder:text-[var(--color-text-light)] focus:border-[#1B332C] focus:outline-none focus:ring-2 focus:ring-[#1B332C]/10"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-h)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-[#1B332C] hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 pr-12 text-base text-[var(--color-text-h)] placeholder:text-[var(--color-text-light)] focus:border-[#1B332C] focus:outline-none focus:ring-2 focus:ring-[#1B332C]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1B332C] focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-2 w-full shadow-md" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-[#1B332C] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right — informative panel */}
      <div className="hidden flex-col justify-center bg-[var(--color-primary-50)] px-12 py-16 lg:flex xl:px-20 border-l border-[#2E4F42]/15">
        <div className="mx-auto max-w-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C4952A]" style={{ fontFamily: "var(--font-mono)" }}>
            WHY COME BACK
          </span>
          <h2 className="mt-3 text-3xl font-bold leading-snug text-[var(--color-text-h)]" style={{ fontFamily: "var(--font-display)" }}>
            Everything you were working on is right where you left it.
          </h2>

          <ul className="mt-8 flex flex-col gap-5">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B332C] text-xs font-bold text-[#E8C547]">
                  ✓
                </span>
                <span className="text-base leading-relaxed text-[var(--color-text-body)]">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-[var(--color-primary-100)] bg-white p-5 shadow-sm">
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)] italic">
              "I stopped guessing what to revise once I could actually see my mistakes mapped out."
            </p>
            <p className="mt-3 text-sm font-bold text-[var(--color-text-h)]">
              — an AIFINITY student
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
