export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  logoUrl: string | null;
};

export type VaultEntry = {
  id: string;
  title: string | null;
  email: string;
  password: string;
  description: string | null;
  url: string | null;
  category: string | null;
  icon: string | null;
  color: string | null;
  logoUrl: string | null;
  categoryId: string | null;
  categoryRef?: Category | null;
  updatedAt?: string | Date;
};

export type Space = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  updatedAt: string | Date;
  _count: { entries: number };
};

export type ViewMode = "comfortable" | "compact";

export type IconOption = {
  id: string;
  label: string;
  Icon: React.ElementType | null;
};
