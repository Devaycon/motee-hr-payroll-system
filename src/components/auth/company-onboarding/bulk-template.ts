import * as XLSX from "xlsx";
import {
  AVAILABLE_MODULES,
  COMPANY_SIZES,
  DEFAULT_COMPANY_SETUP,
  DEPARTMENT_LABELS,
  INDUSTRIES,
  MANAGER_TITLES,
  type CompanySetupPrefill,
  type OrganizationConfig,
} from "@/src/lib/types/onboarding-setup.types";

const SHEET_NAME = "Setup";
const TEMPLATE_FILE_NAME = "motee-company-setup-template.xlsx";
const HEADER = ["Section", "Field", "Your value", "Allowed values / notes"];
const NOT_A_TEMPLATE =
  "This file does not look like the setup template. Download the template and fill in the \"Your value\" column.";

/** What the file has filled in so far, before it is shaped for the store. */
interface Draft {
  companyProfile: NonNullable<CompanySetupPrefill["companyProfile"]>;
  organizationConfig: NonNullable<CompanySetupPrefill["organizationConfig"]>;
  modules: string[];
}

interface Choice {
  /** What the wizard stores. */
  value: string;
  /** What the wizard shows, and what the template asks for. */
  label: string;
}

interface FieldBase {
  section: string;
  /** The row's name in the template; rows are found again by it on upload. */
  label: string;
  example: string;
  note?: string;
  required?: boolean;
}

/** One row of the template, and where its value lands in the wizard. */
type Field = FieldBase &
  (
    | { kind: "text"; set: (draft: Draft, value: string) => void }
    | {
        kind: "choice";
        choices: Choice[];
        set: (draft: Draft, value: string) => void;
      }
    | { kind: "yesno"; set: (draft: Draft, value: boolean) => void }
  );

const yesNo = (value: boolean) => (value ? "Yes" : "No");
const withoutCustom = (options: string[]) =>
  options.filter((option) => option !== "Custom");

/**
 * The template's rows, in wizard order. Choices are the same lists the
 * wizard's own dropdowns use, so an uploaded value is always a selectable one.
 */
function buildFields(offeredModuleIds?: string[]): Field[] {
  const modules = AVAILABLE_MODULES.filter(
    (mod) => !offeredModuleIds || offeredModuleIds.includes(mod.id),
  );

  return [
    {
      section: "Company Profile",
      label: "Industry",
      kind: "choice",
      required: true,
      choices: INDUSTRIES.map((industry) => ({
        value: industry,
        label: industry,
      })),
      example: INDUSTRIES[0],
      set: (draft, value) => {
        draft.companyProfile.industry = value;
      },
    },
    {
      section: "Company Profile",
      label: "Company Size",
      kind: "choice",
      required: true,
      choices: COMPANY_SIZES.map((size) => ({
        value: size,
        label: `${size} employees`,
      })),
      example: `${COMPANY_SIZES[2]} employees`,
      set: (draft, value) => {
        draft.companyProfile.companySize = value;
      },
    },
    {
      section: "Company Profile",
      label: "Company Email Domain",
      kind: "text",
      example: "acme.com",
      note: "Without the @, e.g. acme.com",
      set: (draft, value) => {
        draft.companyProfile.companyEmailDomain = value.replace(/^@/, "");
      },
    },
    {
      section: "Company Profile",
      label: "Company Description",
      kind: "text",
      example: "",
      note: "Optional",
      set: (draft, value) => {
        draft.companyProfile.companyPolicies = value;
      },
    },
    {
      section: "Structure",
      label: "Supervisor Title",
      kind: "text",
      example: DEFAULT_COMPANY_SETUP.organizationConfig.managerTitle,
      note: `What you call a supervisor. Suggestions: ${withoutCustom(MANAGER_TITLES).join(", ")} — or type your own`,
      set: (draft, value) => {
        draft.organizationConfig.managerTitle = value;
      },
    },
    {
      section: "Structure",
      label: "Department Label",
      kind: "text",
      example: DEFAULT_COMPANY_SETUP.organizationConfig.departmentLabel,
      note: `What you call a department or team. Suggestions: ${withoutCustom(DEPARTMENT_LABELS).join(", ")} — or type your own`,
      set: (draft, value) => {
        draft.organizationConfig.departmentLabel = value;
      },
    },
    {
      section: "Structure",
      label: "Structure Type",
      kind: "choice",
      choices: [
        { value: "hierarchical", label: "Hierarchical" },
        { value: "flat", label: "Flat" },
        { value: "matrix", label: "Matrix" },
      ],
      example: "Hierarchical",
      set: (draft, value) => {
        draft.organizationConfig.structureType =
          value as OrganizationConfig["structureType"];
      },
    },
    ...modules.map(
      (mod, index): Field => ({
        section: "Modules",
        label: `Module: ${mod.label}`,
        kind: "yesno",
        example: yesNo(index < 3),
        note: mod.description,
        set: (draft, value) => {
          if (value) draft.modules.push(mod.id);
        },
      }),
    ),
  ];
}

/** The "Allowed values / notes" cell for a row. */
function describe(field: Field): string {
  const allowed =
    field.kind === "choice"
      ? field.choices.map((choice) => choice.label).join(" | ")
      : field.kind === "yesno"
        ? "Yes | No"
        : "";
  return [allowed, field.note].filter(Boolean).join(" — ");
}

/**
 * The setup template as a workbook. `offeredModuleIds` limits the module rows
 * to what the server can switch on.
 */
export function buildSetupTemplate(offeredModuleIds?: string[]): XLSX.WorkBook {
  const fields = buildFields(offeredModuleIds);

  const setup = XLSX.utils.aoa_to_sheet([
    HEADER,
    ...fields.map((field) => [
      field.section,
      field.label,
      field.example,
      describe(field),
    ]),
  ]);
  setup["!cols"] = [{ wch: 20 }, { wch: 34 }, { wch: 30 }, { wch: 90 }];

  // Every list in full, one per column, for reference while filling in.
  const lists = [
    ...fields.flatMap((field) =>
      field.kind === "choice"
        ? [
            {
              title: field.label,
              values: field.choices.map((choice) => choice.label),
            },
          ]
        : [],
    ),
    {
      title: "Supervisor Title (suggestions)",
      values: withoutCustom(MANAGER_TITLES),
    },
    {
      title: "Department Label (suggestions)",
      values: withoutCustom(DEPARTMENT_LABELS),
    },
  ];
  const longest = Math.max(...lists.map((list) => list.values.length));
  const options = XLSX.utils.aoa_to_sheet([
    lists.map((list) => list.title),
    ...Array.from({ length: longest }, (_, row) =>
      lists.map((list) => list.values[row] ?? ""),
    ),
  ]);
  options["!cols"] = lists.map(() => ({ wch: 32 }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, setup, SHEET_NAME);
  XLSX.utils.book_append_sheet(book, options, "Options");
  return book;
}

/** Builds the setup template and hands it to the browser. */
export function downloadSetupTemplate(offeredModuleIds?: string[]): void {
  XLSX.writeFile(buildSetupTemplate(offeredModuleIds), TEMPLATE_FILE_NAME);
}

// Matching ignores case, spacing and punctuation, so "50-200" finds "50–200".
const normalise = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9+]/g, "");
const choiceKey = (value: string) => normalise(value).replace(/employees$/, "");

const YES = ["yes", "y", "true", "1", "on", "enabled"];
const NO = ["no", "n", "false", "0", "off", "disabled"];

/** Writes one cell into the draft, or says why it cannot be used. */
function applyValue(field: Field, raw: string, draft: Draft): string | null {
  switch (field.kind) {
    case "text":
      field.set(draft, raw);
      return null;
    case "choice": {
      const key = choiceKey(raw);
      const choice = field.choices.find(
        (option) =>
          choiceKey(option.label) === key || choiceKey(option.value) === key,
      );
      if (!choice) {
        return `"${raw}" is not an option. Use one of: ${field.choices
          .map((option) => option.label)
          .join(", ")}.`;
      }
      field.set(draft, choice.value);
      return null;
    }
    case "yesno": {
      const key = normalise(raw);
      if (!YES.includes(key) && !NO.includes(key)) {
        return `"${raw}" should be Yes or No.`;
      }
      field.set(draft, YES.includes(key));
      return null;
    }
  }
}

export interface ParsedSetupFile {
  setup: CompanySetupPrefill;
  /** Empty when the file can be used as it is. */
  errors: string[];
}

/**
 * Reads a filled-in template (.xlsx, .xls or .csv). Rows left blank are not
 * part of the result, so the wizard keeps what it already has for them.
 */
export async function parseSetupFile(
  file: File,
  offeredModuleIds?: string[],
): Promise<ParsedSetupFile> {
  // Read as text, a CSV keeps its non-ASCII characters (the size ranges use an en dash).
  const book = file.name.toLowerCase().endsWith(".csv")
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = book.Sheets[SHEET_NAME] ?? book.Sheets[book.SheetNames[0]];
  const rows = sheet
    ? XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
      })
    : [];

  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalise(cell) === "field"),
  );
  if (headerIndex === -1) return { setup: {}, errors: [NOT_A_TEMPLATE] };
  const header = rows[headerIndex];
  const fieldColumn = header.findIndex((cell) => normalise(cell) === "field");
  const namedValueColumn = header.findIndex(
    (cell) => normalise(cell) === "yourvalue",
  );
  const valueColumn =
    namedValueColumn === -1 ? fieldColumn + 1 : namedValueColumn;

  const fields = buildFields(offeredModuleIds);
  const byLabel = new Map(fields.map((field) => [normalise(field.label), field]));
  const draft: Draft = {
    companyProfile: {},
    organizationConfig: {},
    modules: [],
  };
  const errors: string[] = [];
  const filled = new Set<Field>();
  let recognised = 0;

  for (const row of rows.slice(headerIndex + 1)) {
    const field = byLabel.get(normalise(row[fieldColumn]));
    if (!field) continue;
    recognised += 1;
    const raw = String(row[valueColumn] ?? "").trim();
    if (!raw) continue;
    filled.add(field);
    const problem = applyValue(field, raw, draft);
    if (problem) errors.push(`${field.label}: ${problem}`);
  }

  if (recognised === 0) return { setup: {}, errors: [NOT_A_TEMPLATE] };

  for (const field of fields) {
    if (field.required && !filled.has(field)) {
      errors.push(`${field.label}: this is required.`);
    }
  }
  if (draft.modules.length === 0) {
    errors.push("Modules: switch on at least one module with Yes.");
  }

  const setup: CompanySetupPrefill = { enabledModules: draft.modules };
  if (Object.keys(draft.companyProfile).length > 0) {
    setup.companyProfile = draft.companyProfile;
  }
  if (Object.keys(draft.organizationConfig).length > 0) {
    setup.organizationConfig = draft.organizationConfig;
  }

  return { setup, errors };
}
