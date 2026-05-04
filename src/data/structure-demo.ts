import type { HierarchyNode, HierarchyNodeStatus } from "@/src/lib/types/structure";

export const STATUS_LABELS: Record<HierarchyNodeStatus, string> = {
  active: "Active",
  vacant: "Vacant",
  on_leave: "On Leave",
};

export const STATUS_STYLES: Record<HierarchyNodeStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  vacant: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  on_leave: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
};

export const DEPT_OPTIONS = [
  "all",
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Product",
  "Sales",
  "Operations",
  "Legal",
];

function rawNodes(): Omit<HierarchyNode, "level" | "directReports" | "managerName">[] {
  return [
    { id: "n-001", name: "Adaeze Okonkwo", initials: "AO", jobTitle: "Chief Executive Officer", department: "Engineering", managerId: null, status: "active" },
    { id: "n-002", name: "Emeka Obi", initials: "EO", jobTitle: "VP Engineering", department: "Engineering", managerId: "n-001", status: "active" },
    { id: "n-003", name: "Amaka Nwosu", initials: "AN", jobTitle: "HR Director", department: "Human Resources", managerId: "n-001", status: "active" },
    { id: "n-004", name: "Tunde Adeyemi", initials: "TA", jobTitle: "CFO", department: "Finance", managerId: "n-001", status: "active" },
    { id: "n-005", name: "Ngozi Okeke", initials: "NO", jobTitle: "Head of Product", department: "Product", managerId: "n-001", status: "active" },
    { id: "n-006", name: "Chukwuemeka Eze", initials: "CE", jobTitle: "Senior Backend Engineer", department: "Engineering", managerId: "n-002", status: "active" },
    { id: "n-007", name: "Fatima Al-Hassan", initials: "FA", jobTitle: "Frontend Engineer", department: "Engineering", managerId: "n-002", status: "on_leave" },
    { id: "n-008", name: "Babatunde Adeyemi", initials: "BA", jobTitle: "DevOps Engineer", department: "Engineering", managerId: "n-002", status: "active" },
    { id: "n-009", name: "Yusuf Garba", initials: "YG", jobTitle: "HR Officer", department: "Human Resources", managerId: "n-003", status: "active" },
    { id: "n-010", name: "Amaka Chukwu", initials: "AC", jobTitle: "Talent Acquisition Specialist", department: "Human Resources", managerId: "n-003", status: "active" },
    { id: "n-011", name: "Blessing Okafor", initials: "BO", jobTitle: "Finance Analyst", department: "Finance", managerId: "n-004", status: "active" },
    { id: "n-012", name: "Musa Ibrahim", initials: "MI", jobTitle: "Accountant", department: "Finance", managerId: "n-004", status: "active" },
    { id: "n-013", name: "Ifeoma Nwachukwu", initials: "IN", jobTitle: "Payroll Officer", department: "Finance", managerId: "n-004", status: "on_leave" },
    { id: "n-014", name: "Sodiq Olawale", initials: "SO", jobTitle: "Product Manager", department: "Product", managerId: "n-005", status: "active" },
    { id: "n-015", name: "Kelechi Obi", initials: "KO", jobTitle: "UX Designer", department: "Product", managerId: "n-005", status: "active" },
    { id: "n-016", name: "Femi Alabi", initials: "FE", jobTitle: "Sales Director", department: "Sales", managerId: "n-001", status: "active" },
    { id: "n-017", name: "Aisha Bello", initials: "AB", jobTitle: "Brand Manager", department: "Sales", managerId: "n-016", status: "active" },
    { id: "n-018", name: "Kemi Bello", initials: "KB", jobTitle: "Operations Manager", department: "Operations", managerId: "n-001", status: "active" },
    { id: "n-019", name: "Chiamaka Eze", initials: "CHE", jobTitle: "Project Coordinator", department: "Operations", managerId: "n-018", status: "active" },
    { id: "n-020", name: "Abdullahi Musa", initials: "AM", jobTitle: "Logistics Officer", department: "Operations", managerId: "n-018", status: "active" },
  ];
}

export function recomputeNodes(nodes: HierarchyNode[]): HierarchyNode[] {
  const nameMap = new Map(nodes.map((n) => [n.id, n.name]));

  function computeLevel(node: HierarchyNode): number {
    if (!node.managerId) return 1;
    const parent = nodes.find((n) => n.id === node.managerId);
    if (!parent) return 1;
    return computeLevel(parent) + 1;
  }

  return nodes.map((node) => ({
    ...node,
    managerName: node.managerId ? nameMap.get(node.managerId) : undefined,
    level: computeLevel(node),
    directReports: nodes.filter((n) => n.managerId === node.id).length,
  }));
}

const _raw = rawNodes().map((n) => ({ ...n, level: 0, directReports: 0 })) as HierarchyNode[];

export const HIERARCHY_NODES: HierarchyNode[] = recomputeNodes(_raw);
