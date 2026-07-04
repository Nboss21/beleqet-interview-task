import Link from "next/link";
import {
  Laptop,
  Megaphone,
  Landmark,
  HeartPulse,
  GraduationCap,
  Cog,
  Briefcase,
  Palette,
  Globe,
  Building2,
  Truck,
  ShieldCheck,
  Leaf,
  BarChart3,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { getJobCategories, type ApiJobCategory } from "@/lib/api";

// Icon map keyed by slug or label keyword (case-insensitive partial match)
const iconMap: Record<string, LucideIcon> = {
  laptop: Laptop,
  software: Laptop,
  "it-": Laptop,
  tech: Laptop,
  programming: Laptop,
  developer: Laptop,
  megaphone: Megaphone,
  marketing: Megaphone,
  sales: Megaphone,
  advertising: Megaphone,
  landmark: Landmark,
  finance: Landmark,
  accounting: Landmark,
  banking: Landmark,
  "heart-pulse": HeartPulse,
  health: HeartPulse,
  medical: HeartPulse,
  nursing: HeartPulse,
  pharma: HeartPulse,
  "graduation-cap": GraduationCap,
  education: GraduationCap,
  teaching: GraduationCap,
  training: GraduationCap,
  academic: GraduationCap,
  cog: Cog,
  engineering: Cog,
  manufacturing: Cog,
  mechanical: Cog,
  electrical: Cog,
  palette: Palette,
  design: Palette,
  creative: Palette,
  arts: Palette,
  globe: Globe,
  legal: ShieldCheck,
  law: ShieldCheck,
  logistics: Truck,
  transport: Truck,
  driver: Truck,
  supply: Truck,
  construction: Building2,
  architecture: Building2,
  building: Building2,
  agriculture: Leaf,
  farming: Leaf,
  environment: Leaf,
  analyst: BarChart3,
  data: BarChart3,
  research: BarChart3,
  business: BarChart3,
};

function resolveIcon(cat: ApiJobCategory): LucideIcon {
  const key = `${cat.slug ?? ""} ${cat.label ?? ""}`.toLowerCase();
  for (const [pattern, Icon] of Object.entries(iconMap)) {
    if (key.includes(pattern)) return Icon;
  }
  return Briefcase;
}

// Fallback categories shown when DB is empty or API is down
const fallbackCategories = [
  { id: "it-software", label: "IT & Software", icon: "laptop", count: 0 },
  { id: "marketing", label: "Marketing", icon: "megaphone", count: 0 },
  { id: "finance", label: "Finance", icon: "landmark", count: 0 },
  { id: "health", label: "Health", icon: "health", count: 0 },
  { id: "education", label: "Education", icon: "education", count: 0 },
  { id: "engineering", label: "Engineering", icon: "cog", count: 0 },
  { id: "design", label: "Design", icon: "design", count: 0 },
  { id: "other", label: "Other", icon: "more", count: 0 },
];

const MAX_DISPLAY = 10;

export default async function CategoryGrid() {
  let apiCategories: ApiJobCategory[] = [];
  try {
    apiCategories = await getJobCategories();
  } catch {
    // silently fall back to static list below
  }

  const showApi = apiCategories.length > 0;

  // Sort by job count descending; show non-zero first, then alphabetical
  const sortedCategories = showApi
    ? [...apiCategories].sort((a, b) => {
        const aCount = a._count?.jobs ?? 0;
        const bCount = b._count?.jobs ?? 0;
        if (bCount !== aCount) return bCount - aCount;
        return a.label.localeCompare(b.label);
      })
    : [];

  const displayCategories = sortedCategories.slice(0, MAX_DISPLAY);
  const totalCategories = apiCategories.length;

  return (
    <section className="container-page py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-sectionH2">Browse Jobs by Category</h2>
          <p className="text-muted text-sm mt-1">
            Explore opportunities across growing industries and find jobs that match your skills.
          </p>
        </div>
        <Link
          href="/jobs"
          className="hidden sm:inline-block text-sm font-semibold text-brandGreen hover:underline shrink-0"
        >
          View all {totalCategories > MAX_DISPLAY ? `${totalCategories}` : ""} categories →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {showApi
          ? displayCategories.map((cat) => {
              const Icon = resolveIcon(cat);
              const jobCount = cat._count?.jobs ?? 0;
              return (
                <Link
                  key={cat.id}
                  href={`/jobs?category=${cat.slug}`}
                  className="relative flex flex-col items-center text-center gap-2.5 rounded-xl border border-border bg-white px-3 py-6 hover:border-brandGreen hover:shadow-card transition-all group"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brandGreen/10 text-brandGreen group-hover:bg-brandGreen group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-ink leading-snug">{cat.label}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    jobCount > 0
                      ? "bg-brandGreen/10 text-brandGreen"
                      : "bg-border text-muted"
                  }`}>
                    {jobCount} {jobCount === 1 ? "job" : "jobs"}
                  </span>
                </Link>
              );
            })
          : fallbackCategories.map((cat) => {
              const Icon = resolveIcon({ id: cat.id, label: cat.label, slug: cat.id });
              return (
                <Link
                  key={cat.id}
                  href={`/jobs?category=${cat.id}`}
                  className="flex flex-col items-center text-center gap-2.5 rounded-xl border border-border bg-white px-3 py-6 hover:border-brandGreen hover:shadow-card transition-all group"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brandGreen/10 text-brandGreen group-hover:bg-brandGreen group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-ink leading-snug">{cat.label}</span>
                  <span className="text-[11px] text-muted">—</span>
                </Link>
              );
            })}

        {/* "View all" tile when more than MAX_DISPLAY categories exist */}
        {showApi && totalCategories > MAX_DISPLAY && (
          <Link
            href="/jobs"
            className="flex flex-col items-center text-center gap-2.5 rounded-xl border border-dashed border-border bg-white px-3 py-6 hover:border-brandGreen hover:shadow-card transition-all group"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pageBg text-muted group-hover:bg-brandGreen group-hover:text-white transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-ink">View All</span>
            <span className="text-[11px] text-muted">{totalCategories - MAX_DISPLAY} more</span>
          </Link>
        )}
      </div>
    </section>
  );
}
