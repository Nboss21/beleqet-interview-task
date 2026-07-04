"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createJob, getJobCategories, ApiError, type ApiJobCategory, type JobType, getCompany, createCompany } from "@/lib/api";
import { Loader2, AlertCircle, Lock, Building } from "lucide-react";
import Link from "next/link";

const jobTypeOptions: { value: JobType; label: string }[] = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "CONTRACT", label: "Contract" },
];

export default function PostJobPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<ApiJobCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Company profile validation
  const [company, setCompany] = useState<any | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<JobType>("FULL_TIME");
  const [categoryId, setCategoryId] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [tags, setTags] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getJobCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));

    if (user && (user.role === "EMPLOYER" || user.role === "ADMIN")) {
      getCompany()
        .then((comp) => {
          setCompany(comp);
        })
        .catch(() => {})
        .finally(() => setCompanyLoading(false));
    } else {
      setCompanyLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="container-page py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page py-24 max-w-md text-center">
        <Lock className="h-10 w-10 text-muted mx-auto mb-4" />
        <h1 className="text-xl font-extrabold text-ink">Sign in required</h1>
        <p className="text-muted text-sm mt-2">You need to be signed in as an Employer to post a job.</p>
        <Link
          href="/login"
          className="inline-block mt-6 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Sign In
        </Link>
        <Link href="/register" className="block mt-3 text-sm text-brandGreen hover:underline">
          Create an Employer account
        </Link>
      </div>
    );
  }

  if (user.role !== "EMPLOYER") {
    return (
      <div className="container-page py-24 max-w-md text-center">
        <Lock className="h-10 w-10 text-muted mx-auto mb-4" />
        <h1 className="text-xl font-extrabold text-ink">Employer account required</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          Only Employer accounts can post jobs. You are currently signed in as a{" "}
          <span className="font-semibold">{user.role.replace("_", " ").toLowerCase()}</span>.
        </p>
        <Link
          href="/register"
          className="inline-block mt-6 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Create an Employer Account
        </Link>
      </div>
    );
  }

  if (companyLoading) {
    return (
      <div className="container-page py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container-page py-24 max-w-md text-center">
        <Building className="h-12 w-12 text-brandGreen/80 mx-auto mb-4 animate-bounce" />
        <h1 className="text-2xl font-black text-ink">Company profile required</h1>
        <p className="text-muted text-sm mt-3 leading-relaxed">
          Before you can publish job listings, you must set up your company profile details (name, website, industry, etc.).
        </p>
        <Link
          href="/profile?tab=company"
          className="inline-block mt-6 rounded-full bg-brandGreen px-6 py-3 text-sm font-bold text-white hover:bg-darkGreen transition-colors shadow-lg shadow-brandGreen/20"
        >
          Complete Company Profile
        </Link>
        <Link href="/dashboard" className="block mt-4 text-xs text-muted hover:underline font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const newJob = await createJob({
        title,
        description,
        requirements: requirements || undefined,
        location,
        type: jobType,
        categoryId,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      setSuccess(true);
      // Redirect to the new job's detail page
      setTimeout(() => router.push(`/jobs/${newJob.id}`), 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create job. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-16 max-w-2xl">
      <h1 className="text-pageH1">Post a Job</h1>
      <p className="text-muted mt-4 leading-relaxed">
        Reach thousands of verified job seekers across Ethiopia. Fill out the form below to publish your listing.
      </p>

      {success && (
        <div className="mt-6 rounded-xl bg-brandGreen/10 border border-brandGreen/30 px-5 py-4 text-sm text-brandGreen font-medium">
          ✅ Job posted successfully! Redirecting to your listing…
        </div>
      )}

      <form
        id="post-job-form"
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-border bg-white p-7 space-y-5"
      >
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-redAccent/10 border border-redAccent/20 px-4 py-3 text-sm text-redAccent">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="job-title" className="block text-xs font-semibold text-ink mb-1.5">
            Job Title <span className="text-redAccent">*</span>
          </label>
          <input
            id="job-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-location" className="block text-xs font-semibold text-ink mb-1.5">
              Location <span className="text-redAccent">*</span>
            </label>
            <input
              id="job-location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Addis Ababa"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
          <div>
            <label htmlFor="job-type" className="block text-xs font-semibold text-ink mb-1.5">
              Job Type <span className="text-redAccent">*</span>
            </label>
            <select
              id="job-type"
              required
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors bg-white"
            >
              {jobTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="job-category" className="block text-xs font-semibold text-ink mb-1.5">
            Category <span className="text-redAccent">*</span>
          </label>
          {categoriesLoading ? (
            <div className="mt-1 h-10 w-full rounded-lg bg-border animate-pulse" />
          ) : categories.length === 0 ? (
            <p className="text-xs text-muted mt-1">
              No categories available yet.{" "}
              <span className="text-brandGreen">Please add categories via the backend.</span>
            </p>
          ) : (
            <select
              id="job-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors bg-white"
            >
              <option value="">Select a category…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="job-description" className="block text-xs font-semibold text-ink mb-1.5">
            Job Description <span className="text-redAccent">*</span>
          </label>
          <textarea
            id="job-description"
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, and what you're looking for…"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors resize-none"
          />
        </div>

        <div>
          <label htmlFor="job-requirements" className="block text-xs font-semibold text-ink mb-1.5">
            Requirements <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="job-requirements"
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="List required qualifications, experience, skills…"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-salary-min" className="block text-xs font-semibold text-ink mb-1.5">
              Min Salary (ETB) <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id="job-salary-min"
              type="number"
              min={0}
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="e.g. 25000"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
          <div>
            <label htmlFor="job-salary-max" className="block text-xs font-semibold text-ink mb-1.5">
              Max Salary (ETB) <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id="job-salary-max"
              type="number"
              min={0}
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="e.g. 45000"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="job-tags" className="block text-xs font-semibold text-ink mb-1.5">
            Tags <span className="text-muted font-normal">(comma-separated, optional)</span>
          </label>
          <input
            id="job-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. React, Node.js, PostgreSQL"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>

        <button
          id="post-job-submit-btn"
          type="submit"
          disabled={submitting || success || (categories.length === 0 && !categoriesLoading)}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Publishing…" : success ? "Published!" : "Publish Listing"}
        </button>
      </form>
    </div>
  );
}
