"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { applyToJob, ApiError } from "@/lib/api";
import type { ApiJob } from "@/lib/api";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ApplySectionProps {
  job: ApiJob;
}

export default function ApplySection({ job }: ApplySectionProps) {
  const { user, isLoading } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="h-10 w-full rounded-full bg-border animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-sm text-muted mb-4">Sign in to apply for this job</p>
        <Link
          href="/login"
          id="sign-in-to-apply-btn"
          className="w-full inline-flex items-center justify-center rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors"
        >
          Sign in to Apply
        </Link>
        <Link
          href="/register"
          className="block mt-2 w-full rounded-full border border-border text-ink text-sm font-semibold py-3 hover:bg-pageBg transition-colors text-center"
        >
          Create Account
        </Link>
      </div>
    );
  }

  if (user.role === "EMPLOYER" || user.role === "ADMIN") {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-sm font-semibold text-ink mb-2">Employer Account</p>
        <p className="text-xs text-muted mb-4">You cannot apply to jobs. Switch to the dashboard to manage candidates.</p>
        <Link
          href="/dashboard"
          className="w-full inline-flex items-center justify-center rounded-full bg-brandGreen text-white text-sm font-semibold py-2.5 hover:bg-darkGreen transition-colors"
        >
          Manage Candidates
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-brandGreen/30 bg-brandGreen/5 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-brandGreen mx-auto mb-2" />
        <p className="text-sm font-semibold text-ink">Application submitted!</p>
        <p className="text-xs text-muted mt-1">We&apos;ll notify you about updates on your application.</p>
      </div>
    );
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await applyToJob({
        jobId: job.id,
        coverLetter: coverLetter || undefined,
        resumeUrl: resumeUrl || undefined,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit application. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h3 className="text-sm font-semibold text-ink mb-4">Apply for this position</h3>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-redAccent/10 border border-redAccent/20 px-3 py-2.5 text-sm text-redAccent">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form id="apply-form" onSubmit={handleApply} className="space-y-3">
        <div>
          <label htmlFor="apply-cover-letter" className="block text-xs font-semibold text-ink mb-1.5">
            Cover Letter <span className="text-muted font-normal">(min. 50 characters)</span>
          </label>
          <textarea
            id="apply-cover-letter"
            rows={5}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            minLength={50}
            required
            placeholder="Tell the employer why you're a great fit for this role…"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen transition-colors resize-none"
          />
        </div>

        <div>
          <label htmlFor="apply-resume-url" className="block text-xs font-semibold text-ink mb-1.5">
            Resume URL <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            id="apply-resume-url"
            type="url"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="https://drive.google.com/your-cv"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen transition-colors"
          />
        </div>

        <button
          id="apply-submit-btn"
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
