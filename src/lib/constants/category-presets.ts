export type CategoryPreset = {
  id: string;
  label: string;
  icon: string;
  color: string;
  logoUrl: string | null;
  domain: string;
};

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: "gmail",
    label: "Gmail",
    icon: "CubeIcon",
    color: "#EA4335",
    logoUrl: "https://cdn.simpleicons.org/gmail/ffffff",
    domain: "gmail.com",
  },
  {
    id: "yahoo",
    label: "Yahoo",
    icon: "GlobeAltIcon",
    color: "#6001D2",
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/yahoo.svg",
    domain: "yahoo.com",
  },
  {
    id: "google",
    label: "Google",
    icon: "GlobeAltIcon",
    color: "#4285F4",
    logoUrl: "https://cdn.simpleicons.org/google/ffffff",
    domain: "google.com",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "UserIcon",
    color: "#1877F2",
    logoUrl: "https://cdn.simpleicons.org/facebook/ffffff",
    domain: "facebook.com",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "HeartIcon",
    color: "#E4405F",
    logoUrl: "https://cdn.simpleicons.org/instagram/ffffff",
    domain: "instagram.com",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    icon: "BoltIcon",
    color: "#000000",
    logoUrl: "https://cdn.simpleicons.org/x/ffffff",
    domain: "x.com",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "BriefcaseIcon",
    color: "#0A66C2",
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg",
    domain: "linkedin.com",
  },
  {
    id: "github",
    label: "GitHub",
    icon: "CubeIcon",
    color: "#181717",
    logoUrl: "https://cdn.simpleicons.org/github/ffffff",
    domain: "github.com",
  },
  {
    id: "apple",
    label: "Apple",
    icon: "DevicePhoneMobileIcon",
    color: "#000000",
    logoUrl: "https://cdn.simpleicons.org/apple/ffffff",
    domain: "apple.com",
  },
  {
    id: "microsoft",
    label: "Microsoft",
    icon: "BuildingOffice2Icon",
    color: "#00A4EF",
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoft.svg",
    domain: "microsoft.com",
  },
  {
    id: "netflix",
    label: "Netflix",
    icon: "StarIcon",
    color: "#E50914",
    logoUrl: "https://cdn.simpleicons.org/netflix/ffffff",
    domain: "netflix.com",
  },
  {
    id: "slack",
    label: "Slack",
    icon: "FolderIcon",
    color: "#E01E5A",
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg",
    domain: "slack.com",
  },
  {
    id: "mailcow",
    label: "Mailcow",
    icon: "ShieldCheckIcon",
    color: "#1E88E5",
    logoUrl: null,
    domain: "mailcow.email",
  },
];

export function getPresetLogoUrl(id: string): string | null {
  return CATEGORY_PRESETS.find((p) => p.id === id)?.logoUrl ?? null;
}

export function findPresetByName(name: string): CategoryPreset | undefined {
  const lowerName = name.toLowerCase();
  return CATEGORY_PRESETS.find(
    (p) => p.label.toLowerCase() === lowerName || p.id === lowerName
  );
}
