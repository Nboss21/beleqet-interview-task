"use client";

import { useState, useEffect } from "react";
import { getContract, approveMilestone, initiateEscrow, releaseMilestone, ApiError, type ApiContract, type ApiMilestone } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loader2, AlertCircle, CheckCircle2, User, Landmark, DollarSign, ArrowRight, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ContractPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();

  const [contract, setContract] = useState<ApiContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [escrowLoading, setEscrowLoading] = useState(false);

  useEffect(() => {
    loadContractData();
  }, [id]);

  async function loadContractData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getContract(id);
      setContract(data);
    } catch (err) {
      setError("Contract not found or connection error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveMilestone(milestoneId: string) {
    if (!window.confirm("Are you sure you want to approve this milestone? This signals work completion.")) return;
    setActionLoading(milestoneId);
    setError(null);
    try {
      await approveMilestone(milestoneId);
      // Reload contract
      const updated = await getContract(id);
      setContract(updated);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to approve milestone.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleInitiateEscrow() {
    if (!contract || !contract.freelanceJobId) return;
    setEscrowLoading(true);
    setError(null);
    try {
      const res = await initiateEscrow(contract.freelanceJobId);
      if (res.paymentUrl) {
        window.open(res.paymentUrl, "_blank");
      } else {
        alert("Escrow funded successfully (Mock response)!");
        const updated = await getContract(id);
        setContract(updated);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to initiate escrow.");
    } finally {
      setEscrowLoading(false);
    }
  }

  async function handleReleaseMilestone(milestoneId: string) {
    if (!window.confirm("Release escrow funds for this milestone to the freelancer's wallet?")) return;
    setActionLoading(milestoneId);
    setError(null);
    try {
      await releaseMilestone(milestoneId);
      // Reload contract
      const updated = await getContract(id);
      setContract(updated);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to release funds.");
    } finally {
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

  if (error || !contract) {
    return (
      <div className="container-page py-16 max-w-md text-center">
        <AlertCircle className="h-10 w-10 text-redAccent mx-auto mb-4" />
        <h1 className="text-xl font-bold text-ink">Contract Not Found</h1>
        <p className="text-muted text-sm mt-2">{error || "Contract not found."}</p>
      </div>
    );
  }

  const isClient = user && user.id === contract.clientId;
  const isFreelancer = user && user.id === contract.freelancerId;

  return (
    <div className="container-page py-12 max-w-3xl">
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-brandGreen bg-brandGreen/10 border border-brandGreen/20 px-2.5 py-0.5 rounded mb-2">
              Contract Active
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-ink">
              Agreement for {contract.freelanceJob?.title || "Freelance Job"}
            </h1>
            <p className="text-xs text-muted mt-1">Agreement Date: {new Date(contract.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-muted">Agreed Payout</span>
            <p className="text-2xl font-black text-brandGreen flex items-center mt-0.5">
              <DollarSign className="h-5 w-5 shrink-0 -mr-0.5" />
              {contract.agreedAmount.toLocaleString()} ETB
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-redAccent/10 border border-redAccent/20 px-4 py-3 text-sm text-redAccent">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Client & Freelancer profiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-border">
          <div className="p-4 rounded-xl border border-border/60 bg-pageBg/40">
            <span className="text-[10px] font-bold text-muted uppercase">Client (Buyer)</span>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brandGreen/10 text-brandGreen">
                <User className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-ink">{contract.client?.firstName} {contract.client?.lastName}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-pageBg/40">
            <span className="text-[10px] font-bold text-muted uppercase">Freelancer (Provider)</span>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brandGreen/10 text-brandGreen">
                <User className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-ink">{contract.freelancer?.firstName} {contract.freelancer?.lastName}</span>
            </div>
          </div>
        </div>

        {/* Escrow Status Indicator */}
        <div className="p-5 bg-brandGreen/5 border border-brandGreen/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2.5 items-start">
            <ShieldCheck className="h-6 w-6 text-brandGreen shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-ink">BeleqetSafe Escrow Guarded</h3>
              <p className="text-xs text-muted leading-relaxed mt-0.5">
                Funds are held in secure escrow vaults and released to the freelancer only upon client milestones approval.
              </p>
            </div>
          </div>
          {isClient && (
            <button
              onClick={handleInitiateEscrow}
              disabled={escrowLoading}
              className="shrink-0 rounded-full bg-brandGreen text-white text-xs font-semibold py-2 px-4 hover:bg-darkGreen transition-colors flex items-center justify-center gap-1.5"
            >
              {escrowLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Landmark className="h-3.5 w-3.5" />}
              Fund Escrow (Chapa)
            </button>
          )}
        </div>

        {/* Milestones Listing */}
        <div>
          <h2 className="text-base font-bold text-ink mb-4">Contract Milestones</h2>
          {!contract.milestones || contract.milestones.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted">
              No milestones defined for this contract. (Standard 100% upfront escrow release applies).
            </div>
          ) : (
            <div className="space-y-3">
              {contract.milestones.map((m) => {
                const isPending = actionLoading === m.id;

                return (
                  <div key={m.id} className="p-4 rounded-xl border border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{m.title}</h4>
                      <p className="text-xs text-muted mt-0.5">Milestone Budget: <span className="font-semibold text-brandGreen">{m.amount.toLocaleString()} ETB</span></p>
                      <span className="inline-block text-[10px] font-bold text-muted capitalize mt-1.5 bg-pageBg border border-border px-2 py-0.5 rounded">
                        Status: {m.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isClient && m.status === "FUNDED" && (
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApproveMilestone(m.id)}
                          className="rounded-full border border-purple-200 text-purple-700 text-xs font-semibold py-1.5 px-3.5 hover:bg-purple-50 transition-colors flex items-center gap-1"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Approve Milestone
                        </button>
                      )}
                      {isClient && m.status === "APPROVED" && (
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleReleaseMilestone(m.id)}
                          className="rounded-full bg-brandGreen text-white text-xs font-semibold py-1.5 px-3.5 hover:bg-darkGreen transition-colors flex items-center gap-1"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                          Release Escrow Payout
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
