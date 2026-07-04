"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { LogOut, User, ChevronDown, Briefcase, Gavel, Wallet, Bell, Check, Trash2, MailOpen, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { getNotifications, markNotificationAsRead, type ApiNotification } from "@/lib/api";

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  const isEmployer = user?.role === "EMPLOYER" || user?.role === "ADMIN";
  const isFreelancer = user?.role === "FREELANCER";

  useEffect(() => {
    if (user) {
      fetchNotifs();
      // Poll every 30 seconds for live updates
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  async function fetchNotifs() {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // Silently catch in header to prevent disruptions
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      const unreads = notifications.filter((n) => !n.read);
      await Promise.all(unreads.map((n) => markNotificationAsRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-primary">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brandGreen text-white text-sm">
            B
          </span>
          <span>
            Beleqet <span className="text-brandGreen">Job</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink">
          <Link href="/jobs" className="hover:text-brandGreen transition-colors">
            Find Jobs
          </Link>
          <Link href="/freelance" className="hover:text-brandGreen transition-colors">
            Freelance Gigs
          </Link>
          {!isLoading && (
            <>
              <Link href="/about" className="hover:text-brandGreen transition-colors">About</Link>
              <Link href="/cv-maker" className="hover:text-brandGreen transition-colors">CV Maker</Link>
              <Link href="/pricing" className="hover:text-brandGreen transition-colors">Pricing</Link>
              <Link href="/contact" className="hover:text-brandGreen transition-colors">Contact</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-24 rounded-full bg-border animate-pulse" />
          ) : user ? (
            <>
              {/* Role-based CTA */}
              {isFreelancer && (
                <Link
                  href="/wallet"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-muted border border-border rounded-full px-3 py-1.5 hover:border-brandGreen hover:text-brandGreen transition-colors"
                >
                  <Wallet className="h-3.5 w-3.5" /> Wallet
                </Link>
              )}
              {isEmployer && (
                <Link
                  href="/post-job"
                  id="post-job-btn"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                >
                  <Briefcase className="h-4 w-4" /> Post a Job
                </Link>
              )}

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setMenuOpen(false);
                  }}
                  className="relative p-1.5 text-muted hover:text-ink hover:bg-pageBg rounded-lg transition-colors flex items-center justify-center"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-amber-500 text-[9px] font-black text-white flex items-center justify-center px-1 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-[420px] rounded-xl border border-border bg-white shadow-cardHover overflow-hidden z-50 flex flex-col">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-pageBg/40">
                      <span className="font-bold text-xs text-ink">Notifications ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-brandGreen hover:underline font-semibold flex items-center gap-1"
                        >
                          <MailOpen className="h-3 w-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto divide-y divide-border/60 flex-1 max-h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3.5 transition-colors flex gap-2.5 items-start ${
                              notif.read ? "bg-white" : "bg-brandGreen/5 hover:bg-brandGreen/10"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-ink leading-normal truncate">{notif.title}</p>
                              <p className="text-[11px] text-muted leading-relaxed mt-0.5">{notif.body}</p>
                              <span className="text-[9px] text-muted block mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!notif.read && (
                              <button
                                onClick={() => handleMarkRead(notif.id)}
                                title="Mark as read"
                                className="shrink-0 p-1 text-muted hover:text-brandGreen rounded hover:bg-pageBg"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-ink hover:text-brandGreen transition-colors"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brandGreen/10 text-brandGreen">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <span className="hidden sm:block">{user.firstName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-white shadow-cardHover py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs text-muted truncate">{user.email}</p>
                      <p className="text-[10px] font-bold text-brandGreen uppercase mt-0.5">
                        {user.role.replace("_", " ")}
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-pageBg transition-colors"
                    >
                      <Briefcase className="h-4 w-4 text-muted" /> My Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-pageBg transition-colors"
                    >
                      <User className="h-4 w-4 text-muted" /> My Profile
                    </Link>

                    {isFreelancer && (
                      <>
                        <Link
                          href="/freelance"
                          onClick={() => setMenuOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-pageBg transition-colors"
                        >
                          <Gavel className="h-4 w-4 text-muted" /> Browse Gigs
                        </Link>
                        <Link
                          href="/wallet"
                          onClick={() => setMenuOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-pageBg transition-colors"
                        >
                          <Wallet className="h-4 w-4 text-muted" /> My Wallet
                        </Link>
                      </>
                    )}

                    {isEmployer && (
                      <>
                        <Link
                          href="/post-job"
                          onClick={() => setMenuOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-pageBg transition-colors"
                        >
                          <Briefcase className="h-4 w-4 text-muted" /> Post a Job
                        </Link>
                        <Link
                          href="/freelance/post"
                          onClick={() => setMenuOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-pageBg transition-colors"
                        >
                          <Gavel className="h-4 w-4 text-muted" /> Post a Gig
                        </Link>
                        {user?.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            <Shield className="h-4 w-4 text-purple-500" /> Admin Panel
                          </Link>
                        )}
                      </>
                    )}

                    <button
                      id="logout-btn"
                      onClick={async () => {
                        setMenuOpen(false);
                        await logout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-pageBg transition-colors border-t border-border"
                    >
                      <LogOut className="h-4 w-4 text-muted" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                id="login-link"
                className="hidden sm:inline-block text-sm font-medium text-ink hover:text-brandGreen transition-colors"
              >
                Login / Sign Up
              </Link>
              <Link
                href="/post-job"
                id="post-job-btn"
                className="inline-flex items-center rounded-full bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
              >
                Post a Job
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
