import type {
  OffboardingAsset,
  OffboardingAssetType,
  OffboardingRecord,
} from "@/src/lib/types/offboarding";

/** Display order for the Asset Recovery tab (Offboarding feedback §4). */
export const ASSET_TYPES: readonly OffboardingAssetType[] = [
  "laptop",
  "phone",
  "id_card",
  "vehicle",
  "access_card",
];

export const ASSET_TYPE_LABELS: Record<OffboardingAssetType, string> = {
  laptop: "Laptop",
  phone: "Phone",
  id_card: "ID Card",
  vehicle: "Vehicle",
  access_card: "Access Card",
};

export const ASSET_TYPE_PLURALS: Record<OffboardingAssetType, string> = {
  laptop: "Laptops",
  phone: "Phones",
  id_card: "ID Cards",
  vehicle: "Vehicles",
  access_card: "Access Cards",
};

const LAPTOP_MODELS = [
  "Dell Latitude 5440",
  "MacBook Pro 14\"",
  "HP EliteBook 840",
  "Lenovo ThinkPad T14",
];
const PHONE_MODELS = ["iPhone 14", "Samsung Galaxy A54", "Google Pixel 7a"];
const VEHICLE_MODELS = [
  "Toyota Corolla (pool car)",
  "Toyota Hilux (fleet)",
  "Ford Ranger (fleet)",
];

/** Small stable hash so demo assets don't reshuffle between renders. */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

const TAG_PREFIX: Record<OffboardingAssetType, string> = {
  laptop: "LT",
  phone: "PH",
  id_card: "ID",
  vehicle: "VH",
  access_card: "AC",
};

/** Which asset types go back through which clearance owner. */
export interface AssetReturnState {
  /** Laptop and phone — returned to IT. */
  devices?: boolean;
  /** ID and access cards — returned to HR / security. */
  cards?: boolean;
  /** Vehicle — signed back in by the line manager. */
  vehicle?: boolean;
}

/**
 * The property a leaver was issued. Everyone holds an ID card and an access
 * card; laptops, phones and vehicles depend on the role. Deterministic per
 * record so the same leaver always shows the same kit.
 */
export function buildAssets(
  recordId: string,
  jobTitle: string,
  department: string,
  returned: AssetReturnState = {},
  returnedAt?: string,
): OffboardingAsset[] {
  const h = hash(recordId);
  const title = jobTitle.toLowerCase();
  const dept = department.toLowerCase();
  const fieldRole = /driver|warehouse|cleaner|security|porter/.test(title);
  const senior = /manager|head|director|lead|chief|supervisor/.test(title);
  const mobile = /sales|account|business|partnership/.test(`${title} ${dept}`);
  const fleet = /fleet|logistic|operations|driver/.test(`${title} ${dept}`);

  const types: OffboardingAssetType[] = [];
  if (!fieldRole || h % 3 === 0) types.push("laptop");
  if (senior || mobile || h % 3 === 1) types.push("phone");
  types.push("id_card");
  if ((fleet && h % 2 === 0) || /director|chief/.test(title)) {
    types.push("vehicle");
  }
  types.push("access_card");

  return types.map((type, i) => {
    const done =
      type === "laptop" || type === "phone"
        ? !!returned.devices
        : type === "vehicle"
          ? !!returned.vehicle
          : !!returned.cards;
    const label =
      type === "laptop"
        ? LAPTOP_MODELS[h % LAPTOP_MODELS.length]
        : type === "phone"
          ? PHONE_MODELS[h % PHONE_MODELS.length]
          : type === "vehicle"
            ? VEHICLE_MODELS[h % VEHICLE_MODELS.length]
            : type === "id_card"
              ? "Staff ID card"
              : "Building access card";
    return {
      id: `${recordId}-a${i + 1}`,
      type,
      label,
      tag: `${TAG_PREFIX[type]}-${String((h + i * 7919) % 100000).padStart(5, "0")}`,
      returned: done,
      returnedAt: done ? returnedAt : undefined,
    };
  });
}

export function recordAssets(record: OffboardingRecord): OffboardingAsset[] {
  return record.assets ?? [];
}

/** True once there is nothing left to recover from this leaver. */
export function allAssetsReturned(record: OffboardingRecord): boolean {
  return recordAssets(record).every((a) => a.returned);
}
