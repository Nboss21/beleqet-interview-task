"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { getUserProfile, updateUserProfile, ApiError, type UserProfile } from "@/lib/api";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Send, 
  MapPin, 
  Globe, 
  Github, 
  Linkedin, 
  FileText, 
  Briefcase, 
  Plus, 
  X,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [defaultResumeUrl, setDefaultResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [activeTab, setActiveTab] = useState<"personal" | "professional" | "skills">("personal");

  useEffect(() => {
    if (authUser) {
      loadProfile();
    }
  }, [authUser]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile();
      setProfile(data);
      
      // Initialize states
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setPhone(data.phone || "");
      setTelegramId(data.telegramId || "");
      setHeadline(data.headline || "");
      setBio(data.bio || "");
      setLocation(data.location || "");
      setDefaultResumeUrl(data.defaultResumeUrl || "");
      setPortfolioUrl(data.portfolioUrl || "");
      setGithubUrl(data.githubUrl || "");
      setLinkedinUrl(data.linkedinUrl || "");
      setSkills(data.skills || []);
    } catch (err) {
      setError("Failed to fetch profile details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const updated = await updateUserProfile({
        firstName,
        lastName,
        phone: phone || null,
        telegramId: telegramId || null,
        headline: headline || null,
        bio: bio || null,
        location: location || null,
        defaultResumeUrl: defaultResumeUrl || null,
        portfolioUrl: portfolioUrl || null,
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
        skills,
      });
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to save changes. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleAddSkill(e: FormEvent) {
    e.preventDefault();
    const cleanSkill = newSkill.trim();
    if (cleanSkill && !skills.includes(cleanSkill)) {
      setSkills([...skills, cleanSkill]);
      setNewSkill("");
    }
  }

  function handleRemoveSkill(skillToRemove: string) {
    setSkills(skills.filter((s) => s !== skillToRemove));
  }

  if (authLoading || (loading && authUser)) {
    return (
      <div className="container-page py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="container-page py-24 max-w-md text-center">
        <User className="h-10 w-10 text-muted mx-auto mb-4" />
        <h1 className="text-xl font-extrabold text-ink">Sign in required</h1>
        <p className="text-muted text-sm mt-2">You need to sign in to access and edit your profile settings.</p>
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
    <div className="container-page py-12 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">My Profile</h1>
          <p className="text-sm text-muted mt-1">Manage your user details, professional credentials, and platform role settings.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <span className="text-xs text-muted font-medium">Your Role:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brandGreen/10 text-brandGreen border border-brandGreen/25 uppercase">
            <Sparkles className="h-3 w-3" /> {profile?.role.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("personal")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "personal" ? "border-brandGreen text-brandGreen" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Personal Details
        </button>
        <button
          onClick={() => setActiveTab("professional")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "professional" ? "border-brandGreen text-brandGreen" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Bio & Links
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "skills" ? "border-brandGreen text-brandGreen" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Skills ({skills.length})
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-lg bg-redAccent/10 border border-redAccent/20 px-4 py-3 text-sm text-redAccent">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-brandGreen/15 border border-brandGreen/25 px-4 py-3 text-sm text-brandGreen font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Changes saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card space-y-6">
        
        {/* TAB 1: PERSONAL DETAILS */}
        {activeTab === "personal" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border/50 pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-pageBg/40 text-muted text-sm">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{profile?.email}</span>
              </div>
              <span className="text-[10px] text-muted block mt-1">Contact your administrator to change your registered email address.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +251911223344"
                    className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Telegram handle or ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Send className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="e.g. @username"
                    className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Location</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <MapPin className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Addis Ababa, Ethiopia"
                  className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BIO & LINKS */}
        {activeTab === "professional" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border/50 pb-2">Professional Profile</h3>
            
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Professional Headline</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Briefcase className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Fullstack Engineer | React & NestJS Specialist"
                  className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Professional Bio</label>
              <textarea
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief professional summary about yourself, your experience, and goals..."
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors resize-none leading-relaxed"
              />
            </div>

            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border/50 pb-2 pt-2">External Links</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Portfolio Website</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Globe className="h-4 w-4" />
                  </span>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://mywebsite.com"
                    className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">LinkedIn Profile</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Linkedin className="h-4 w-4" />
                  </span>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">GitHub Profile</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Github className="h-4 w-4" />
                  </span>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Default Resume/CV Link</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <FileText className="h-4 w-4" />
                  </span>
                  <input
                    type="url"
                    value={defaultResumeUrl}
                    onChange={(e) => setDefaultResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/.../resume.pdf"
                    className="w-full rounded-lg border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SKILLS */}
        {activeTab === "skills" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border/50 pb-2">Skills Inventory</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. React, Docker, Python, Figma"
                className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-lg bg-brandGreen text-white text-sm font-semibold px-4 py-2.5 hover:bg-darkGreen transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Skill
              </button>
            </div>

            <div className="pt-2">
              <span className="text-xs text-muted block mb-3 font-medium">Your Skills Tag Cloud:</span>
              {skills.length === 0 ? (
                <div className="text-center py-8 bg-pageBg/40 border border-dashed border-border rounded-xl text-xs text-muted">
                  No skills tags added yet. Add skills to help recruiters or clients discover you.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1.5 text-xs bg-pageBg text-ink px-3 py-1.5 rounded-full border border-border font-semibold hover:border-redAccent/30 transition-colors group"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-muted hover:text-redAccent group-hover:text-redAccent transition-colors rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted leading-normal">
            * Indicates required fields. Profile changes take effect immediately on live job listings.
          </span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brandGreen text-white text-sm font-semibold px-6 py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Saving changes..." : "Save Profile Details"}
          </button>
        </div>

      </form>
    </div>
  );
}
