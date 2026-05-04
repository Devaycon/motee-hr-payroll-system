export type AssetStatus =
  | "assigned"
  | "available"
  | "under_maintenance"
  | "decommissioned";

export type AssetCondition =
  | "new"
  | "good"
  | "fair"
  | "damaged"
  | "decommissioned";

export type AssetType =
  | "laptop"
  | "desktop"
  | "monitor"
  | "phone"
  | "tablet"
  | "printer"
  | "keyboard"
  | "mouse"
  | "headset"
  | "camera"
  | "other";

export type AssetHistoryAction =
  | "created"
  | "assigned"
  | "returned"
  | "maintenance_scheduled"
  | "maintenance_completed"
  | "condition_updated"
  | "decommissioned";

export interface AssetHistoryEntry {
  id: string;
  action: AssetHistoryAction;
  date: string;
  description: string;
  performedBy: string;
  previousValue?: string;
  newValue?: string;
}

export interface Asset {
  id: string;
  name: string;
  assetType: AssetType;
  serialNumber: string;
  condition: AssetCondition;
  conditionNotes?: string;
  status: AssetStatus;
  assignedTo?: string;
  assignedToInitials?: string;
  assignedToDepartment?: string;
  assignedDate?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  pendingReturn?: boolean;
  history: AssetHistoryEntry[];
}

export interface NewAsset {
  name: string;
  assetType: AssetType;
  serialNumber: string;
  condition: AssetCondition;
  conditionNotes?: string;
  status: AssetStatus;
  assignedTo?: string;
  assignedToInitials?: string;
  assignedToDepartment?: string;
  assignedDate?: string;
  purchaseDate?: string;
  purchaseValue?: number;
}
