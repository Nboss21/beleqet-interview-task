import Link from "next/link";
import { MapPin, Bookmark, Building2 } from "lucide-react";
import type { ApiJob } from "@/lib/api";

// Map backend enum values to human-readable labels and styles
const typeConfig: Record<string, { label: string; style: string }> = {
  FULL_TIME: { label: "Full Time", style: "bg-brandGreen/10 text-brandGreen" },
  PART_TIME: { label: "Part Time", style: "bg-purpleAccent/10 text-purpleAccent" },
  REMOTE: { label: "Remote", style: "bg-cyanAccent/10 text-cyanAccent" },
  HYBRID: { label: "Hybrid", style: "bg-orangeAccent/10 text-orangeAccent" },
  CONTRACT: { label: "Contract", style: "bg-redAccent/10 text-redAccent" },
  // Legacy friendly labels (in case mockData types are ever passed)
  "Full Time": { label: "Full Time", style: "bg-brandGreen/10 text-brandGreen" },
  "Part Time": { label: "Part Time", style: "bg-purpleAccent/10 text-purpleAccent" },
  "On-site": { label: "On-site", style: "bg-muted/10 text-muted" },
};

function formatPostedDate(createdAt: string): string {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function getCompanyName(job: ApiJob): string {
  // Real backend: includes company object directly
  if (job.company?.name) return job.company.name;
  // Inline override on the job row
  if (job.companyName) return job.companyName;
  // Legacy employer→company relation
  if (job.employer?.company?.name) return job.employer.company.name;
  if (job.employer) return `${job.employer.firstName} ${job.employer.lastName}`;
  return "Company";
}

export default function JobCard({ job }: { job: ApiJob }) {
  const config = typeConfig[job.type] ?? { label: job.type, style: "bg-muted/10 text-muted" };
  const postedAgo = formatPostedDate(job.createdAt);
  const company = getCompanyName(job);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col rounded-xl border border-border bg-white p-5 hover:border-brandGreen hover:shadow-card transition-all"
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pageBg text-muted">
          <Building2 className="h-5 w-5" />
        </span>
        <Bookmark className="h-4 w-4 text-muted/50 group-hover:text-brandGreen transition-colors" />
      </div>

      <h3 className="text-cardH3 mt-3 text-ink leading-snug line-clamp-2">{job.title}</h3>
      <p className="text-sm text-muted mt-1">{company}</p>

      <div className="flex items-center gap-1 text-xs text-muted mt-2">
        <MapPin className="h-3.5 w-3.5" />
        {job.location}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${config.style}`}>
          {config.label}
        </span>
        <span className="text-[11px] text-muted">{postedAgo}</span>
      </div>
    </Link>
  );
}
