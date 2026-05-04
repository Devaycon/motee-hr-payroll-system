export type EmploymentType = "full_time" | "part_time" | "contract";
export type EmployeeStatus = "active" | "on_leave" | "probation";

export interface EmployeeRow {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  startDate: string;
  salary: number;
  managerId: string | null;
  managerName: string | null;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  bloodType?: string;
  address?: string;
  state?: string;
  country?: string;
  workMode?: string;
  workLocation?: string;
  grade?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  ninNumber?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  driverLicenseNumber?: string;
  taxId?: string;
  pensionId?: string;
  nhfNumber?: string;
}

export interface NewEmployee {
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  startDate: string;
  salary: string;
  managerId: string;
}
