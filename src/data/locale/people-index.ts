/**
 * GENERATED from src/data/locale/{uk,nigeria}.json — the active employees of
 * each demo tenant, small enough to import synchronously.
 *
 * Used by `localiseDemoInPlace` to replace the people named in the static
 * `src/data/*-demo.ts` fixtures with the active country's own employees, so a
 * UK screen never shows a Nigerian employee (or the other way round). The
 * full bundles are 2.5 MB each and stay lazily loaded.
 *
 * Regenerate if the bundles' employees change.
 */
export interface IndexedPerson {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  initials: string;
  departmentName: string;
  jobTitle: string;
}

export const PEOPLE_INDEX: Record<"uk" | "ng", { people: IndexedPerson[]; cities: string[] }> = {
  "uk": {
    "people": [
      {
        "id": "GB-EMP-0003",
        "fullName": "Jack Thomas",
        "firstName": "Jack",
        "lastName": "Thomas",
        "initials": "JT",
        "departmentName": "Operations & Fleet",
        "jobTitle": "Head of Operations"
      },
      {
        "id": "GB-EMP-0004",
        "fullName": "Charlie Khan",
        "firstName": "Charlie",
        "lastName": "Khan",
        "initials": "CK",
        "departmentName": "Operations & Fleet",
        "jobTitle": "Fleet Manager"
      },
      {
        "id": "GB-EMP-0005",
        "fullName": "Oliver Thomas",
        "firstName": "Oliver",
        "lastName": "Thomas",
        "initials": "OT",
        "departmentName": "Operations & Fleet",
        "jobTitle": "Logistics Coordinator"
      },
      {
        "id": "GB-EMP-0006",
        "fullName": "George Hall",
        "firstName": "George",
        "lastName": "Hall",
        "initials": "GH",
        "departmentName": "Operations & Fleet",
        "jobTitle": "Warehouse Supervisor"
      },
      {
        "id": "GB-EMP-0007",
        "fullName": "Charlie Hall",
        "firstName": "Charlie",
        "lastName": "Hall",
        "initials": "CH",
        "departmentName": "Operations & Fleet",
        "jobTitle": "Driver Lead"
      },
      {
        "id": "GB-EMP-0008",
        "fullName": "Emily Williams",
        "firstName": "Emily",
        "lastName": "Williams",
        "initials": "EW",
        "departmentName": "Operations & Fleet",
        "jobTitle": "Route Planner"
      },
      {
        "id": "GB-EMP-0009",
        "fullName": "Joshua Wood",
        "firstName": "Joshua",
        "lastName": "Wood",
        "initials": "JW",
        "departmentName": "Engineering & Platform",
        "jobTitle": "VP Engineering"
      },
      {
        "id": "GB-EMP-0010",
        "fullName": "Harry Patel",
        "firstName": "Harry",
        "lastName": "Patel",
        "initials": "HP",
        "departmentName": "Engineering & Platform",
        "jobTitle": "Senior Backend Engineer"
      },
      {
        "id": "GB-EMP-0011",
        "fullName": "Joshua Hall",
        "firstName": "Joshua",
        "lastName": "Hall",
        "initials": "JH",
        "departmentName": "Engineering & Platform",
        "jobTitle": "Senior Frontend Engineer"
      },
      {
        "id": "GB-EMP-0012",
        "fullName": "Priya Taylor",
        "firstName": "Priya",
        "lastName": "Taylor",
        "initials": "PT",
        "departmentName": "Engineering & Platform",
        "jobTitle": "DevOps Engineer"
      },
      {
        "id": "GB-EMP-0013",
        "fullName": "Thomas Thomas",
        "firstName": "Thomas",
        "lastName": "Thomas",
        "initials": "TT",
        "departmentName": "Finance & Accounting",
        "jobTitle": "Finance Director"
      },
      {
        "id": "GB-EMP-0014",
        "fullName": "Ella Walker",
        "firstName": "Ella",
        "lastName": "Walker",
        "initials": "EW",
        "departmentName": "Finance & Accounting",
        "jobTitle": "Senior Accountant"
      },
      {
        "id": "GB-EMP-0015",
        "fullName": "Priya Williams",
        "firstName": "Priya",
        "lastName": "Williams",
        "initials": "PW",
        "departmentName": "Finance & Accounting",
        "jobTitle": "Payroll Specialist"
      },
      {
        "id": "GB-EMP-0016",
        "fullName": "William Jones",
        "firstName": "William",
        "lastName": "Jones",
        "initials": "WJ",
        "departmentName": "People & Culture",
        "jobTitle": "HR Admin"
      },
      {
        "id": "GB-EMP-0017",
        "fullName": "Harry Brown",
        "firstName": "Harry",
        "lastName": "Brown",
        "initials": "HB",
        "departmentName": "People & Culture",
        "jobTitle": "HR Business Partner"
      },
      {
        "id": "GB-EMP-0018",
        "fullName": "Oliver Hughes",
        "firstName": "Oliver",
        "lastName": "Hughes",
        "initials": "OH",
        "departmentName": "Sales & Partnerships",
        "jobTitle": "Head of Sales"
      },
      {
        "id": "GB-EMP-0019",
        "fullName": "Mia Wilson",
        "firstName": "Mia",
        "lastName": "Wilson",
        "initials": "MW",
        "departmentName": "Sales & Partnerships",
        "jobTitle": "Account Executive"
      },
      {
        "id": "GB-EMP-0020",
        "fullName": "Harry Khan",
        "firstName": "Harry",
        "lastName": "Khan",
        "initials": "HK",
        "departmentName": "Customer Experience",
        "jobTitle": "CX Manager"
      }
    ],
    "cities": [
      "London",
      "Manchester",
      "Birmingham",
      "Bristol",
      "Leeds",
      "Edinburgh"
    ]
  },
  "ng": {
    "people": [
      {
        "id": "NG-EMP-0003",
        "fullName": "Chinedu Olawale",
        "firstName": "Chinedu",
        "lastName": "Olawale",
        "initials": "CO",
        "departmentName": "Executive Office",
        "jobTitle": "Chief Financial Officer"
      },
      {
        "id": "NG-EMP-0004",
        "fullName": "Tochukwu Lawal",
        "firstName": "Tochukwu",
        "lastName": "Lawal",
        "initials": "TL",
        "departmentName": "Engineering",
        "jobTitle": "VP Engineering"
      },
      {
        "id": "NG-EMP-0005",
        "fullName": "Ngozi Mohammed",
        "firstName": "Ngozi",
        "lastName": "Mohammed",
        "initials": "NM",
        "departmentName": "Engineering",
        "jobTitle": "Engineering Manager"
      },
      {
        "id": "NG-EMP-0006",
        "fullName": "Yusuf Nwosu",
        "firstName": "Yusuf",
        "lastName": "Nwosu",
        "initials": "YN",
        "departmentName": "Engineering",
        "jobTitle": "Senior Backend Engineer"
      },
      {
        "id": "NG-EMP-0007",
        "fullName": "Ibrahim Adeyemi",
        "firstName": "Ibrahim",
        "lastName": "Adeyemi",
        "initials": "IA",
        "departmentName": "Engineering",
        "jobTitle": "Senior Frontend Engineer"
      },
      {
        "id": "NG-EMP-0008",
        "fullName": "Folake Nwosu",
        "firstName": "Folake",
        "lastName": "Nwosu",
        "initials": "FN",
        "departmentName": "Engineering",
        "jobTitle": "DevOps Engineer"
      },
      {
        "id": "NG-EMP-0009",
        "fullName": "Femi Sanusi",
        "firstName": "Femi",
        "lastName": "Sanusi",
        "initials": "FS",
        "departmentName": "Engineering",
        "jobTitle": "Junior Engineer"
      },
      {
        "id": "NG-EMP-0010",
        "fullName": "Emeka Abubakar",
        "firstName": "Emeka",
        "lastName": "Abubakar",
        "initials": "EA",
        "departmentName": "Product & Design",
        "jobTitle": "Head of Product"
      },
      {
        "id": "NG-EMP-0011",
        "fullName": "Adaeze Okonkwo",
        "firstName": "Adaeze",
        "lastName": "Okonkwo",
        "initials": "AO",
        "departmentName": "Product & Design",
        "jobTitle": "Senior Product Manager"
      },
      {
        "id": "NG-EMP-0012",
        "fullName": "Chinedu Sanusi",
        "firstName": "Chinedu",
        "lastName": "Sanusi",
        "initials": "CS",
        "departmentName": "Product & Design",
        "jobTitle": "Product Designer"
      },
      {
        "id": "NG-EMP-0013",
        "fullName": "Ngozi Adebayo",
        "firstName": "Ngozi",
        "lastName": "Adebayo",
        "initials": "NA",
        "departmentName": "Risk & Compliance",
        "jobTitle": "Head of Risk & Compliance"
      },
      {
        "id": "NG-EMP-0014",
        "fullName": "Amaka Afolayan",
        "firstName": "Amaka",
        "lastName": "Afolayan",
        "initials": "AA",
        "departmentName": "Risk & Compliance",
        "jobTitle": "Compliance Officer"
      },
      {
        "id": "NG-EMP-0015",
        "fullName": "Nneka Sanusi",
        "firstName": "Nneka",
        "lastName": "Sanusi",
        "initials": "NS",
        "departmentName": "Risk & Compliance",
        "jobTitle": "AML Analyst"
      },
      {
        "id": "NG-EMP-0016",
        "fullName": "Yusuf Eze",
        "firstName": "Yusuf",
        "lastName": "Eze",
        "initials": "YE",
        "departmentName": "Finance & Treasury",
        "jobTitle": "Senior Accountant"
      },
      {
        "id": "NG-EMP-0017",
        "fullName": "Chinedu Lawal",
        "firstName": "Chinedu",
        "lastName": "Lawal",
        "initials": "CL",
        "departmentName": "People Operations",
        "jobTitle": "HR Admin"
      },
      {
        "id": "NG-EMP-0018",
        "fullName": "Femi Ogundimu",
        "firstName": "Femi",
        "lastName": "Ogundimu",
        "initials": "FO",
        "departmentName": "Growth & Marketing",
        "jobTitle": "Head of Growth"
      },
      {
        "id": "NG-EMP-0019",
        "fullName": "Folake Ibrahim",
        "firstName": "Folake",
        "lastName": "Ibrahim",
        "initials": "FI",
        "departmentName": "Growth & Marketing",
        "jobTitle": "Performance Marketer"
      },
      {
        "id": "NG-EMP-0020",
        "fullName": "Zainab Uche",
        "firstName": "Zainab",
        "lastName": "Uche",
        "initials": "ZU",
        "departmentName": "Customer Support",
        "jobTitle": "Support Manager"
      }
    ],
    "cities": [
      "Lagos",
      "Abuja",
      "Port Harcourt",
      "Ibadan",
      "Kano",
      "Enugu"
    ]
  }
};
