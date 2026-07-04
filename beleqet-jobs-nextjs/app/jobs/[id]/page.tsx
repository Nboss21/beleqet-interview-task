import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Building2, ArrowLeft, Tag } from "lucide-react";
import { getJobById, getJobs, type ApiJob } from "@/lib/api";
import ApplySection from "@/components/ApplySection";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCompanyName(job: Awaited<ReturnType<typeof getJobById>>): string {
  if ((job as any).company?.name) return (job as any).company.name;
  if (job.companyName) return job.companyName;
  if (job.employer?.company?.name) return job.employer.company.name;
  if (job.employer) return `${job.employer.firstName} ${job.employer.lastName}`;
  return "Company";
}

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  CONTRACT: "Contract",
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  let job;
  try {
    job = await getJobById(params.id);
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404) notFound();
    // For other errors, show error state below
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink font-semibold">Unable to load job details</p>
        <p className="text-sm text-muted mt-2">The server may be temporarily unavailable.</p>
        <Link href="/jobs" className="inline-block mt-4 text-brandGreen text-sm hover:underline">
          ← Back to all jobs
        </Link>
      </div>
    );
  }

  const company = getCompanyName(job);
  const typeLabel = typeLabels[job.type] ?? job.type;

  // Fetch related jobs (same category)
  let related: ApiJob[] = [];
  try {
    const relatedData = await getJobs({
      category: job.category?.slug ?? undefined,
      limit: 4,
    });
    related = relatedData.items.filter((j) => j.id !== job.id).slice(0, 3);
  } catch {
    // related jobs are non-critical
  }

  return (
    <div className="container-page py-10">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brandGreen mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to all jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main content */}
        <div>
          <div className="rounded-2xl border border-border bg-white p-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-pageBg text-muted shrink-0">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-snug">{job.title}</h1>
                <p className="text-muted mt-1">{company}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Posted {formatDate(job.createdAt)}
                  </span>
                  <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-2.5 py-1">
                    {typeLabel}
                  </span>
                  {job.featured && (
                    <span className="rounded-full bg-orangeAccent/10 text-orangeAccent font-semibold px-2.5 py-1">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Salary */}
            {(job.salaryMin || job.salaryMax) && (
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brandGreen">
                <span>
                  {job.salaryMin && job.salaryMax
                    ? `ETB ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`
                    : job.salaryMin
                    ? `ETB ${job.salaryMin.toLocaleString()}+`
                    : `Up to ETB ${job.salaryMax!.toLocaleString()}`}
                </span>
              </div>
            )}

            <div className="mt-7 pt-7 border-t border-border">
              <h2 className="text-sm font-semibold text-ink mb-3">Job Description</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {job.requirements && (
              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="text-sm font-semibold text-ink mb-3">Requirements</h2>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </div>
            )}

            {job.tags && job.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs font-medium text-muted bg-pageBg border border-border rounded-full px-3 py-1"
                  >
                    <Tag className="h-3 w-3" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {job.deadline && (
              <p className="mt-4 text-xs text-muted">
                Application deadline: <span className="font-semibold text-ink">{formatDate(job.deadline)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Apply section — client component */}
          <ApplySection job={job} />

          {/* Related jobs */}
          {related.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/jobs/${r.id}`}
                    className="block rounded-lg hover:bg-pageBg p-2 -mx-2 transition-colors"
                  >
                    <p className="text-sm font-semibold text-ink line-clamp-1">{r.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {r.companyName ?? "Company"} · {r.location}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
