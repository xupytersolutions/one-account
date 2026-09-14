import { prisma } from "@/lib/prisma";
import { CATEGORY_PRESETS } from "@/lib/constants/category-presets";

/**
 * Ensures default categories exist for a user.
 * Idempotent: only creates presets that do not already exist (case-insensitive name match).
 * Called on first load of spaces so dropdown is DB-driven, not hardcoded.
 */
export async function ensureDefaultCategories(ownerId: string) {
  const existing = await prisma.category.findMany({
    where: { ownerId },
    select: { id: true, name: true, icon: true, color: true, logoUrl: true },
  });
  const existingLower = new Map(existing.map((c) => [c.name.toLowerCase(), c]));

  // create missing + repair broken presets (icon/color/logoUrl) for light-mode & CDN fixes
  for (const p of CATEGORY_PRESETS) {
    const found = existingLower.get(p.label.toLowerCase());
    if (!found) {
      await prisma.category.create({ data: { name: p.label, icon: p.icon, color: p.color, logoUrl: p.logoUrl, ownerId } });
    } else if (found.icon !== p.icon || found.color !== p.color || found.logoUrl !== p.logoUrl) {
      await prisma.category.update({ where: { id: found.id }, data: { icon: p.icon, color: p.color, logoUrl: p.logoUrl } });
    }
  }

  // also add mailcow via same loop — ensures existing users get it
}
