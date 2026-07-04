"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, MapPin, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from "lucide-react";
import type { ApiJob, ApiJobCategory, PaginatedJobs } from "@/lib/api";
import JobCard from "@/components/JobCard";

const jobTypes = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "CONTRACT", label: "Contract" },
];

interface JobsListingProps {
  initialData: PaginatedJobs | null;
  categories: ApiJobCategory[];
  fetchError?: boolean;
}

export default function JobsListing({ initialData, categories, fetchError }: JobsListingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Sync local form state with URL search params (so category clicks from sidebar update the inputs too)
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");

  // Keep local input state in sync with URL changes (e.g. when clicking a category button)
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setLocation(searchParams.get("location") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setType(searchParams.get("type") ?? "");
  }, [searchParams]);

  const currentPage = Number(searchParams.get("page") ?? "1");

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      // Reset to page 1 when filters change (unless we're explicitly paginating)
      if (!updates.page) params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: query, location });
  }

  function handleClear() {
    setQuery("");
    setLocation("");
    setCategory("");
    setType("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters = !!(searchParams.get("q") || searchParams.get("location") || searchParams.get("category") || searchParams.get("type"));

  const data = initialData;
  const jobs: ApiJob[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-pageH1">Search verified jobs from trusted employers.</h1>
          <p className="text-muted text-sm mt-2">
            {fetchError
              ? "Unable to load jobs — check your connection or try again later."
              : `${total.toLocaleString()} job${total !== 1 ? "s" : ""} found`}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-redAccent hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl border border-border p-2 flex flex-col sm:flex-row gap-2 mb-8"
      >
        <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-xl">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            id="jobs-search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, keyword or company"
            className="w-full text-sm text-ink placeholder:text-muted outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-muted hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="hidden sm:block w-px bg-border my-1" />
        <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-xl">
          <MapPin className="h-4 w-4 text-muted shrink-0" />
          <input
            id="jobs-search-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Addis Ababa)"
            className="w-full text-sm text-ink placeholder:text-muted outline-none"
          />
          {location && (
            <button type="button" onClick={() => setLocation("")} className="text-muted hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          id="jobs-search-btn"
          type="submit"
          className="rounded-xl bg-brandGreen text-white text-sm font-semibold px-5 py-2.5 hover:bg-darkGreen transition-colors"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar filters */}
        <aside className="space-y-6">
          {/* Category filter */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Category
            </h3>
            <div className="space-y-1">
              <button
                id="filter-category-all"
                onClick={() => { setCategory(""); updateParams({ category: "" }); }}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  category === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  id={`filter-category-${cat.id}`}
                  onClick={() => { setCategory(cat.slug); updateParams({ category: cat.slug }); }}
                  className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    category === cat.slug ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  <span className="truncate pr-2">{cat.label}</span>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                    (cat._count?.jobs ?? 0) > 0
                      ? "bg-brandGreen/10 text-brandGreen"
                      : "bg-border text-muted"
                  }`}>
                    {cat._count?.jobs ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Job type filter */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Job Type</h3>
            <div className="space-y-1">
              <button
                id="filter-type-all"
                onClick={() => { setType(""); updateParams({ type: "" }); }}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  type === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Types
              </button>
              {jobTypes.map((t) => (
                <button
                  key={t.value}
                  id={`filter-type-${t.value}`}
                  onClick={() => { setType(t.value); updateParams({ type: t.value }); }}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    type === t.value ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Jobs grid */}
        <div>
          {isPending && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
            </div>
          )}

          {!isPending && fetchError && (
            <div className="rounded-xl border border-dashed border-redAccent/30 bg-redAccent/5 p-12 text-center">
              <AlertCircle className="h-8 w-8 text-redAccent mx-auto mb-3" />
              <p className="text-ink font-semibold">Could not connect to the server</p>
              <p className="text-sm text-muted mt-1">
                Please check your connection or wait a moment and refresh the page.
              </p>
            </div>
          )}

          {!isPending && !fetchError && jobs.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
              <Search className="h-8 w-8 text-muted mx-auto mb-3" />
              <p className="text-ink font-semibold">No jobs match your filters</p>
              <p className="text-sm text-muted mt-1">Try adjusting your search or clearing filters.</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClear}
                  className="mt-4 inline-block rounded-full border border-border px-5 py-2 text-sm font-semibold text-ink hover:bg-pageBg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {!isPending && !fetchError && jobs.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    id="pagination-prev"
                    disabled={currentPage <= 1}
                    onClick={() => updateParams({ page: String(currentPage - 1) })}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-pageBg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>

                  <span className="text-sm text-muted px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    id="pagination-next"
                    disabled={currentPage >= totalPages}
                    onClick={() => updateParams({ page: String(currentPage + 1) })}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-pageBg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
