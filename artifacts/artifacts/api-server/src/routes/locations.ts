import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, locationsTable, productsTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

// GET /locations
router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        description: locationsTable.description,
        productCount: sql<number>`cast(count(${productsTable.id}) as int)`,
      })
      .from(locationsTable)
      .leftJoin(productsTable, eq(productsTable.locationId, locationsTable.id))
      .groupBy(locationsTable.id)
      .orderBy(locationsTable.name);
    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "List locations error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /locations
router.post("/", requireAuth, async (req: any, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const [loc] = await db.insert(locationsTable).values({ name, description }).returning();
    return res.status(201).json({ ...loc, productCount: 0 });
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "Location already exists" });
    req.log.error({ err }, "Create location error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /locations/:id
router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description } = req.body;
  try {
    const [loc] = await db.update(locationsTable).set({ name, description }).where(eq(locationsTable.id, id)).returning();
    if (!loc) return res.status(404).json({ error: "Not found" });
    const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable).where(eq(productsTable.locationId, id));
    return res.json({ ...loc, productCount: count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Update location error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /locations/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(locationsTable).where(eq(locationsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete location error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
