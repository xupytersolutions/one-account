import {
  FolderIcon,
  BriefcaseIcon,
  UserIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  StarIcon,
  RocketLaunchIcon,
  CreditCardIcon,
  KeyIcon,
  HomeIcon,
  LightBulbIcon,
  CubeIcon,
  HeartIcon,
  BoltIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/solid";
import type { IconOption } from "../types";

export const ICON_OPTIONS: IconOption[] = [
  { id: "", label: "Initial (Aa)", Icon: null },
  { id: "FolderIcon", label: "Folder", Icon: FolderIcon },
  { id: "BriefcaseIcon", label: "Briefcase", Icon: BriefcaseIcon },
  { id: "UserIcon", label: "User", Icon: UserIcon },
  { id: "BuildingOffice2Icon", label: "Company", Icon: BuildingOffice2Icon },
  { id: "ShieldCheckIcon", label: "Shield", Icon: ShieldCheckIcon },
  { id: "StarIcon", label: "Star", Icon: StarIcon },
  { id: "RocketLaunchIcon", label: "Rocket", Icon: RocketLaunchIcon },
  { id: "CreditCardIcon", label: "Card", Icon: CreditCardIcon },
  { id: "KeyIcon", label: "Key", Icon: KeyIcon },
  { id: "HomeIcon", label: "Home", Icon: HomeIcon },
  { id: "LightBulbIcon", label: "Idea", Icon: LightBulbIcon },
  { id: "CubeIcon", label: "Cube", Icon: CubeIcon },
  { id: "HeartIcon", label: "Heart", Icon: HeartIcon },
  { id: "BoltIcon", label: "Bolt", Icon: BoltIcon },
  { id: "GlobeAltIcon", label: "Globe", Icon: GlobeAltIcon },
  { id: "DevicePhoneMobileIcon", label: "Mobile", Icon: DevicePhoneMobileIcon },
];

export const ICON_MAP: Record<string, React.ElementType> = Object.fromEntries(
  ICON_OPTIONS.filter((o) => o.id && o.Icon).map((o) => [o.id, o.Icon as React.ElementType])
);

export const COLORS = [
  "#006FEE",
  "#17C964",
  "#F5A524",
  "#F31260",
  "#7828C8",
  "#06B7DB",
  "#FF6900",
  "#9353D3",
];
