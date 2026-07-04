"use client";

import { useState, useEffect, useTransition } from "react";
import { getFreelanceJobs, getFreelanceCategories, type ApiFreelanceJob, type ApiJobCategory } from "@/lib/api";
import { Search, MapPin, SlidersHorizontal, Loader2, AlertCircle, DollarSign, Calendar, Tag, Briefcase, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function FreelancePage() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [gigs, setGigs] = useState<ApiFreelanceJob[]>([]);
  const [categories, setCategories] = useState<ApiJobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, catsData] = await Promise.all([
        getFreelanceJobs(),
        getFreelanceCategories().catch(() => []), // fallback to empty if endpoint not compiled yet
      ]);
      setGigs(jobsData.items);
      setCategories(catsData);
    } catch (err) {
      setError("Failed to load freelance gigs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await getFreelanceJobs({ q: query, category: category || undefined });
      setGigs(data.items);
    } catch {
      setError("Failed to filter gigs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCategoryChange(slug: string) {
    setCategory(slug);
    setLoading(true);
    try {
      const data = await getFreelanceJobs({ q: query, category: slug || undefined });
      setGigs(data.items);
    } catch {
      setError("Failed to filter gigs by category.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Freelance Gig Marketplace</h1>
          <p className="text-muted text-sm mt-1">Browse open contract work, bid on milestones, and secure payments via BeleqetSafe Escrow.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-pageBg transition-colors"
          >
            My Wallet
          </Link>
          <Link
            href="/freelance/post"
            className="inline-flex items-center gap-2 rounded-full bg-brandGreen text-white text-sm font-semibold px-5 py-2.5 hover:bg-darkGreen transition-colors"
          >
            <PlusCircle className="h-4.5 w-4.5" /> Post a Gig
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-border p-2 flex flex-col sm:flex-row gap-2 mb-8">
        <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-xl">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gigs by keyword or skill..."
            className="w-full text-sm text-ink placeholder:text-muted outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brandGreen text-white text-sm font-semibold px-6 py-2.5 hover:bg-darkGreen transition-colors"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar categories */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Gig Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCategoryChange("")}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  category === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Gigs
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    category === cat.slug ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  <span className="truncate pr-2">{cat.label}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pageBg border border-border text-muted">
                    {cat._count?.jobs ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Gigs List */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-dashed border-redAccent/30 bg-redAccent/5 p-10 text-center">
              <AlertCircle className="h-8 w-8 text-redAccent mx-auto mb-3" />
              <p className="text-ink font-semibold">{error}</p>
            </div>
          ) : gigs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
              <Briefcase className="h-8 w-8 text-muted mx-auto mb-3" />
              <p className="text-ink font-semibold">No freelance gigs found</p>
              <p className="text-sm text-muted mt-1">Be the first to post a gig and hire top freelancers.</p>
              <Link
                href="/freelance/post"
                className="inline-block mt-4 rounded-full bg-brandGreen px-5 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
              >
                Post a Gig
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {gigs.map((gig) => (
                <Link
                  key={gig.id}
                  href={`/freelance/${gig.id}`}
                  className="block p-6 rounded-xl border border-border bg-white hover:border-brandGreen hover:shadow-card transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-ink hover:text-brandGreen transition-colors line-clamp-1">{gig.title}</h2>
                      <p className="text-xs text-muted mt-1 capitalize">Posted by {gig.client?.firstName || "Client"} {gig.client?.lastName || ""}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 text-sm font-extrabold text-brandGreen bg-brandGreen/10 px-3 py-1 rounded-lg">
                      <DollarSign className="h-3.5 w-3.5 shrink-0" />
                      {gig.budgetMin.toLocaleString()} - {gig.budgetMax.toLocaleString()} ETB
                    </span>
                  </div>

                  <p className="text-sm text-muted mt-3 line-clamp-2 leading-relaxed">{gig.description}</p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {gig.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-pageBg text-muted px-2.5 py-1 rounded-full border border-border">
                        <Tag className="h-3 w-3" /> {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Deadline: {gig.deadlineDays} days
                    </span>
                    <span className="font-bold text-brandGreen capitalize bg-brandGreen/5 px-2.5 py-1 rounded border border-brandGreen/10">
                      {gig.pricingType.toLowerCase()} Budget
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
