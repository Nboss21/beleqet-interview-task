import { Briefcase, Building2, Users, Smile, type LucideIcon } from "lucide-react";
import { getJobs } from "@/lib/api";

const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  "building-2": Building2,
  users: Users,
  smile: Smile,
};

// Static label/icon config — counts come from the API
const statConfig = [
  { label: "Active Jobs", icon: "briefcase", staticValue: "10,000+" },
  { label: "Hiring Companies", icon: "building-2", staticValue: "5,000+" },
  { label: "Registered Job Seekers", icon: "users", staticValue: "50,000+" },
  { label: "Satisfaction Rate", icon: "smile", staticValue: "98%" },
];

export default async function StatsBar() {
  let totalJobs = 0;
  try {
    const data = await getJobs({ limit: 1 });
    totalJobs = data.total;
  } catch {
    // Backend unavailable — silently fall back to static values
  }

  const stats = statConfig.map((s) => ({
    ...s,
    value: s.label === "Active Jobs" && totalJobs > 0 ? `${totalJobs.toLocaleString()}` : s.staticValue,
  }));

  return (
    <div className="container-page -mt-7 relative z-10">
      <div className="rounded-2xl bg-brandGreen text-white grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/15 shadow-cardHover">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon] ?? Briefcase;
          return (
            <div key={stat.label} className="flex items-center gap-3 px-5 py-5">
              <Icon className="h-5 w-5 text-white/80 shrink-0" />
              <div>
                <p className="text-lg font-extrabold leading-none">{stat.value}</p>
                <p className="text-[11px] text-white/70 mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
