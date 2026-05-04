import type { Employee } from "./hr.types";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface MyProfile extends Employee {
  emergencyContact: EmergencyContact;
  bankAccount: BankAccount;
  address: Address;
}

export interface Payslip {
  id: string;
  period: string;
  gross: number;
  deductions: number;
  net: number;
  paidDate: string;
  downloadUrl: string;
}

export type LeaveBalanceType =
  | "annual"
  | "sick"
  | "maternity"
  | "paternity"
  | "compassionate";

export interface LeaveBalance {
  type: LeaveBalanceType;
  total: number;
  used: number;
  remaining: number;
}

export type AssetCondition = "excellent" | "good" | "fair";

export interface MyAsset {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  assignedDate: string;
  condition: AssetCondition;
}
