import type { KnowledgeArticle, ArticleCategory, ArticleStatus } from "@/src/lib/types/knowledge";

export const ARTICLE_CATEGORY_CONFIG: Record<ArticleCategory, { label: string; color: string; bg: string; border: string }> = {
  onboarding:  { label: "Onboarding",  color: "text-indigo-700 dark:text-indigo-400",   bg: "bg-indigo-100 dark:bg-indigo-950/60",   border: "border-indigo-200 dark:border-indigo-800" },
  hr_policies: { label: "HR Policies", color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-100 dark:bg-amber-950/60",     border: "border-amber-200 dark:border-amber-800" },
  payroll:     { label: "Payroll",     color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/60", border: "border-emerald-200 dark:border-emerald-800" },
  benefits:    { label: "Benefits",    color: "text-cyan-700 dark:text-cyan-400",       bg: "bg-cyan-100 dark:bg-cyan-950/60",       border: "border-cyan-200 dark:border-cyan-800" },
  compliance:  { label: "Compliance",  color: "text-rose-700 dark:text-rose-400",       bg: "bg-rose-100 dark:bg-rose-950/60",       border: "border-rose-200 dark:border-rose-800" },
  tools:       { label: "Tools",       color: "text-violet-700 dark:text-violet-400",   bg: "bg-violet-100 dark:bg-violet-950/60",   border: "border-violet-200 dark:border-violet-800" },
  general:     { label: "General",     color: "text-slate-700 dark:text-slate-400",     bg: "bg-slate-100 dark:bg-slate-800",        border: "border-slate-200 dark:border-slate-700" },
};

export const ARTICLE_CATEGORY_OPTIONS: { value: ArticleCategory; label: string }[] = (
  Object.entries(ARTICLE_CATEGORY_CONFIG) as [ArticleCategory, { label: string }][]
).map(([value, { label }]) => ({ value, label }));

export const ARTICLE_STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; bg: string; border: string }> = {
  published: { label: "Published", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/60", border: "border-emerald-200 dark:border-emerald-800" },
  draft:     { label: "Draft",     color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-100 dark:bg-amber-950/60",     border: "border-amber-200 dark:border-amber-800" },
  archived:  { label: "Archived",  color: "text-slate-700 dark:text-slate-400",     bg: "bg-slate-100 dark:bg-slate-800",        border: "border-slate-200 dark:border-slate-700" },
};

export const ARTICLES: KnowledgeArticle[] = [
  {
    id: "ka-001", title: "Getting Started: Your First Week at Motee", summary: "A complete guide to your first week, covering orientation, tools setup, and team introductions.", content: "Welcome aboard! Your first week covers HR induction, IT setup, and meeting your team...", category: "onboarding", status: "published", authorName: "Adaeze Okonkwo", authorInitials: "AO", tags: ["onboarding", "new hire", "welcome"], views: 842, helpful: 730, createdAt: "2024-01-05", updatedAt: "2025-11-01", publishedAt: "2024-01-06",
  },
  {
    id: "ka-002", title: "Annual Leave Policy 2025", summary: "Detailed breakdown of annual leave entitlement, application process, and approval workflow.", content: "All full-time employees are entitled to 20 days annual leave per year...", category: "hr_policies", status: "published", authorName: "Babatunde Lawal", authorInitials: "BL", tags: ["leave", "policy", "annual leave"], views: 1120, helpful: 980, createdAt: "2024-02-01", updatedAt: "2025-01-02", publishedAt: "2024-02-02",
  },
  {
    id: "ka-003", title: "Understanding Your Payslip", summary: "A guide to reading your monthly payslip including deductions, bonuses, and tax information.", content: "Your payslip contains your gross salary, PAYE tax deduction, NHF, and pension contributions...", category: "payroll", status: "published", authorName: "Chiamaka Eze", authorInitials: "CE", tags: ["payslip", "payroll", "deductions", "tax"], views: 960, helpful: 890, createdAt: "2024-03-10", updatedAt: "2025-10-15", publishedAt: "2024-03-11",
  },
  {
    id: "ka-004", title: "Health Insurance Coverage Guide", summary: "Everything you need to know about your HMO plan, covered services, and how to make claims.", content: "Your health insurance is provided through our HMO partner and covers outpatient and inpatient services...", category: "benefits", status: "published", authorName: "Adaeze Okonkwo", authorInitials: "AO", tags: ["health", "HMO", "benefits", "insurance"], views: 640, helpful: 590, createdAt: "2024-04-01", updatedAt: "2025-04-02", publishedAt: "2024-04-02",
  },
  {
    id: "ka-005", title: "Data Protection & GDPR Compliance", summary: "Employee obligations under data protection law and how we handle personal data.", content: "All employees must comply with NDPR and internal data handling policies...", category: "compliance", status: "published", authorName: "Ngozi Obi", authorInitials: "NO", tags: ["GDPR", "NDPR", "data", "compliance"], views: 380, helpful: 310, createdAt: "2024-05-15", updatedAt: "2025-05-16", publishedAt: "2024-05-16",
  },
  {
    id: "ka-006", title: "How to Use the HR Portal", summary: "Step-by-step instructions for navigating the HR portal to manage leave, payslips, and more.", content: "The HR portal allows you to apply for leave, view payslips, update personal info...", category: "tools", status: "published", authorName: "Babatunde Lawal", authorInitials: "BL", tags: ["portal", "tools", "guide"], views: 770, helpful: 720, createdAt: "2024-06-01", updatedAt: "2025-06-03", publishedAt: "2024-06-02",
  },
  {
    id: "ka-007", title: "Remote Work Guidelines 2026 (Draft)", summary: "Updated remote work policy covering eligibility, expectations, and equipment allowances.", content: "Draft: Remote work is available to eligible employees subject to manager approval...", category: "hr_policies", status: "draft", authorName: "Adaeze Okonkwo", authorInitials: "AO", tags: ["remote work", "WFH", "policy"], views: 45, helpful: 30, createdAt: "2026-01-10", updatedAt: "2026-01-18",
  },
  {
    id: "ka-008", title: "Pension Contribution Explained", summary: "How your pension contributions work, employer matching, and how to check your balance.", content: "Employees contribute 8% of basic salary and the employer contributes 10%...", category: "benefits", status: "published", authorName: "Chiamaka Eze", authorInitials: "CE", tags: ["pension", "retirement", "benefits"], views: 520, helpful: 480, createdAt: "2024-07-01", updatedAt: "2025-07-02", publishedAt: "2024-07-02",
  },
];

export function getCategoryBreakdown(articles: KnowledgeArticle[]): Record<ArticleCategory, number> {
  const result = {} as Record<ArticleCategory, number>;
  for (const opt of ARTICLE_CATEGORY_OPTIONS) result[opt.value] = 0;
  for (const a of articles) result[a.category] = (result[a.category] ?? 0) + 1;
  return result;
}

export function getTopArticles(articles: KnowledgeArticle[], limit = 5): KnowledgeArticle[] {
  return [...articles].sort((a, b) => b.views - a.views).slice(0, limit);
}

export function computeKbStats(articles: KnowledgeArticle[]): {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  helpfulRate: number;
  totalViews: number;
} {
  const published = articles.filter((a) => a.status === "published");
  const totalViews = articles.reduce((s, a) => s + a.views, 0);
  const totalHelpful = articles.reduce((s, a) => s + (a.helpful ?? 0), 0);
  return {
    total: articles.length,
    published: published.length,
    drafts: articles.filter((a) => a.status === "draft").length,
    archived: articles.filter((a) => a.status === "archived").length,
    helpfulRate: totalViews > 0 ? Math.round((totalHelpful / totalViews) * 100) : 0,
    totalViews,
  };
}

export const ARTICLE_STATUS_OPTIONS: { value: import("@/src/lib/types/knowledge").ArticleStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(ARTICLE_STATUS_CONFIG).map(([value, cfg]) => ({ value: value as import("@/src/lib/types/knowledge").ArticleStatus, label: cfg.label })),
];
