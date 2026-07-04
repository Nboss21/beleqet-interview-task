"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  getEmployerJobs,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  deleteJob,
  getMyBids,
  ApiError,
  type ApiJob,
  type ApiApplication,
  type ApiBid,
} from "@/lib/api";
import {
  Loader2,
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Lock,
  Building,
  UserCheck,
  AlertCircle,
  Trash2,
  Eye,
  Gavel,
  Clock,
  CheckCircle2,
  XCircle as XCircleIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type EmployerTab = "my_jobs";
type SeekerTab = "my_applications";
type FreelancerTab = "my_bids";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Employer state
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ApiJob | null>(null);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Job seeker state
  const [myApps, setMyApps] = useState<ApiApplication[]>([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);

  // Freelancer state
  const [myBids, setMyBids] = useState<ApiBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    if (user.role === "EMPLOYER" || user.role === "ADMIN") {
      loadEmployerData();
    } else if (user.role === "FREELANCER") {
      loadFreelancerData();
    } else {
      loadJobSeekerData();
    }
  }, [user, authLoading]);

  // Load applications when selected job changes
  useEffect(() => {
    if (selectedJob) {
      setAppsLoading(true);
      setError(null);
      getJobApplications(selectedJob.id)
        .then(setApplications)
        .catch((err) => {
          if (err instanceof ApiError) setError(err.message);
          else setError("Failed to load applications for this job.");
        })
        .finally(() => setAppsLoading(false));
    } else {
      setApplications([]);
    }
  }, [selectedJob]);

  async function loadEmployerData() {
    setJobsLoading(true);
    setError(null);
    try {
      const data = await getEmployerJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load your posted jobs.");
    } finally {
      setJobsLoading(false);
    }
  }

  async function loadJobSeekerData() {
    setMyAppsLoading(true);
    setError(null);
    try {
      const data = await getMyApplications();
      setMyApps(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load your applications.");
    } finally {
      setMyAppsLoading(false);
    }
  }

  async function loadFreelancerData() {
    setBidsLoading(true);
    setError(null);
    try {
      const data = await getMyBids();
      setMyBids(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load your bids.");
    } finally {
      setBidsLoading(false);
    }
  }

  async function handleStatusChange(appId: string, status: "SHORTLISTED" | "REJECTED" | "HIRED") {
    setActionLoading(appId);
    setError(null);
    try {
      const updated = await updateApplicationStatus(appId, status);
      setApplications((prev) => prev.map((app) => (app.id === appId ? updated : app)));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to update candidate status.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteJob(jobId: string) {
    if (!window.confirm("Are you sure you want to delete this job listing? This action cannot be undone.")) return;
    setDeleteLoading(jobId);
    setError(null);
    try {
      await deleteJob(jobId);
      const remaining = jobs.filter((j) => j.id !== jobId);
      setJobs(remaining);
      if (selectedJob?.id === jobId) {
        setSelectedJob(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to delete job listing.");
    } finally {
      setDeleteLoading(null);
    }
  }

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
        <p className="text-muted text-sm mt-2">You need to sign in to access your personal dashboard.</p>
        <Link
          href="/login"
          className="inline-block mt-6 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const isEmployer = user.role === "EMPLOYER" || user.role === "ADMIN";
  const isFreelancer = user.role === "FREELANCER";
  const isJobSeeker = user.role === "JOB_SEEKER";

  // ──────────────────────────────────────────────────────────────
  // BID STATUS styles helper
  // ──────────────────────────────────────────────────────────────
  const bidStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    ACCEPTED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  const appStatusColors: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
    SCREENING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    SHORTLISTED: "bg-purple-100 text-purple-700 border-purple-200",
    HIRED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="container-page py-12">
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Welcome back, <span className="font-semibold text-ink">{user.firstName} {user.lastName}</span> ·{" "}
            <span className="capitalize">{user.role.toLowerCase().replace("_", " ")}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {isEmployer && (
            <Link
              href="/post-job"
              className="inline-flex items-center justify-center rounded-full bg-brandGreen text-white text-sm font-semibold px-5 py-2.5 hover:bg-darkGreen transition-colors"
            >
              Post a Job
            </Link>
          )}
          {isFreelancer && (
            <Link
              href="/freelance"
              className="inline-flex items-center justify-center rounded-full bg-brandGreen text-white text-sm font-semibold px-5 py-2.5 hover:bg-darkGreen transition-colors"
            >
              Browse Gigs
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg bg-redAccent/10 border border-redAccent/20 px-4 py-3 text-sm text-redAccent">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="mt-8">
        {/* ═══════════════════════════════════════════════════════
            EMPLOYER VIEW: My Posted Jobs + Applicants Panel
        ════════════════════════════════════════════════════════ */}
        {isEmployer && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            {/* Jobs sidebar */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Your Job Listings</h2>
              {jobsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 w-full rounded-xl bg-border animate-pulse" />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center">
                  <Briefcase className="h-6 w-6 text-muted mx-auto mb-2" />
                  <p className="text-sm font-semibold text-ink">No jobs posted yet</p>
                  <Link href="/post-job" className="inline-block mt-3 text-xs text-brandGreen font-medium hover:underline">
                    Post your first job →
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col ${
                      selectedJob?.id === job.id
                        ? "border-brandGreen bg-brandGreen/5 shadow-card"
                        : "border-border bg-white hover:border-brandGreen/50"
                    }`}
                  >
                    <button className="text-left" onClick={() => setSelectedJob(job)}>
                      <span className="font-semibold text-sm text-ink line-clamp-1 block">{job.title}</span>
                      <span className="text-xs text-muted mt-1 capitalize block">{job.type.replace("_", " ").toLowerCase()}</span>
                      <span className="text-[10px] text-muted mt-2 block">
                        Posted on {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-muted hover:text-brandGreen transition-colors py-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={deleteLoading === job.id}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-redAccent hover:bg-red-50 transition-colors py-1 rounded disabled:opacity-50"
                      >
                        {deleteLoading === job.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Applications panel */}
            <div className="rounded-2xl border border-border bg-white p-6 min-h-[400px]">
              {selectedJob ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-6">
                    <div>
                      <h2 className="text-base font-bold text-ink">
                        Applications for <span className="text-brandGreen">{selectedJob.title}</span>
                      </h2>
                      <p className="text-xs text-muted mt-0.5">{selectedJob.location}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 px-3 py-1 bg-pageBg text-xs font-semibold text-muted rounded-full border border-border">
                      {applications.length} applied
                    </div>
                  </div>

                  {appsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-7 w-7 text-brandGreen animate-spin" />
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-16">
                      <Users className="h-8 w-8 text-muted mx-auto mb-3" />
                      <p className="text-sm font-semibold text-ink">No applications received yet</p>
                      <p className="text-xs text-muted mt-1">When job seekers submit their application, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app: any) => {
                        const applicantName = app.user
                          ? `${app.user.firstName} ${app.user.lastName}`
                          : "Applicant";
                        const isPending = actionLoading === app.id;
                        const statusClass = appStatusColors[app.status] ?? "bg-gray-100 text-gray-700 border-gray-200";

                        return (
                          <div
                            key={app.id}
                            className="p-5 rounded-xl border border-border hover:shadow-card transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pageBg text-muted">
                                  <Users className="h-4 w-4" />
                                </span>
                                <div>
                                  <h4 className="font-semibold text-sm text-ink">{applicantName}</h4>
                                  <p className="text-xs text-muted">{app.user?.email}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                                  {app.status}
                                </span>
                              </div>

                              {app.coverLetter && (
                                <div className="mt-3 bg-pageBg/60 p-3.5 rounded-lg border border-border/50">
                                  <p className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1">
                                    <FileText className="h-3.5 w-3.5 text-muted" /> Cover Letter
                                  </p>
                                  <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
                                </div>
                              )}

                              {app.resumeUrl && (
                                <a
                                  href={app.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-brandGreen font-medium hover:underline mt-2 mr-4"
                                >
                                  View Resume/CV <ExternalLink className="h-3 w-3" />
                                </a>
                              )}

                              {app.score && (
                                <div className="mt-4 bg-brandGreen/5 border border-brandGreen/20 rounded-xl p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles className="h-4 w-4 text-brandGreen animate-pulse" />
                                      <span className="text-xs font-bold text-ink">BeleqetAI Screening Score</span>
                                    </div>
                                    <span className="text-xs font-black text-brandGreen bg-brandGreen/10 border border-brandGreen/25 rounded px-2 py-0.5">
                                      {Math.round(app.score.overallScore)}/100
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                                    <div className="bg-white border border-border p-2 rounded-lg text-center">
                                      <span className="text-muted block">Skills</span>
                                      <span className="font-extrabold text-ink block mt-0.5">{Math.round(app.score.skillScore)}%</span>
                                    </div>
                                    <div className="bg-white border border-border p-2 rounded-lg text-center">
                                      <span className="text-muted block">Experience</span>
                                      <span className="font-extrabold text-ink block mt-0.5">{Math.round(app.score.experienceScore)}%</span>
                                    </div>
                                    <div className="bg-white border border-border p-2 rounded-lg text-center">
                                      <span className="text-muted block">Culture Fit</span>
                                      <span className="font-extrabold text-ink block mt-0.5">{Math.round(app.score.cultureFitScore || 0)}%</span>
                                    </div>
                                  </div>

                                  {app.score.reasoning && (
                                    <p className="text-[11px] text-muted italic leading-relaxed pt-2 border-t border-brandGreen/10">
                                      &ldquo;{app.score.reasoning}&rdquo;
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-start">
                              <button
                                disabled={isPending || app.status === "SHORTLISTED"}
                                onClick={() => handleStatusChange(app.id, "SHORTLISTED")}
                                className="flex-1 md:w-32 rounded-full border border-purple-200 text-purple-700 text-xs font-semibold py-1.5 px-3 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                                Shortlist
                              </button>
                              <button
                                disabled={isPending || app.status === "HIRED"}
                                onClick={() => handleStatusChange(app.id, "HIRED")}
                                className="flex-1 md:w-32 rounded-full border border-green-200 text-green-700 text-xs font-semibold py-1.5 px-3 hover:bg-green-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                Hire
                              </button>
                              <button
                                disabled={isPending || app.status === "REJECTED"}
                                onClick={() => handleStatusChange(app.id, "REJECTED")}
                                className="flex-1 md:w-32 rounded-full border border-red-200 text-red-600 text-xs font-semibold py-1.5 px-3 hover:bg-red-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted py-20">
                  <div>
                    <Briefcase className="h-8 w-8 text-muted mx-auto mb-2" />
                    <p className="text-sm">Select a job on the left to manage applicants</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            FREELANCER VIEW: My Submitted Bids + Contracts
        ════════════════════════════════════════════════════════ */}
        {isFreelancer && (
          <div>
            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Bids</p>
                <p className="text-2xl font-black text-ink mt-1">{myBids.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Accepted</p>
                <p className="text-2xl font-black text-brandGreen mt-1">{myBids.filter((b) => b.status === "ACCEPTED").length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-border p-5 shadow-card col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{myBids.filter((b) => b.status === "PENDING").length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 min-h-[400px]">
              <h2 className="text-base font-bold text-ink mb-6 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-brandGreen" /> My Submitted Bids
              </h2>

              {bidsLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
                </div>
              ) : myBids.length === 0 ? (
                <div className="text-center py-16">
                  <Gavel className="h-10 w-10 text-muted mx-auto mb-3" />
                  <p className="text-sm font-semibold text-ink">No bids submitted yet</p>
                  <p className="text-xs text-muted mt-1">Browse the freelance marketplace to find gigs and submit proposals.</p>
                  <Link
                    href="/freelance"
                    className="inline-block mt-5 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                  >
                    Browse Gigs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBids.map((bid) => {
                    const statusClass = bidStatusColors[bid.status] ?? "bg-gray-100 text-gray-700 border-gray-200";
                    const gigTitle = bid.freelanceJob?.title || "Freelance Gig";

                    return (
                      <div
                        key={bid.id}
                        className="p-5 rounded-xl border border-border hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-ink">{gigTitle}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                              {bid.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {bid.timelineDays} days delivery
                            </span>
                            <span className="font-bold text-brandGreen text-sm">
                              {bid.amount.toLocaleString()} ETB
                            </span>
                          </div>

                          <div className="bg-pageBg/60 p-3.5 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1">
                              <FileText className="h-3.5 w-3.5 text-muted" /> Your Proposal
                            </p>
                            <p className="text-xs text-muted leading-relaxed line-clamp-3">{bid.coverLetter}</p>
                          </div>

                          <p className="text-[10px] text-muted pt-1">
                            Submitted on {new Date(bid.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="shrink-0 flex flex-col gap-2 self-start">
                          <Link
                            href={`/freelance/${bid.freelanceJobId}`}
                            className="flex items-center justify-center gap-1 text-xs font-semibold text-muted border border-border rounded-full py-1.5 px-3 hover:border-brandGreen hover:text-brandGreen transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Gig
                          </Link>
                          {bid.status === "ACCEPTED" && (
                            <div className="flex items-center gap-1 text-xs font-bold text-brandGreen bg-brandGreen/10 border border-brandGreen/20 rounded-full py-1.5 px-3">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Bid Won!
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wallet shortcut for freelancers */}
            <div className="mt-6 rounded-xl border border-border bg-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">BeleqetSafe Wallet</h3>
                <p className="text-xs text-muted mt-0.5">Track escrow earnings and request bank withdrawals.</p>
              </div>
              <Link
                href="/wallet"
                className="inline-flex items-center gap-1.5 rounded-full bg-brandGreen text-white text-xs font-semibold px-4 py-2 hover:bg-darkGreen transition-colors"
              >
                Open Wallet <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            JOB SEEKER VIEW: My Submitted Applications
        ════════════════════════════════════════════════════════ */}
        {isJobSeeker && (
          <div className="rounded-2xl border border-border bg-white p-6 min-h-[400px]">
            <h2 className="text-base font-bold text-ink mb-6">Submitted Applications</h2>

            {myAppsLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
              </div>
            ) : myApps.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="h-10 w-10 text-muted mx-auto mb-3" />
                <p className="text-sm font-semibold text-ink">You haven&apos;t applied to any jobs yet</p>
                <p className="text-xs text-muted mt-1">Browse our listing page and find jobs that match your skills.</p>
                <Link
                  href="/jobs"
                  className="inline-block mt-5 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myApps.map((app) => {
                  const job = app.job;
                  if (!job) return null;
                  const companyName = job.company?.name || job.companyName || "Company";
                  const statusClass = appStatusColors[app.status] ?? "bg-gray-100 text-gray-700 border-gray-200";

                  return (
                    <div
                      key={app.id}
                      className="p-5 rounded-xl border border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brandGreen/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-ink hover:text-brandGreen transition-colors">
                          <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" /> {companyName}
                          </span>
                          <span>·</span>
                          <span>{job.location}</span>
                          <span>·</span>
                          <span className="capitalize">{job.type.replace("_", " ").toLowerCase()}</span>
                        </div>
                        <p className="text-[10px] text-muted pt-1">
                          Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusClass}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
