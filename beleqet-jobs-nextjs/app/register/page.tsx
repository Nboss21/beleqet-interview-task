"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError, type UserRole } from "@/lib/api";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "JOB_SEEKER", label: "Job Seeker" },
  { value: "EMPLOYER", label: "Employer" },
  { value: "FREELANCER", label: "Freelancer" },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("JOB_SEEKER");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({ email, password, firstName, lastName, role });
      // Auto-login after registration
      try {
        await login(email, password);
        router.push("/");
      } catch {
        // If auto-login fails, redirect to login page with success message
        router.push("/login?registered=1");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-pageBg px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-ink">Create your account</h1>
          <p className="text-sm text-muted mt-2">Join thousands of job seekers and employers on Beleqet</p>
        </div>

        <form
          id="register-form"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-white p-7 space-y-4 shadow-card"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-redAccent/10 border border-redAccent/20 px-4 py-3 text-sm text-redAccent"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-firstName" className="block text-xs font-semibold text-ink mb-1.5">
                First Name
              </label>
              <input
                id="reg-firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Henok"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen transition-colors"
              />
            </div>
            <div>
              <label htmlFor="reg-lastName" className="block text-xs font-semibold text-ink mb-1.5">
                Last Name
              </label>
              <input
                id="reg-lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mekonnen"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-ink mb-1.5">
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen transition-colors"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold text-ink mb-1.5">
              Password <span className="text-muted font-normal">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border px-3 py-2.5 pr-10 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reg-role" className="block text-xs font-semibold text-ink mb-1.5">
              I am a…
            </label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink outline-none focus:border-brandGreen transition-colors bg-white"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brandGreen font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
