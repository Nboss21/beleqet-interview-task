"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Loader2, Lock, AlertTriangle,
  UserX, MoreVertical, CheckCircle, XCircle,
  Gavel, ExternalLink, Clock, ChevronDown,
} from "lucide-react";
import { getToken, ApiError } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// Minimal typed admin client
async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? `Error ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

interface AdminDispute {
  id: string;
  resolution?: string | null;
  resolvedAt?: string | null;
  contract?: {
    id: string;
    agreedAmount: number;
    freelanceJob?: { title: string } | null;
    client?: { firstName: string; lastName: string } | null;
    freelancer?: { firstName: string; lastName: string } | null;
  } | null;
}

type AdminTab = "users" | "disputes";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Resolution form
  const [resolutionTarget, setResolutionTarget] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return router.replace("/login");
    if (user.role !== "ADMIN") return router.replace("/dashboard");
    loadData();
  }, [user, authLoading]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [u, d] = await Promise.all([
        adminFetch<AdminUser[]>("/admin/users"),
        adminFetch<AdminDispute[]>("/admin/escrow/disputes"),
      ]);
      setUsers(u);
      setDisputes(d);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend(userId: string) {
    if (!window.confirm("Suspend this user? They will no longer be able to log in.")) return;
    setActionLoading(userId);
    try {
      await adminFetch(`/admin/users/${userId}/suspend`, { method: "PATCH" });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: false } : u));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to suspend user.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResolve(disputeId: string) {
    if (resolutionText.trim().length < 10) {
      setError("Resolution must be at least 10 characters.");
      return;
    }
    setActionLoading(disputeId);
    setError(null);
    try {
      await adminFetch(`/admin/disputes/${disputeId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution: resolutionText }),
      });
      setDisputes((prev) =>
        prev.map((d) => d.id === disputeId ? { ...d, resolution: resolutionText, resolvedAt: new Date().toISOString() } : d)
      );
      setResolutionTarget(null);
      setResolutionText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to resolve dispute.");
    } finally {
      setActionLoading(null);
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    EMPLOYER: "bg-blue-100 text-blue-700",
    FREELANCER: "bg-green-100 text-green-700",
    JOB_SEEKER: "bg-amber-100 text-amber-700",
  };

  if (authLoading || loading) {
    return (
      <div className="container-page py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container-page py-24 max-w-md text-center">
        <Lock className="h-10 w-10 text-muted mx-auto mb-4" />
        <h1 className="text-xl font-extrabold text-ink">Admin access required</h1>
        <p className="text-muted text-sm mt-2">This page is restricted to platform administrators.</p>
      </div>
    );
  }

  return (
    <main className="container-page py-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Admin Panel</h1>
          <p className="text-sm text-muted mt-0.5">Manage users, disputes, and platform operations.</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Active Users", value: users.filter(u => u.isActive).length, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Suspended", value: users.filter(u => !u.isActive).length, icon: UserX, color: "text-red-600 bg-red-50" },
          { label: "Open Disputes", value: disputes.filter(d => !d.resolvedAt).length, icon: Gavel, color: "text-amber-600 bg-amber-50" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{stat.value}</p>
            <p className="text-xs text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 gap-1">
        {([["users", "Users", Users], ["disputes", "Disputes", Gavel]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === id
                ? "border-brandGreen text-brandGreen"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "disputes" && disputes.filter(d => !d.resolvedAt).length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.5 font-black">
                {disputes.filter(d => !d.resolvedAt).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pageBg/60 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.map((u) => (
                <tr key={u.id} className={`transition-colors ${!u.isActive ? "opacity-50 bg-red-50/30" : "hover:bg-pageBg/30"}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{u.firstName || u.email.split("@")[0]} {u.lastName}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                        <XCircle className="h-3.5 w-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.isActive && u.role !== "ADMIN" && (
                      <button
                        onClick={() => handleSuspend(u.id)}
                        disabled={actionLoading === u.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 text-center text-muted text-sm">No users found.</div>
          )}
        </div>
      )}

      {/* Disputes Tab */}
      {tab === "disputes" && (
        <div className="space-y-4">
          {disputes.length === 0 && (
            <div className="py-16 text-center text-muted text-sm rounded-xl border border-border bg-white">
              No disputes found. Platform is running clean ✅
            </div>
          )}
          {disputes.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Gavel className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-ink text-sm">
                      {d.contract?.freelanceJob?.title ?? "Freelance Contract"}
                    </span>
                    {d.resolvedAt ? (
                      <span className="ml-2 rounded-full bg-green-100 text-green-700 text-[10px] px-2 py-0.5 font-black">RESOLVED</span>
                    ) : (
                      <span className="ml-2 rounded-full bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 font-black">OPEN</span>
                    )}
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <p>Client: <span className="text-ink font-medium">{d.contract?.client?.firstName} {d.contract?.client?.lastName}</span></p>
                    <p>Freelancer: <span className="text-ink font-medium">{d.contract?.freelancer?.firstName} {d.contract?.freelancer?.lastName}</span></p>
                    <p>Contract Amount: <span className="text-ink font-medium">ETB {d.contract?.agreedAmount?.toLocaleString()}</span></p>
                    {d.resolution && (
                      <p className="mt-2 p-2 bg-green-50 rounded text-green-700 text-[11px]">
                        Resolution: {d.resolution}
                      </p>
                    )}
                  </div>
                </div>

                {!d.resolvedAt && (
                  <button
                    onClick={() => {
                      setResolutionTarget(resolutionTarget === d.id ? null : d.id);
                      setResolutionText("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 rounded-lg px-3 py-2 transition-colors whitespace-nowrap"
                  >
                    <Gavel className="h-3.5 w-3.5" />
                    Resolve
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${resolutionTarget === d.id ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>

              {/* Resolution Form */}
              {resolutionTarget === d.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <label className="text-xs font-bold text-ink block">Resolution Details <span className="text-red-500">*</span></label>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={3}
                    placeholder="Describe the resolution in detail (min 10 characters)..."
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brandGreen/30 focus:border-brandGreen resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolve(d.id)}
                      disabled={actionLoading === d.id || resolutionText.trim().length < 10}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Confirm Resolution
                    </button>
                    <button
                      onClick={() => { setResolutionTarget(null); setResolutionText(""); }}
                      className="text-xs text-muted hover:text-ink border border-border rounded-lg px-4 py-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
