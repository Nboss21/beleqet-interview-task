import { Suspense } from "react";
import JobsListing from "@/components/JobsListing";
import { getJobs, getJobCategories, type PaginatedJobs, type ApiJobCategory } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find Jobs | Beleqet Jobs",
};

interface JobsPageProps {
  searchParams: {
    q?: string;
    category?: string;
    location?: string;
    type?: string;
    page?: string;
  };
}

async function JobsContent({ searchParams }: JobsPageProps) {
  let data: PaginatedJobs | null = null;
  let categories: ApiJobCategory[] = [];
  let fetchError = false;

  const page = Number(searchParams.page ?? "1");
  const limit = 12;

  try {
    [data, categories] = await Promise.all([
      getJobs({
        q: searchParams.q,
        category: searchParams.category,
        location: searchParams.location,
        type: searchParams.type,
        page,
        limit,
      }),
      getJobCategories(),
    ]);
  } catch {
    fetchError = true;
  }

  return (
    <JobsListing
      initialData={data}
      categories={categories}
      fetchError={fetchError}
    />
  );
}

export default function JobsPage({ searchParams }: JobsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-20 text-center text-muted">Loading jobs…</div>
      }
    >
      <JobsContent searchParams={searchParams} />
    </Suspense>
  );
}
