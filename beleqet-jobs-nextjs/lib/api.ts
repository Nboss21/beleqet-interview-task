/**
 * lib/api.ts — Typed API client for the Beleqet NestJS backend.
 *
 * Security note: tokens are stored in localStorage for time-constraint reasons.
 * In production, use httpOnly cookies + a Next.js middleware/session pattern for
 * CSRF protection and XSS resilience. This is an intentional, documented tradeoff.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// ─── TypeScript types ────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "EMPLOYER" | "JOB_SEEKER" | "FREELANCER";

export type JobType = "FULL_TIME" | "PART_TIME" | "REMOTE" | "HYBRID" | "CONTRACT";

export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type ApplicationStatus =
  | "SUBMITTED"
  | "SCREENING"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  createdAt: string;
}

export interface ApiJobCategory {
  id: string;
  label: string;
  slug: string;
  icon?: string | null;
  _count?: { jobs: number };
}

export interface ApiJob {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  location: string;
  type: JobType;
  status: JobStatus;
  salaryMin?: number | null;
  salaryMax?: number | null;
  featured?: boolean;
  urgent?: boolean;
  tags?: string[];
  companyName?: string | null;
  companyLogo?: string | null;
  createdAt: string;
  deadline?: string | null;
  categoryId?: string | null;
  category?: ApiJobCategory | null;
  // Real backend response: company is a full Company object
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    description?: string | null;
    website?: string | null;
    industry?: string | null;
  } | null;
  // Legacy alias kept for compatibility
  employer?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: { name: string; logoUrl?: string | null } | null;
  } | null;
}

export interface PaginatedJobs {
  items: ApiJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiApplication {
  id: string;
  jobId: string;
  userId: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  job?: ApiJob | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

// ─── ApiError ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ─── Token helpers (localStorage, safe for SSR) ───────────────────────────────

const TOKEN_KEY = "beleqet_access";
const REFRESH_KEY = "beleqet_refresh";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setTokens = (access: string, refresh: string): void => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// ─── Base fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    let details: unknown;
    try {
      const body = await res.json();
      // NestJS global exception filter shape: { message, statusCode, error }
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join("; ");
      details = body;
    } catch {
      // body wasn't JSON — keep the default message
    }
    throw new ApiError(message, res.status, details);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}): Promise<{ message?: string; user?: ApiUser }> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>("/auth/me");
}

export async function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface GetJobsParams {
  q?: string;
  category?: string;
  location?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export async function getJobs(params: GetJobsParams = {}): Promise<PaginatedJobs> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.location) qs.set("location", params.location);
  if (params.type) qs.set("type", params.type);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<PaginatedJobs>(`/jobs${query}`);
}

export async function getJobCategories(): Promise<ApiJobCategory[]> {
  return apiFetch<ApiJobCategory[]>("/jobs/categories");
}

export async function getJobById(id: string): Promise<ApiJob> {
  return apiFetch<ApiJob>(`/jobs/${id}`);
}

export interface CreateJobPayload {
  title: string;
  description: string;
  requirements?: string;
  location: string;
  type: JobType;
  categoryId: string;
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
}

export async function createJob(payload: CreateJobPayload): Promise<ApiJob> {
  return apiFetch<ApiJob>("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteJob(id: string): Promise<void> {
  return apiFetch<void>(`/jobs/${id}`, { method: "DELETE" });
}

// ─── Applications ─────────────────────────────────────────────────────────────

export interface ApplyPayload {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
}

export async function applyToJob(payload: ApplyPayload): Promise<ApiApplication> {
  return apiFetch<ApiApplication>("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyApplications(): Promise<ApiApplication[]> {
  return apiFetch<ApiApplication[]>("/applications/my");
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface ApiCompany {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  verified?: boolean;
}

export interface CreateCompanyPayload {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
}

export async function getCompany(): Promise<ApiCompany | null> {
  return apiFetch<ApiCompany | null>("/users/company");
}

export async function createCompany(payload: CreateCompanyPayload): Promise<ApiCompany> {
  return apiFetch<ApiCompany>("/users/company", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Employer Dashboard ────────────────────────────────────────────────────────

export async function getEmployerJobs(): Promise<ApiJob[]> {
  return apiFetch<ApiJob[]>("/jobs/my");
}

export async function getJobApplications(jobId: string): Promise<ApiApplication[]> {
  return apiFetch<ApiApplication[]>(`/applications/job/${jobId}`);
}

export async function updateApplicationStatus(
  id: string,
  status: "SHORTLISTED" | "REJECTED" | "HIRED"
): Promise<ApiApplication> {
  return apiFetch<ApiApplication>(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ─── Freelance Gigs ───────────────────────────────────────────────────────────

export interface ApiFreelanceJob {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  pricingType: "FIXED" | "HOURLY";
  deadlineDays: number;
  skills: string[];
  locationPreference?: string | null;
  experienceLevel?: string | null;
  status: "OPEN" | "FUNDED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
  categoryId: string;
  category?: ApiJobCategory | null;
  clientId: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  bids?: ApiBid[] | null;
  createdAt: string;
  _count?: {
    bids: number;
  } | null;
}

export interface ApiBid {
  id: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  freelancerId: string;
  freelancer?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  freelanceJobId: string;
  freelanceJob?: ApiFreelanceJob | null;
  createdAt: string;
}

export interface ApiContract {
  id: string;
  freelanceJobId: string;
  freelanceJob?: ApiFreelanceJob | null;
  clientId: string;
  client?: { id: string; firstName: string; lastName: string } | null;
  freelancerId: string;
  freelancer?: { id: string; firstName: string; lastName: string } | null;
  agreedAmount: number;
  status: "ACTIVE" | "COMPLETED" | "DISPUTED" | "TERMINATED";
  milestones?: ApiMilestone[] | null;
  createdAt: string;
}

export interface ApiMilestone {
  id: string;
  contractId: string;
  title: string;
  amount: number;
  status: "PENDING" | "FUNDED" | "SUBMITTED" | "APPROVED" | "RELEASED";
  dueDate?: string | null;
  approvedAt?: string | null;
  deliverables?: any[] | null;
}

export async function getFreelanceJobs(params: {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: ApiFreelanceJob[]; total: number; page: number; limit: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/freelance/jobs${query}`);
}

export async function getFreelanceCategories(): Promise<ApiJobCategory[]> {
  return apiFetch<ApiJobCategory[]>("/freelance/categories");
}

export async function getFreelanceJobById(id: string): Promise<ApiFreelanceJob> {
  return apiFetch<ApiFreelanceJob>(`/freelance/jobs/${id}`);
}

export async function createFreelanceJob(payload: {
  title: string;
  description: string;
  categoryId: string;
  budgetMin: number;
  budgetMax: number;
  pricingType: "FIXED" | "HOURLY";
  deadlineDays: number;
  skills: string[];
  locationPreference?: string;
  experienceLevel?: string;
}): Promise<ApiFreelanceJob> {
  return apiFetch<ApiFreelanceJob>("/freelance/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitBid(
  gigId: string,
  payload: { amount: number; timelineDays: number; coverLetter: string }
): Promise<ApiBid> {
  return apiFetch<ApiBid>(`/freelance/jobs/${gigId}/bids`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function acceptBid(bidId: string): Promise<ApiContract> {
  return apiFetch<ApiContract>(`/freelance/bids/${bidId}/accept`, {
    method: "PATCH",
  });
}

export async function getMyBids(): Promise<ApiBid[]> {
  return apiFetch<ApiBid[]>("/freelance/my-bids");
}

export async function getContract(contractId: string): Promise<ApiContract> {
  return apiFetch<ApiContract>(`/freelance/contracts/${contractId}`);
}

export async function approveMilestone(milestoneId: string): Promise<ApiMilestone> {
  return apiFetch<ApiMilestone>(`/freelance/milestones/${milestoneId}/approve`, {
    method: "PATCH",
  });
}

// ─── Escrow & Wallet ──────────────────────────────────────────────────────────

export interface ApiWallet {
  id: string;
  userId: string;
  pendingBalance: number;
  availableBalance: number;
  createdAt: string;
  transactions?: any[];
}

export async function initiateEscrow(gigId: string): Promise<{ paymentUrl: string }> {
  return apiFetch<{ paymentUrl: string }>(`/escrow/initiate/${gigId}`, {
    method: "POST",
  });
}

export async function releaseMilestone(milestoneId: string): Promise<void> {
  return apiFetch<void>(`/escrow/milestones/${milestoneId}/release`, {
    method: "POST",
  });
}

export async function getWallet(): Promise<ApiWallet> {
  return apiFetch<ApiWallet>("/wallet");
}

export async function withdrawFunds(payload: { amount: number; bankCode: string; accountNumber: string }): Promise<void> {
  return apiFetch<void>("/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<ApiNotification[]> {
  return apiFetch<ApiNotification[]>("/users/notifications");
}

export async function markNotificationAsRead(id: string): Promise<void> {
  return apiFetch<void>(`/users/notifications/${id}/read`, { method: "PATCH" });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  defaultResumeUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  skills: string[];
}

export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/profile");
}

export async function updateUserProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}





