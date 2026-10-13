import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildSetupTemplate, parseSetupFile } from "./bulk-template";
import { COMPANY_SIZES } from "@/src/lib/types/onboarding-setup.types";

/** The template as an uploaded .xlsx, with some "Your value" cells changed. */
function templateFile(changes: Record<string, string> = {}): File {
  const book = buildSetupTemplate();
  const sheet = book.Sheets.Setup;
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  for (const [label, value] of Object.entries(changes)) {
    const row = rows.findIndex((cells) => cells[1] === label);
    if (row === -1) throw new Error(`No template row called "${label}"`);
    sheet[XLSX.utils.encode_cell({ r: row, c: 2 })] = { t: "s", v: value };
  }
  const bytes = XLSX.write(book, { type: "array", bookType: "xlsx" });
  return new File([bytes], "setup.xlsx");
}

describe("parseSetupFile", () => {
  it("accepts the template exactly as downloaded", async () => {
    const { setup, errors } = await parseSetupFile(templateFile());

    expect(errors).toEqual([]);
    expect(setup.companyProfile).toMatchObject({
      industry: "Technology",
      companySize: COMPANY_SIZES[2],
      companyEmailDomain: "acme.com",
    });
    expect(setup.organizationConfig).toEqual({
      managerTitle: "Line Manager",
      departmentLabel: "Department",
      structureType: "hierarchical",
    });
    expect(setup.enabledModules).toEqual([
      "employee-management",
      "attendance",
      "leave-management",
    ]);
  });

  it("covers only the wizard's three steps", async () => {
    const sections = XLSX.utils
      .sheet_to_json<string[]>(buildSetupTemplate().Sheets.Setup, { header: 1 })
      .slice(1)
      .map((cells) => cells[0]);
    const { setup } = await parseSetupFile(templateFile());

    expect([...new Set(sections)]).toEqual([
      "Company Profile",
      "Structure",
      "Modules",
    ]);
    expect(setup).not.toHaveProperty("accessControlConfig");
    expect(setup).not.toHaveProperty("workflowConfig");
  });

  it("leaves the company name and country alone", async () => {
    const { setup } = await parseSetupFile(templateFile());

    expect(setup.companyProfile).not.toHaveProperty("companyName");
    expect(setup.companyProfile).not.toHaveProperty("country");
  });

  it("matches dropdown values loosely and stores what the wizard stores", async () => {
    const { setup, errors } = await parseSetupFile(
      templateFile({
        "Company Size": "200-500",
        "Structure Type": " MATRIX ",
        "Module: Payroll": "y",
        "Module: Benefits": "TRUE",
        "Supervisor Title": "Head of Unit",
      }),
    );

    expect(errors).toEqual([]);
    expect(setup.companyProfile?.companySize).toBe(COMPANY_SIZES[3]);
    expect(setup.organizationConfig).toMatchObject({
      structureType: "matrix",
      managerTitle: "Head of Unit",
    });
    expect(setup.enabledModules).toContain("payroll");
    expect(setup.enabledModules).toContain("benefits");
  });

  it("reports values that are not in a dropdown, with what is allowed", async () => {
    const { errors } = await parseSetupFile(
      templateFile({
        Industry: "Banana",
        "Module: Attendance": "maybe",
      }),
    );

    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('Industry: "Banana" is not an option');
    expect(errors[0]).toContain("Technology");
    expect(errors[1]).toContain("should be Yes or No");
  });

  it("requires an industry, a company size and at least one module", async () => {
    const { errors } = await parseSetupFile(
      templateFile({
        Industry: "",
        "Company Size": "",
        "Module: Employee Management": "No",
        "Module: Attendance": "No",
        "Module: Leave Management": "No",
      }),
    );

    expect(errors).toEqual([
      "Industry: this is required.",
      "Company Size: this is required.",
      "Modules: switch on at least one module with Yes.",
    ]);
  });

  it("only offers the modules the server can switch on", async () => {
    const book = buildSetupTemplate(["attendance"]);
    const labels = XLSX.utils
      .sheet_to_json<string[]>(book.Sheets.Setup, { header: 1 })
      .map((cells) => cells[1])
      .filter((label) => label?.startsWith("Module:"));

    expect(labels).toEqual(["Module: Attendance"]);
  });

  it("reads the template saved as CSV", async () => {
    const csv = XLSX.utils.sheet_to_csv(buildSetupTemplate().Sheets.Setup);
    const { setup, errors } = await parseSetupFile(
      new File([csv], "setup.csv"),
    );

    expect(errors).toEqual([]);
    expect(setup.companyProfile?.companySize).toBe(COMPANY_SIZES[2]);
    expect(setup.enabledModules).toHaveLength(3);
  });

  it("rejects a file that is not the template", async () => {
    const { errors } = await parseSetupFile(
      new File(["name,email\nAda,ada@example.com"], "people.csv"),
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("does not look like the setup template");
  });
});
