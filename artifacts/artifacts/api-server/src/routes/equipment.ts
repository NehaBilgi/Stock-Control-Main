import { Router } from "express";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { db, equipmentTable, transactionsTable, productsTable, usersTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

function toEquipmentResponse(row: any) {
  return {
    id: row.id,
    assetTag: row.assetTag,
    name: row.name,
    type: row.type ?? null,
    department: row.department ?? null,
    location: row.location ?? null,
    manufacturer: row.manufacturer ?? null,
    model: row.model ?? null,
    serialNumber: row.serialNumber ?? null,
    status: row.status,
    notes: row.notes ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

// GET /equipment
router.get("/", requireAuth, async (req, res) => {
  const status = req.query.status as string | undefined;
  const department = req.query.department as string | undefined;
  const q = req.query.q as string | undefined;

  try {
    const conditions: any[] = [];
    if (status) conditions.push(eq(equipmentTable.status, status as any));
    if (department) conditions.push(eq(equipmentTable.department, department));
    if (q) {
      conditions.push(
        or(
          ilike(equipmentTable.assetTag, `%${q}%`),
          ilike(equipmentTable.name, `%${q}%`),
          ilike(equipmentTable.type, `%${q}%`),
          ilike(equipmentTable.department, `%${q}%`),
        )
      );
    }

    const rows = await db
      .select()
      .from(equipmentTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipmentTable.assetTag);

    return res.json(rows.map(toEquipmentResponse));
  } catch (err) {
    req.log.error({ err }, "List equipment error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /equipment
router.post("/", requireAuth, async (req, res) => {
  const { assetTag, name, type, department, location, manufacturer, model, serialNumber, status, notes } = req.body;
  if (!assetTag || !name) {
    return res.status(400).json({ error: "assetTag and name are required" });
  }
  try {
    const [row] = await db
      .insert(equipmentTable)
      .values({ assetTag, name, type, department, location, manufacturer, model, serialNumber, status: status ?? "active", notes })
      .returning();
    return res.status(201).json(toEquipmentResponse(row));
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Asset tag already exists" });
    }
    req.log.error({ err }, "Create equipment error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /equipment/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [row] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(toEquipmentResponse(row));
  } catch (err) {
    req.log.error({ err }, "Get equipment error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /equipment/:id
router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { assetTag, name, type, department, location, manufacturer, model, serialNumber, status, notes } = req.body;
  if (!assetTag || !name) {
    return res.status(400).json({ error: "assetTag and name are required" });
  }
  try {
    const [row] = await db
      .update(equipmentTable)
      .set({ assetTag, name, type, department, location, manufacturer, model, serialNumber, status: status ?? "active", notes, updatedAt: new Date() })
      .where(eq(equipmentTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(toEquipmentResponse(row));
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Asset tag already exists" });
    }
    req.log.error({ err }, "Update equipment error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /equipment/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(equipmentTable).where(eq(equipmentTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete equipment error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /equipment/:id/history
router.get("/:id/history", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const rows = await db
      .select({
        id: transactionsTable.id,
        transactionId: transactionsTable.transactionId,
        productId: transactionsTable.productId,
        productName: productsTable.name,
        barcode: productsTable.barcode,
        type: transactionsTable.type,
        quantity: transactionsTable.quantity,
        balanceQuantity: transactionsTable.balanceQuantity,
        transactionDate: transactionsTable.transactionDate,
        vehicleNumber: transactionsTable.vehicleNumber,
        issuedTo: transactionsTable.issuedTo,
        department: transactionsTable.department,
        workOrderNumber: transactionsTable.workOrderNumber,
        maintenanceNotes: transactionsTable.maintenanceNotes,
        createdByName: usersTable.name,
      })
      .from(transactionsTable)
      .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
      .leftJoin(usersTable, eq(transactionsTable.createdById, usersTable.id))
      .where(eq(transactionsTable.equipmentId, id))
      .orderBy(desc(transactionsTable.transactionDate));

    return res.json(rows.map((r) => ({
      id: r.id,
      transactionId: r.transactionId,
      productId: r.productId,
      productName: r.productName ?? null,
      barcode: r.barcode ?? null,
      type: r.type,
      quantity: parseFloat(r.quantity ?? "0"),
      balanceQuantity: parseFloat(r.balanceQuantity ?? "0"),
      transactionDate: r.transactionDate instanceof Date ? r.transactionDate.toISOString() : r.transactionDate,
      vehicleNumber: r.vehicleNumber ?? null,
      issuedTo: r.issuedTo ?? null,
      department: r.department ?? null,
      workOrderNumber: r.workOrderNumber ?? null,
      maintenanceNotes: r.maintenanceNotes ?? null,
      createdBy: r.createdByName ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Get equipment history error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
