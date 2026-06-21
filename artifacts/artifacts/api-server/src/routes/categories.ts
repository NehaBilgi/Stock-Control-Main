import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

// GET /categories
router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        description: categoriesTable.description,
        productCount: sql<number>`cast(count(${productsTable.id}) as int)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id)
      .orderBy(categoriesTable.name);
    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "List categories error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /categories
router.post("/", requireAuth, async (req: any, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const [cat] = await db.insert(categoriesTable).values({ name, description }).returning();
    return res.status(201).json({ ...cat, productCount: 0 });
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "Category already exists" });
    req.log.error({ err }, "Create category error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /categories/:id
router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description } = req.body;
  try {
    const [cat] = await db.update(categoriesTable).set({ name, description }).where(eq(categoriesTable.id, id)).returning();
    if (!cat) return res.status(404).json({ error: "Not found" });
    const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable).where(eq(productsTable.categoryId, id));
    return res.json({ ...cat, productCount: count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Update category error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /categories/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete category error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
