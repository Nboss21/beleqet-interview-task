import Link from "next/link";
import { getJobs, type ApiJob } from "@/lib/api";
import JobCard from "./JobCard";
import { Briefcase } from "lucide-react";

export default async function FeaturedJobs() {
  let featuredJobs: ApiJob[] = [];
  let fetchError = false;

  try {
    const data = await getJobs({ limit: 5, page: 1 });
    // Show featured jobs if any, otherwise show latest 5
    featuredJobs = data.items.filter((j) => j.featured);
    if (featuredJobs.length === 0) {
      featuredJobs = data.items.slice(0, 5);
    }
  } catch {
    fetchError = true;
  }

  return (
    <section className="bg-white border-y border-border">
      <div className="container-page py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-sectionH2">Featured Jobs</h2>
            <p className="text-muted text-sm mt-1">Fresh opportunities from companies hiring right now.</p>
          </div>
          <Link href="/jobs" className="hidden sm:inline-block text-sm font-semibold text-brandGreen hover:underline shrink-0">
            View all jobs →
          </Link>
        </div>

        {fetchError ? (
          <div className="rounded-xl border border-dashed border-border bg-pageBg p-10 text-center">
            <Briefcase className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-ink font-semibold">Unable to load jobs right now</p>
            <p className="text-sm text-muted mt-1">The server may be temporarily unavailable. Please try again later.</p>
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-pageBg p-10 text-center">
            <Briefcase className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-ink font-semibold">No jobs posted yet</p>
            <p className="text-sm text-muted mt-1">Be the first to post a job and reach thousands of candidates.</p>
            <Link href="/post-job" className="inline-block mt-4 rounded-full bg-brandGreen px-5 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors">
              Post a Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
