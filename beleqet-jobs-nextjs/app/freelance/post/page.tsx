"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createFreelanceJob, getFreelanceCategories, ApiError, type ApiJobCategory } from "@/lib/api";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";

export default function PostFreelanceGigPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<ApiJobCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Form inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [pricingType, setPricingType] = useState<"FIXED" | "HOURLY">("FIXED");
  const [deadlineDays, setDeadlineDays] = useState("14");
  const [skills, setSkills] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("ENTRY");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getFreelanceCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));
  }, []);

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
        <p className="text-muted text-sm mt-2">You need to be signed in to post a freelance gig.</p>
        <Link
          href="/login"
          className="inline-block mt-6 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const gig = await createFreelanceJob({
        title,
        description,
        categoryId,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        pricingType,
        deadlineDays: Number(deadlineDays),
        skills: skillsArray,
        locationPreference: locationPreference || undefined,
        experienceLevel: experienceLevel || undefined,
      });

      setSuccess(true);
      setTimeout(() => router.push(`/freelance/${gig.id}`), 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to post freelance gig. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-16 max-w-2xl">
      <h1 className="text-3xl font-extrabold text-ink">Post a Freelance Gig</h1>
      <p className="text-muted mt-2 leading-relaxed">
        Describe your project requirements, set budget thresholds, and select the target skills to receive bids.
      </p>

      {success && (
        <div className="mt-6 rounded-xl bg-brandGreen/10 border border-brandGreen/30 px-5 py-4 text-sm text-brandGreen font-medium">
          ✅ Gig posted successfully! Redirecting to gig details…
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-border bg-white p-7 space-y-5 shadow-card"
      >
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-redAccent/10 border border-redAccent/20 px-4 py-3 text-sm text-redAccent">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Project Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design Landing Page for E-Commerce App"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Gig Category *</label>
            {categoriesLoading ? (
              <div className="h-10 w-full rounded-lg bg-border animate-pulse" />
            ) : (
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Pricing Type *</label>
            <select
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value as any)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors bg-white"
            >
              <option value="FIXED">Fixed Price Budget</option>
              <option value="HOURLY">Hourly Billing</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Min Budget (ETB) *</label>
            <input
              type="number"
              required
              min={1}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Max Budget (ETB) *</label>
            <input
              type="number"
              required
              min={1}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Deadline (Days) *</label>
            <input
              type="number"
              required
              min={1}
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors bg-white"
            >
              <option value="ENTRY">Entry Level</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="EXPERT">Expert / Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Location Preference</label>
            <input
              type="text"
              value={locationPreference}
              onChange={(e) => setLocationPreference(e.target.value)}
              placeholder="e.g. Addis Ababa / Remote"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Project Description *</label>
          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline project scope, deliverables, timeline requirements..."
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Skills Required (comma-separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Figma, React, TailwindCSS"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || success}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Publishing Gig..." : "Publish Freelance Gig"}
        </button>
      </form>
    </div>
  );
}
