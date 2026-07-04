"use client";

import { useState, useEffect, FormEvent } from "react";
import { getFreelanceJobById, submitBid, acceptBid, ApiError, type ApiFreelanceJob, type ApiBid } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loader2, AlertCircle, Calendar, DollarSign, Tag, Briefcase, FileText, CheckCircle2, User, UserCheck, ShieldAlert } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function GigDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [gig, setGig] = useState<ApiFreelanceJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bidding form states
  const [amount, setAmount] = useState("");
  const [timelineDays, setTimelineDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);

  // Accept bid states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadGigData();
  }, [id]);

  async function loadGigData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getFreelanceJobById(id);
      setGig(data);
    } catch (err) {
      setError("Freelance gig not found or connection error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBidSubmit(e: FormEvent) {
    e.preventDefault();
    if (!gig) return;
    setError(null);
    setBidSubmitting(true);

    try {
      await submitBid(gig.id, {
        amount: Number(amount),
        timelineDays: Number(timelineDays),
        coverLetter,
      });
      setBidSuccess(true);
      // Reload gig details to show updated bids list
      const updated = await getFreelanceJobById(id);
      setGig(updated);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to submit bid. Please try again.");
    } finally {
      setBidSubmitting(false);
    }
  }

  async function handleAcceptBid(bidId: string) {
    if (!window.confirm("Are you sure you want to hire this freelancer? All other bids will be rejected.")) return;
    setActionLoading(bidId);
    setError(null);
    try {
      const contract = await acceptBid(bidId);
      // Redirect to the contract details page
      router.push(`/freelance/contracts/${contract.id}`);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to accept bid.");
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="container-page py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="container-page py-16 max-w-md text-center">
        <AlertCircle className="h-10 w-10 text-redAccent mx-auto mb-4" />
        <h1 className="text-xl font-bold text-ink">Gig Not Found</h1>
        <p className="text-muted text-sm mt-2">{error || "The freelance gig you're looking for doesn't exist."}</p>
        <Link
          href="/freelance"
          className="inline-block mt-6 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Back to Gigs
        </Link>
      </div>
    );
  }

  const isClient = user && user.id === gig.clientId;
  const isFreelancer = user && user.role === "FREELANCER";
  const hasAlreadyBid = gig.bids?.some((b) => b.freelancerId === user?.id);

  return (
    <div className="container-page py-12">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Left main content column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brandGreen/10 text-brandGreen mb-3 capitalize">
                  {gig.category?.label || "Freelance Category"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight">{gig.title}</h1>
                <p className="text-xs text-muted mt-2">
                  Posted by <span className="font-semibold text-ink">{gig.client?.firstName} {gig.client?.lastName}</span> ·{" "}
                  {new Date(gig.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-start sm:items-end">
                <span className="text-xs text-muted font-medium">Project Budget</span>
                <span className="text-2xl font-black text-brandGreen mt-1 flex items-center">
                  <DollarSign className="h-5 w-5 shrink-0 -mr-0.5" />
                  {gig.budgetMin.toLocaleString()} - {gig.budgetMax.toLocaleString()} ETB
                </span>
                <span className="text-[10px] uppercase font-bold text-muted mt-1 bg-pageBg px-2 py-0.5 border border-border rounded">
                  {gig.pricingType} Price
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="py-6 border-b border-border">
              <h3 className="text-sm font-bold text-ink mb-3">Project Description</h3>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{gig.description}</p>
            </div>

            {/* Skills */}
            <div className="py-6 border-b border-border">
              <h3 className="text-sm font-bold text-ink mb-3">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {gig.skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 text-xs bg-pageBg text-ink px-3 py-1.5 rounded-full border border-border font-medium">
                    <Tag className="h-3 w-3 text-muted" /> {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Extra details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 text-xs">
              <div className="bg-pageBg/60 p-4 rounded-xl border border-border/50 text-center">
                <Calendar className="h-5 w-5 text-muted mx-auto mb-2" />
                <span className="text-muted block">Timeline Duration</span>
                <span className="text-sm font-bold text-ink block mt-0.5">{gig.deadlineDays} Days</span>
              </div>
              <div className="bg-pageBg/60 p-4 rounded-xl border border-border/50 text-center">
                <Briefcase className="h-5 w-5 text-muted mx-auto mb-2" />
                <span className="text-muted block">Experience Level</span>
                <span className="text-sm font-bold text-ink block mt-0.5 capitalize">{gig.experienceLevel?.toLowerCase() || "Not Specified"}</span>
              </div>
              <div className="bg-pageBg/60 p-4 rounded-xl border border-border/50 text-center col-span-2 sm:col-span-1">
                <ShieldAlert className="h-5 w-5 text-muted mx-auto mb-2" />
                <span className="text-muted block">Project Status</span>
                <span className="text-sm font-bold text-brandGreen block mt-0.5 capitalize bg-brandGreen/5 border border-brandGreen/10 py-0.5 rounded">{gig.status}</span>
              </div>
            </div>
          </div>

          {/* Bids received review (Client view or general view) */}
          {isClient ? (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-brandGreen" /> Submitted Bids ({gig.bids?.length ?? 0})
              </h2>

              {!gig.bids || gig.bids.length === 0 ? (
                <div className="text-center py-10">
                  <User className="h-8 w-8 text-muted mx-auto mb-2" />
                  <p className="text-sm font-semibold text-ink">No proposals submitted yet</p>
                  <p className="text-xs text-muted mt-1">Freelancers bidding on your gig will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gig.bids.map((bid) => {
                    const bidderName = bid.freelancer
                      ? `${bid.freelancer.firstName} ${bid.freelancer.lastName}`
                      : "Freelancer";
                    const isPending = actionLoading === bid.id;

                    return (
                      <div
                        key={bid.id}
                        className="p-5 rounded-xl border border-border hover:shadow-card transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pageBg text-muted">
                              <User className="h-4 w-4" />
                            </span>
                            <div>
                              <h4 className="font-semibold text-sm text-ink">{bidderName}</h4>
                              <p className="text-xs text-muted">Bid placed on {new Date(bid.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="bg-pageBg/60 p-3.5 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1">
                              <FileText className="h-3.5 w-3.5 text-muted" /> Cover Letter
                            </p>
                            <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{bid.coverLetter}</p>
                          </div>
                        </div>

                        <div className="flex md:flex-col items-end gap-3 shrink-0 self-end md:self-start">
                          <div className="text-right">
                            <span className="text-xs text-muted">Proposed Price</span>
                            <p className="text-base font-black text-brandGreen mt-0.5">{bid.amount.toLocaleString()} ETB</p>
                            <span className="text-[10px] text-muted block mt-0.5">Timeline: {bid.timelineDays} days</span>
                          </div>

                          {gig.status === "OPEN" && (
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleAcceptBid(bid.id)}
                              className="rounded-full bg-brandGreen text-white text-xs font-semibold py-2 px-4 hover:bg-darkGreen transition-colors flex items-center gap-1.5"
                            >
                              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                              Accept Bid
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right bidding sidebar column */}
        <div>
          {isFreelancer ? (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
              <h3 className="text-base font-bold text-ink mb-4">Place a Bid</h3>

              {gig.status !== "OPEN" ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl text-muted text-xs">
                  This gig is no longer accepting bids.
                </div>
              ) : hasAlreadyBid ? (
                <div className="text-center py-6 border border-dashed border-border bg-brandGreen/5 text-brandGreen rounded-xl text-xs font-medium">
                  Proposal submitted! Check My Dashboard to track progress.
                </div>
              ) : bidSuccess ? (
                <div className="text-center py-6 bg-brandGreen/5 border border-brandGreen/20 text-brandGreen rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-brandGreen mx-auto mb-2" />
                  <p className="text-xs font-semibold text-ink">Bid Submitted Successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  {error && (
                    <div role="alert" className="flex items-start gap-1 rounded bg-redAccent/10 border border-redAccent/20 px-2.5 py-2 text-xs text-redAccent">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-3">{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Proposed Amount (ETB) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`e.g. ${gig.budgetMin}`}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-xs outline-none focus:border-brandGreen transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Timeline (Days) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={timelineDays}
                      onChange={(e) => setTimelineDays(e.target.value)}
                      placeholder={`e.g. ${gig.deadlineDays}`}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-xs outline-none focus:border-brandGreen transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Proposal Cover Letter *</label>
                    <textarea
                      required
                      rows={5}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Detail your relevant experience, approach, and why you're a great fit..."
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-xs outline-none focus:border-brandGreen transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bidSubmitting}
                    className="w-full rounded-full bg-brandGreen text-white text-xs font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {bidSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Submit Proposal
                  </button>
                </form>
              )}
            </div>
          ) : !isClient ? (
            <div className="bg-white rounded-2xl border border-border p-6 text-center shadow-card">
              <h3 className="text-sm font-semibold text-ink mb-2">Want to bid on this gig?</h3>
              <p className="text-xs text-muted mb-4">You must sign in with a Freelancer profile to submit proposed budgets.</p>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-full bg-brandGreen text-white text-xs font-semibold py-2.5 hover:bg-darkGreen transition-colors"
              >
                Sign In to Bid
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-6 text-center shadow-card bg-brandGreen/5">
              <h3 className="text-sm font-semibold text-ink mb-2">Your Listing</h3>
              <p className="text-xs text-muted">You are logged in as the creator of this gig. Review all incoming bids below.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
