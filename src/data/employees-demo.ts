import type { EmployeeRow } from "@/src/lib/types/employees";

export const DEPT_OPTIONS = [
  "all",
  "Engineering",
  "HR",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "Design",
  "Product",
  "Legal",
  "Customer Success",
];

export {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
} from "@/src/lib/constants/employment-types";

export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_leave: "On Leave",
  probation: "Probation",
  offboarding: "Offboarding Notice",
  pending: "Pending",
  onboarded: "Onboarded",
  inactive: "Inactive",
  deleted: "Deleted",
};

export const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  on_leave: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  probation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  offboarding: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  pending: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  onboarded: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  inactive: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  deleted: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export const EMPLOYEES: EmployeeRow[] = [
  { id: "emp-001", name: "Adaeze Okonkwo", initials: "AO", email: "adaeze.okonkwo@motee.ng", phone: "+234-801-234-5678", department: "Engineering", jobTitle: "Senior Software Engineer", employmentType: "full_time", status: "active", startDate: "2021-04-15", salary: 850000, managerId: null, managerName: null, dateOfBirth: "1990-07-22", gender: "female", nationality: "Nigerian", maritalStatus: "married", address: "14 Adeola Odeku Street", state: "Lagos", country: "Nigeria", workMode: "Hybrid", workLocation: "Lagos HQ", grade: "L4", bankName: "GTBank", bankAccountNumber: "0123456789", bankAccountName: "Adaeze Okonkwo", emergencyContactName: "Chukwuemeka Okonkwo", emergencyContactRelationship: "Spouse", emergencyContactPhone: "+234-801-999-1111", ninNumber: "12345678901", taxId: "TIN-20190001", pensionId: "PFA-AO-00123", nhfNumber: "NHF-20210001" },
  { id: "emp-002", name: "Chukwuemeka Eze", initials: "CE", email: "chukwuemeka.eze@motee.ng", phone: "+234-802-345-6789", department: "Engineering", jobTitle: "Backend Engineer", employmentType: "full_time", status: "active", startDate: "2022-01-10", salary: 650000, managerId: "emp-001", managerName: "Adaeze Okonkwo", dateOfBirth: "1993-03-11", gender: "male", nationality: "Nigerian", maritalStatus: "single", address: "22 Bourdillon Road, Ikoyi", state: "Lagos", country: "Nigeria", workMode: "At Office", workLocation: "Lagos HQ", grade: "L3", bankName: "Zenith Bank", bankAccountNumber: "2109876543", bankAccountName: "Chukwuemeka Eze", emergencyContactName: "Ngozi Eze", emergencyContactRelationship: "Mother", emergencyContactPhone: "+234-802-888-2222", ninNumber: "23456789012", taxId: "TIN-20220002", pensionId: "PFA-CE-00234", nhfNumber: "NHF-20220002", passportNumber: "A12345678", passportExpiry: "2029-06-30", passportCountry: "Nigeria" },
  { id: "emp-003", name: "Fatima Al-Hassan", initials: "FA", email: "fatima.alhassan@motee.ng", phone: "+234-803-456-7890", department: "Engineering", jobTitle: "Frontend Engineer", employmentType: "full_time", status: "on_leave", startDate: "2022-06-01", salary: 600000, managerId: "emp-001", managerName: "Adaeze Okonkwo", dateOfBirth: "1994-12-05", gender: "female", nationality: "Nigerian", maritalStatus: "single", address: "5 Wuse Zone 4", state: "Abuja", country: "Nigeria", workMode: "Remotely", workLocation: "Remote", grade: "L3", bankName: "First Bank", bankAccountNumber: "3012345678", bankAccountName: "Fatima Al-Hassan", emergencyContactName: "Musa Al-Hassan", emergencyContactRelationship: "Father", emergencyContactPhone: "+234-803-777-3333", ninNumber: "34567890123", taxId: "TIN-20220003", pensionId: "PFA-FA-00345", nhfNumber: "NHF-20220003" },
  { id: "emp-004", name: "Babatunde Adeyemi", initials: "BA", email: "babatunde.adeyemi@motee.ng", phone: "+234-804-567-8901", department: "Engineering", jobTitle: "DevOps Engineer", employmentType: "full_time", status: "active", startDate: "2023-03-20", salary: 720000, managerId: "emp-001", managerName: "Adaeze Okonkwo", dateOfBirth: "1991-09-18", gender: "male", nationality: "Nigerian", maritalStatus: "married", address: "8 Awolowo Way, Ikeja", state: "Lagos", country: "Nigeria", workMode: "Hybrid", workLocation: "Lagos HQ", grade: "L3", bankName: "Access Bank", bankAccountNumber: "4023456789", bankAccountName: "Babatunde Adeyemi", emergencyContactName: "Kemi Adeyemi", emergencyContactRelationship: "Spouse", emergencyContactPhone: "+234-804-666-4444", ninNumber: "45678901234", taxId: "TIN-20230004", pensionId: "PFA-BA-00456", nhfNumber: "NHF-20230004", driverLicenseNumber: "LG-23456789" },
  { id: "emp-005", name: "Ngozi Obi", initials: "NO", email: "ngozi.obi@motee.ng", phone: "+234-805-678-9012", department: "Engineering", jobTitle: "QA Engineer", employmentType: "contract", status: "active", startDate: "2023-08-01", salary: 450000, managerId: "emp-001", managerName: "Adaeze Okonkwo", dateOfBirth: "1995-02-28", gender: "female", nationality: "Nigerian", maritalStatus: "single", address: "11 Trans-Amadi Layout", state: "Rivers", country: "Nigeria", workMode: "At Office", workLocation: "Port Harcourt Office", grade: "L2", bankName: "UBA", bankAccountNumber: "5034567890", bankAccountName: "Ngozi Obi", emergencyContactName: "Chidi Obi", emergencyContactRelationship: "Brother", emergencyContactPhone: "+234-805-555-5555", ninNumber: "56789012345", taxId: "TIN-20230005", pensionId: "PFA-NO-00567" },
  { id: "emp-006", name: "Emeka Nwosu", initials: "EN", email: "emeka.nwosu@motee.ng", phone: "+234-806-789-0123", department: "Engineering", jobTitle: "Mobile Engineer", employmentType: "full_time", status: "probation", startDate: "2026-01-15", salary: 500000, managerId: "emp-001", managerName: "Adaeze Okonkwo", dateOfBirth: "1997-06-14", gender: "male", nationality: "Nigerian", maritalStatus: "single", address: "3 Ring Road", state: "Anambra", country: "Nigeria", workMode: "At Office", workLocation: "Lagos HQ", grade: "L2", bankName: "Polaris Bank", bankAccountNumber: "6045678901", bankAccountName: "Emeka Nwosu", emergencyContactName: "Obiora Nwosu", emergencyContactRelationship: "Father", emergencyContactPhone: "+234-806-444-6666", ninNumber: "67890123456", taxId: "TIN-20260006", pensionId: "PFA-EN-00678" },
  { id: "emp-007", name: "Chidinma Okeke", initials: "CO", email: "chidinma.okeke@motee.ng", phone: "+234-807-890-1234", department: "HR", jobTitle: "HR Manager", employmentType: "full_time", status: "active", startDate: "2020-09-01", salary: 580000, managerId: null, managerName: null, dateOfBirth: "1988-11-30", gender: "female", nationality: "Nigerian", maritalStatus: "married", address: "20 Gwarinpa Estate", state: "Abuja", country: "Nigeria", workMode: "At Office", workLocation: "Abuja HQ", grade: "M2", bankName: "GTBank", bankAccountNumber: "7056789012", bankAccountName: "Chidinma Okeke", emergencyContactName: "Ifeanyi Okeke", emergencyContactRelationship: "Spouse", emergencyContactPhone: "+234-807-333-7777", ninNumber: "78901234567", taxId: "TIN-20200007", pensionId: "PFA-CO-00789", nhfNumber: "NHF-20200007" },
  { id: "emp-008", name: "Yusuf Garba", initials: "YG", email: "yusuf.garba@motee.ng", phone: "+234-808-901-2345", department: "HR", jobTitle: "HR Officer", employmentType: "full_time", status: "active", startDate: "2023-01-10", salary: 320000, managerId: "emp-007", managerName: "Chidinma Okeke", dateOfBirth: "1996-04-07", gender: "male", nationality: "Nigerian", maritalStatus: "single", address: "7 Nomansland Road, Kano", state: "Kano", country: "Nigeria", workMode: "At Office", workLocation: "Abuja HQ", grade: "L2", bankName: "Diamond Bank", bankAccountNumber: "8067890123", bankAccountName: "Yusuf Garba", emergencyContactName: "Halima Garba", emergencyContactRelationship: "Mother", emergencyContactPhone: "+234-808-222-8888", ninNumber: "89012345678", taxId: "TIN-20230008", pensionId: "PFA-YG-00890" },
  { id: "emp-009", name: "Amaka Chukwu", initials: "AC", email: "amaka.chukwu@motee.ng", phone: "+234-809-012-3456", department: "HR", jobTitle: "Talent Acquisition Specialist", employmentType: "full_time", status: "active", startDate: "2023-07-15", salary: 350000, managerId: "emp-007", managerName: "Chidinma Okeke", dateOfBirth: "1995-08-25", gender: "female", nationality: "Nigerian", maritalStatus: "single", address: "15 GRA Phase 2, Enugu", state: "Enugu", country: "Nigeria", workMode: "Hybrid", workLocation: "Abuja HQ", grade: "L2", bankName: "Stanbic IBTC", bankAccountNumber: "9078901234", bankAccountName: "Amaka Chukwu", emergencyContactName: "Obiageli Chukwu", emergencyContactRelationship: "Mother", emergencyContactPhone: "+234-809-111-9999", ninNumber: "90123456789", taxId: "TIN-20230009", pensionId: "PFA-AC-00901" },
  { id: "emp-010", name: "Oluwaseun Afolabi", initials: "OA", email: "oluwaseun.afolabi@motee.ng", phone: "+234-810-123-4567", department: "Finance", jobTitle: "Chief Financial Officer", employmentType: "full_time", status: "active", startDate: "2019-05-01", salary: 980000, managerId: null, managerName: null, dateOfBirth: "1985-01-15", gender: "male", nationality: "Nigerian", maritalStatus: "married", address: "4 Osborne Road, Ikoyi", state: "Lagos", country: "Nigeria", workMode: "At Office", workLocation: "Lagos HQ", grade: "S2", bankName: "GTBank", bankAccountNumber: "1089012345", bankAccountName: "Oluwaseun Afolabi", emergencyContactName: "Titi Afolabi", emergencyContactRelationship: "Spouse", emergencyContactPhone: "+234-810-000-1010", ninNumber: "01234567890", taxId: "TIN-20190010", pensionId: "PFA-OA-01012", nhfNumber: "NHF-20190010", passportNumber: "B98765432", passportExpiry: "2028-03-15", passportCountry: "Nigeria", driverLicenseNumber: "LG-98765432" },
  { id: "emp-011", name: "Blessing Okafor", initials: "BO", email: "blessing.okafor@motee.ng", phone: "+234-811-234-5678", department: "Finance", jobTitle: "Finance Analyst", employmentType: "full_time", status: "active", startDate: "2022-04-10", salary: 420000, managerId: "emp-010", managerName: "Oluwaseun Afolabi" },
  { id: "emp-012", name: "Musa Ibrahim", initials: "MI", email: "musa.ibrahim@motee.ng", phone: "+234-812-345-6789", department: "Finance", jobTitle: "Accountant", employmentType: "full_time", status: "active", startDate: "2021-11-20", salary: 380000, managerId: "emp-010", managerName: "Oluwaseun Afolabi" },
  { id: "emp-013", name: "Ifeoma Nwachukwu", initials: "IN", email: "ifeoma.nwachukwu@motee.ng", phone: "+234-813-456-7890", department: "Finance", jobTitle: "Payroll Officer", employmentType: "full_time", status: "on_leave", startDate: "2022-09-01", salary: 360000, managerId: "emp-010", managerName: "Oluwaseun Afolabi" },
  { id: "emp-014", name: "Tunde Fashola", initials: "TF", email: "tunde.fashola@motee.ng", phone: "+234-814-567-8901", department: "Marketing", jobTitle: "Marketing Director", employmentType: "full_time", status: "active", startDate: "2020-02-14", salary: 750000, managerId: null, managerName: null },
  { id: "emp-015", name: "Aisha Bello", initials: "AB", email: "aisha.bello@motee.ng", phone: "+234-815-678-9012", department: "Marketing", jobTitle: "Brand Manager", employmentType: "full_time", status: "active", startDate: "2022-08-01", salary: 480000, managerId: "emp-014", managerName: "Tunde Fashola" },
  { id: "emp-016", name: "Kelechi Onyekachi", initials: "KO", email: "kelechi.onyekachi@motee.ng", phone: "+234-816-789-0123", department: "Marketing", jobTitle: "Digital Marketing Specialist", employmentType: "part_time", status: "active", startDate: "2023-05-01", salary: 280000, managerId: "emp-014", managerName: "Tunde Fashola" },
  { id: "emp-017", name: "Folake Adeleke", initials: "FA", email: "folake.adeleke@motee.ng", phone: "+234-817-890-1234", department: "Operations", jobTitle: "Operations Manager", employmentType: "full_time", status: "active", startDate: "2020-10-15", salary: 620000, managerId: null, managerName: null },
  { id: "emp-018", name: "Sodiq Olawale", initials: "SO", email: "sodiq.olawale@motee.ng", phone: "+234-818-901-2345", department: "Operations", jobTitle: "Business Analyst", employmentType: "full_time", status: "active", startDate: "2023-02-01", salary: 410000, managerId: "emp-017", managerName: "Folake Adeleke" },
  { id: "emp-019", name: "Chiamaka Eze", initials: "CE", email: "chiamaka.eze@motee.ng", phone: "+234-819-012-3456", department: "Operations", jobTitle: "Project Coordinator", employmentType: "full_time", status: "active", startDate: "2023-09-10", salary: 340000, managerId: "emp-017", managerName: "Folake Adeleke" },
  { id: "emp-020", name: "Abdullahi Musa", initials: "AM", email: "abdullahi.musa@motee.ng", phone: "+234-820-123-4567", department: "Operations", jobTitle: "Logistics Officer", employmentType: "contract", status: "active", startDate: "2024-01-05", salary: 250000, managerId: "emp-017", managerName: "Folake Adeleke" },
];
