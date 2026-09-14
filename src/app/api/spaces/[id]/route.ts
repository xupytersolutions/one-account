import { prisma } from "@/lib/prisma";
import { spaceSchema } from "@/lib/validators";
import { requireUser, jsonError, withError } from "@/lib/api-helpers";
import { ensureDefaultCategories } from "@/lib/category-seed";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await ensureDefaultCategories(user.id);
    const { id } = await params;
    const space = await prisma.space.findFirst({ where: { id, ownerId: user.id } });
    if (!space) return jsonError("Space not found", 404);
    const entries = await prisma.vaultEntry.findMany({ where: { spaceId: id }, include: { categoryRef: true }, orderBy: { createdAt: "desc" } });
    const sanitized = entries.map((e) => {
      const { password: _p, ...rest } = e;
      void _p;
      return rest;
    });
    const allSpaces = await prisma.space.findMany({ where: { ownerId: user.id }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } });
    const allCategories = await prisma.category.findMany({ where: { ownerId: user.id }, orderBy: { name: "asc" } });
    return Response.json({ space, entries: sanitized, allSpaces, allCategories });
  } catch (e) {
    return withError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const raw = {
      name: String(body.name ?? "").trim(),
      type: String(body.type ?? "personal"),
      description: body.description != null ? String(body.description).trim() || null : null,
      color: body.color ? String(body.color).trim() : null,
      icon: body.icon ? String(body.icon).trim() || null : null,
    };
    const parsed = spaceSchema.safeParse(raw);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 422, { issues: parsed.error.issues });
    const existing = await prisma.space.findFirst({ where: { id, ownerId: user.id } });
    if (!existing) return jsonError("Space not found", 404);
    const space = await prisma.space.update({
      where: { id },
      data: { name: parsed.data.name, type: parsed.data.type as never, description: parsed.data.description, color: parsed.data.color ?? undefined, icon: parsed.data.icon },
      include: { _count: { select: { entries: true } } },
    });
    return Response.json({ space });
  } catch (e) {
    return withError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const c = await prisma.space.deleteMany({ where: { id, ownerId: user.id } });
    if (c.count === 0) return jsonError("Space not found", 404);
    return Response.json({ ok: true });
  } catch (e) {
    return withError(e);
  }
}
