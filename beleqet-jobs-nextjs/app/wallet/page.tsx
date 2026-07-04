"use client";

import { useState, useEffect, FormEvent } from "react";
import { getWallet, withdrawFunds, ApiError, type ApiWallet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loader2, AlertCircle, Lock, DollarSign, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const bankOptions = [
  { code: "CBE", name: "Commercial Bank of Ethiopia (CBE)" },
  { code: "BOA", name: "Bank of Abyssinia" },
  { code: "AWASH", name: "Awash Bank" },
  { code: "DASHE", name: "Dashen Bank" },
  { code: "COOP", name: "Cooperative Bank of Oromia" },
];

export default function WalletPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<ApiWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Withdrawal form state
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("CBE");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  async function loadWalletData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getWallet();
      setWallet(data);
    } catch (err) {
      setError("Failed to retrieve wallet information. Please check back later.");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(e: FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    setError(null);
    setWithdrawSuccess(false);

    if (Number(amount) > wallet.availableBalance) {
      setError("Withdrawal amount exceeds your available balance.");
      return;
    }

    setWithdrawSubmitting(true);
    try {
      await withdrawFunds({
        amount: Number(amount),
        bankCode,
        accountNumber,
      });
      setWithdrawSuccess(true);
      setAmount("");
      setAccountNumber("");
      // Reload wallet balances
      const updated = await getWallet();
      setWallet(updated);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Withdrawal request failed. Please try again.");
    } finally {
      setWithdrawSubmitting(false);
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
        <p className="text-muted text-sm mt-2">You need to sign in to access your wallet and balance details.</p>
        <Link
          href="/login"
          className="inline-block mt-6 rounded-full bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-extrabold text-ink mb-2">Beleqet Wallet</h1>
      <p className="text-muted text-sm mb-8">Manage your available gig earnings, view pending escrow holds, and request bank withdrawals.</p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Balance and ledger card */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Available Balance</span>
                <span className="text-2xl sm:text-3xl font-black text-brandGreen mt-2 flex items-center">
                  <DollarSign className="h-6 w-6 shrink-0 -mr-1" />
                  {wallet?.availableBalance.toLocaleString() || "0"} ETB
                </span>
                <p className="text-[11px] text-muted mt-2">Instantly withdrawable to your bank account.</p>
              </div>

              <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Pending Escrow</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-500 mt-2 flex items-center">
                  <DollarSign className="h-6 w-6 shrink-0 -mr-1" />
                  {wallet?.pendingBalance.toLocaleString() || "0"} ETB
                </span>
                <p className="text-[11px] text-muted mt-2">Locked in active contracts (releases on approval).</p>
              </div>
            </div>

            {/* Ledger Transactions list */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
              <h3 className="text-base font-bold text-ink mb-6">Recent Wallet Ledger Transactions</h3>
              {!wallet?.transactions || wallet.transactions.length === 0 ? (
                <div className="text-center py-10 text-muted text-xs border border-dashed border-border rounded-xl">
                  No wallet transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {wallet.transactions.map((tx: any) => {
                    const isCredit = tx.type === "CREDIT" || tx.type === "DEPOSIT";

                    return (
                      <div key={tx.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                            isCredit ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                          }`}>
                            {isCredit ? <ArrowDownLeft className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink capitalize">{tx.description || tx.type.toLowerCase().replace("_", " ")}</p>
                            <span className="text-[10px] text-muted">{new Date(tx.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${
                          isCredit ? "text-green-600" : "text-red-500"
                        }`}>
                          {isCredit ? "+" : "-"}{tx.amount.toLocaleString()} ETB
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Withdrawal sidebar card */}
          <div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-4">
              <h3 className="text-base font-bold text-ink">Request Withdrawal</h3>

              {withdrawSuccess && (
                <div className="p-3 bg-brandGreen/5 border border-brandGreen/25 text-brandGreen text-xs rounded-xl flex flex-col items-center text-center">
                  <CheckCircle2 className="h-5 w-5 mb-1 text-brandGreen" />
                  <span className="font-semibold text-ink">Request Placed Successfully!</span>
                  <p className="text-[11px] text-muted mt-1 leading-normal">Your withdrawal is being processed and will hit your bank account within 24 hours.</p>
                </div>
              )}

              {error && (
                <div role="alert" className="flex items-start gap-1 rounded bg-redAccent/10 border border-redAccent/20 px-2.5 py-2 text-xs text-redAccent">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-3 leading-normal">{error}</span>
                </div>
              )}

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Select Destination Bank *</label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-xs outline-none focus:border-brandGreen transition-colors bg-white"
                  >
                    {bankOptions.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Bank Account Number *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 1000123456789"
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-xs outline-none focus:border-brandGreen transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Amount to Withdraw (ETB) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Min: 100 ETB"
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-xs outline-none focus:border-brandGreen transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={withdrawSubmitting || !wallet || wallet.availableBalance < 100}
                  className="w-full rounded-full bg-brandGreen text-white text-xs font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {withdrawSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
