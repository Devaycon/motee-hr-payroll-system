import type { Asset } from "@/src/lib/types/assets";

export const DEPARTMENT_OPTIONS = [
  "all","Engineering","HR","Finance","Marketing","Sales",
  "Operations","Design","Product","Legal","Customer Success",
];

export const ASSET_STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  available: "Available",
  under_maintenance: "Under Maintenance",
  decommissioned: "Decommissioned",
};

export const ASSET_STATUS_STYLES: Record<string, string> = {
  assigned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  under_maintenance: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  decommissioned: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export const ASSET_CONDITION_LABELS: Record<string, string> = {
  new: "New",
  good: "Good",
  fair: "Fair",
  damaged: "Damaged",
  decommissioned: "Decommissioned",
};

export const ASSET_CONDITION_STYLES: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  good: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  fair: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  damaged: "bg-red-500/10 text-red-600 border-red-500/20",
  decommissioned: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  laptop: "Laptop",
  desktop: "Desktop",
  monitor: "Monitor",
  keyboard: "Keyboard",
  mouse: "Mouse",
  headset: "Headset",
  phone: "Phone",
  tablet: "Tablet",
  printer: "Printer",
  projector: "Projector",
  other: "Other",
};

export const ASSET_TYPE_OPTIONS = [
  "laptop","desktop","monitor","keyboard","mouse",
  "headset","phone","tablet","printer","projector","other",
] as const;

export const ASSET_HISTORY_LABELS: Record<string, string> = {
  created: "Created",
  assigned: "Assigned",
  returned: "Returned",
  maintenance_scheduled: "Maintenance Scheduled",
  maintenance_completed: "Maintenance Completed",
  condition_updated: "Condition Updated",
  decommissioned: "Decommissioned",
};

export const ASSET_HISTORY_STYLES: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  assigned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  returned: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  maintenance_scheduled: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  maintenance_completed: "bg-green-500/10 text-green-600 border-green-500/20",
  condition_updated: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  decommissioned: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export const ASSETS: Asset[] = [
  {
    id: "ast-001",
    name: "MacBook Pro 14\" M3",
    assetType: "laptop",
    serialNumber: "SN-MPB14-2024-001",
    status: "assigned",
    condition: "good",
    assignedToDepartment: "Engineering",
    purchaseDate: "2024-01-15",
    purchaseValue: 2499,
    assignedTo: "Adaeze Okonkwo",
    assignedToInitials: "AO",
    assignedDate: "2024-01-20",
    history: [
      { id: "h-001", action: "created", date: "2024-01-15", performedBy: "Chidinma Okeke", description: "Purchased from vendor" },
      { id: "h-002", action: "assigned", date: "2024-01-20", performedBy: "Chidinma Okeke", description: "Assigned to Adaeze Okonkwo" },
    ],
  },
  {
    id: "ast-002",
    name: "Dell UltraSharp 27\" Monitor",
    assetType: "monitor",
    serialNumber: "SN-DELL27-001",
    status: "assigned",
    condition: "good",
    assignedToDepartment: "Engineering",
    purchaseDate: "2024-01-15",
    purchaseValue: 420,
    assignedTo: "Adaeze Okonkwo",
    assignedToInitials: "AO",
    assignedDate: "2024-01-20",
    history: [
      { id: "h-003", action: "created", date: "2024-01-15", performedBy: "Chidinma Okeke", description: "Purchased from Dell Technologies" },
      { id: "h-004", action: "assigned", date: "2024-01-20", performedBy: "Chidinma Okeke", description: "Assigned to Adaeze Okonkwo" },
    ],
  },
  {
    id: "ast-003",
    name: "Lenovo ThinkPad X1 Carbon",
    assetType: "laptop",
    serialNumber: "SN-LTP-X1-2023-001",
    status: "available",
    condition: "good",
    assignedToDepartment: "Finance",
    purchaseDate: "2023-06-10",
    purchaseValue: 1650,
    history: [
      { id: "h-005", action: "created", date: "2023-06-10", performedBy: "Chidinma Okeke", description: "Purchased from Lenovo Nigeria" },
      { id: "h-006", action: "returned", date: "2025-12-01", performedBy: "Blessing Okafor", description: "Employee resigned" },
    ],
  },
  {
    id: "ast-004",
    name: "iPhone 15 Pro",
    assetType: "phone",
    serialNumber: "SN-IP15P-2024-001",
    status: "assigned",
    condition: "new",
    assignedToDepartment: "Marketing",
    purchaseDate: "2024-09-01",
    purchaseValue: 1099,
    assignedTo: "Aisha Bello",
    assignedToInitials: "AB",
    assignedDate: "2024-09-05",
    history: [
      { id: "h-007", action: "created", date: "2024-09-01", performedBy: "Chidinma Okeke", description: "Purchased from Jumia Business" },
      { id: "h-008", action: "assigned", date: "2024-09-05", performedBy: "Chidinma Okeke", description: "Assigned to Aisha Bello" },
    ],
  },
  {
    id: "ast-005",
    name: "HP LaserJet Pro M404dn",
    assetType: "printer",
    serialNumber: "SN-HPL-001",
    status: "under_maintenance",
    condition: "fair",
    assignedToDepartment: "Operations",
    purchaseDate: "2022-03-20",
    purchaseValue: 380,
    history: [
      { id: "h-009", action: "created", date: "2022-03-20", performedBy: "Chidinma Okeke", description: "Purchased from HP Store Lagos" },
      { id: "h-010", action: "maintenance_scheduled", date: "2026-02-15", performedBy: "Sodiq Olawale", description: "Paper feed issue reported" },
    ],
  },
  {
    id: "ast-006",
    name: "iPad Pro 11\" Wi-Fi",
    assetType: "tablet",
    serialNumber: "SN-IPP11-2023-001",
    status: "available",
    condition: "good",
    assignedToDepartment: "HR",
    purchaseDate: "2023-10-12",
    purchaseValue: 799,
    history: [
      { id: "h-011", action: "created", date: "2023-10-12", performedBy: "Chidinma Okeke", description: "Purchased from Apple Authorised Reseller" },
    ],
  },
  {
    id: "ast-007",
    name: "Sony WH-1000XM5 Headset",
    assetType: "headset",
    serialNumber: "SN-SNY-XM5-001",
    status: "assigned",
    condition: "new",
    assignedToDepartment: "Engineering",
    purchaseDate: "2025-01-20",
    purchaseValue: 349,
    assignedTo: "Chukwuemeka Eze",
    assignedToInitials: "CE",
    assignedDate: "2025-01-25",
    history: [
      { id: "h-012", action: "created", date: "2025-01-20", performedBy: "Chidinma Okeke", description: "Purchased from Slot Nigeria" },
      { id: "h-013", action: "assigned", date: "2025-01-25", performedBy: "Chidinma Okeke", description: "Assigned to Chukwuemeka Eze" },
    ],
  },
  {
    id: "ast-008",
    name: "Epson EX3280 Projector",
    assetType: "other",
    serialNumber: "SN-EPS-3280-001",
    status: "decommissioned",
    condition: "decommissioned",
    assignedToDepartment: "Operations",
    purchaseDate: "2019-07-01",
    purchaseValue: 599,
    history: [
      { id: "h-014", action: "created", date: "2019-07-01", performedBy: "Admin", description: "Purchased from Fouani Nigeria" },
      { id: "h-015", action: "decommissioned", date: "2025-11-01", performedBy: "Chidinma Okeke", description: "Lamp life expired" },
    ],
  },
];
