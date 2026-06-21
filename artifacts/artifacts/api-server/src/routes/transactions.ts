import { Router } from "express";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { db, transactionsTable, productsTable, usersTable, equipmentTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

async function generateTransactionId(): Promise<string> {
  const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(transactionsTable);
  return `TXN-${String((count ?? 0) + 1).padStart(5, "0")}`;
}

function toTransactionResponse(row: any, productName?: string, barcode?: string, createdBy?: string) {
  return {
    id: row.id,
    transactionId: row.transactionId,
    productId: row.productId,
    productName: productName ?? row.productName ?? null,
    barcode: barcode ?? row.barcode ?? null,
    type: row.type,
    quantity: parseFloat(row.quantity ?? "0"),
    balanceQuantity: parseFloat(row.balanceQuantity ?? "0"),
    transactionDate: row.transactionDate instanceof Date ? row.transactionDate.toISOString() : row.transactionDate,
    vehicleNumber: row.vehicleNumber ?? null,
    issuedTo: row.issuedTo ?? null,
    department: row.department ?? null,
    employeeName: row.employeeName ?? null,
    workOrderNumber: row.workOrderNumber ?? null,
    purpose: row.purpose ?? null,
    remarks: row.remarks ?? null,
    approvedBy: row.approvedBy ?? null,
    equipmentId: row.equipmentId ?? null,
    equipmentAssetTag: row.equipmentAssetTag ?? null,
    equipmentName: row.equipmentName ?? null,
    maintenanceNotes: row.maintenanceNotes ?? null,
    createdBy: createdBy ?? row.createdBy ?? null,
  };
}

// GET /transactions
router.get("/", requireAuth, async (req, res) => {
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = parseInt(req.query.limit as string ?? "20", 10);
  const productId = req.query.productId ? parseInt(req.query.productId as string, 10) : undefined;
  const type = req.query.type as string | undefined;
  const department = req.query.department as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const offset = (page - 1) * limit;

  try {
    const conditions: any[] = [];
    if (productId) conditions.push(eq(transactionsTable.productId, productId));
    if (type) conditions.push(eq(transactionsTable.type, type as any));
    if (department) conditions.push(eq(transactionsTable.department, department));
    if (dateFrom) conditions.push(gte(transactionsTable.transactionDate, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(transactionsTable.transactionDate, new Date(dateTo)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

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
        employeeName: transactionsTable.employeeName,
        workOrderNumber: transactionsTable.workOrderNumber,
        purpose: transactionsTable.purpose,
        remarks: transactionsTable.remarks,
        approvedBy: transactionsTable.approvedBy,
        equipmentId: transactionsTable.equipmentId,
        maintenanceNotes: transactionsTable.maintenanceNotes,
        equipmentAssetTag: equipmentTable.assetTag,
        equipmentName: equipmentTable.name,
        createdByName: usersTable.name,
      })
      .from(transactionsTable)
      .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
      .leftJoin(usersTable, eq(transactionsTable.createdById, usersTable.id))
      .leftJoin(equipmentTable, eq(transactionsTable.equipmentId, equipmentTable.id))
      .$dynamic()
      .where(where)
      .orderBy(desc(transactionsTable.transactionDate));

    const total = rows.length;
    const data = rows.slice(offset, offset + limit).map((r) =>
      toTransactionResponse(r, r.productName ?? undefined, r.barcode ?? undefined, r.createdByName ?? undefined)
    );
    return res.json({ data, total, page, limit });
  } catch (err) {
    req.log.error({ err }, "List transactions error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /transactions
router.post("/", requireAuth, async (req: any, res) => {
  const body = req.body;
  if (!body.productId || !body.type || body.quantity == null) {
    return res.status(400).json({ error: "productId, type, and quantity are required" });
  }

  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, body.productId)).limit(1);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const qty = parseFloat(body.quantity);
    const currentStock = parseFloat(product.currentStock ?? "0");

    if (body.type === "stock_out" && currentStock < qty) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${currentStock}` });
    }

    const newStock = body.type === "stock_in" ? currentStock + qty : currentStock - qty;
    const transactionId = await generateTransactionId();
    const txDate = body.transactionDate ? new Date(body.transactionDate) : new Date();

    const [txn] = await db.insert(transactionsTable).values({
      transactionId,
      productId: body.productId,
      type: body.type,
      quantity: qty.toString(),
      balanceQuantity: newStock.toString(),
      transactionDate: txDate,
      vehicleNumber: body.vehicleNumber || null,
      issuedTo: body.issuedTo || null,
      department: body.department || null,
      employeeName: body.employeeName || null,
      workOrderNumber: body.workOrderNumber || null,
      purpose: body.purpose || null,
      remarks: body.remarks || null,
      approvedBy: body.approvedBy || null,
      equipmentId: body.equipmentId ? parseInt(body.equipmentId, 10) : null,
      maintenanceNotes: body.maintenanceNotes || null,
      createdById: req.user?.id || null,
    }).returning();

    // Update product stock
    const updateData: any = { currentStock: newStock.toString() };
    if (body.type === "stock_in") updateData.lastReceivedDate = txDate.toISOString().split("T")[0];
    else updateData.lastIssuedDate = txDate.toISOString().split("T")[0];

    await db.update(productsTable).set(updateData).where(eq(productsTable.id, body.productId));

    return res.status(201).json(toTransactionResponse(txn, product.name, product.barcode ?? undefined, req.user?.name));
  } catch (err) {
    req.log.error({ err }, "Create transaction error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transactions/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [row] = await db
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
        employeeName: transactionsTable.employeeName,
        workOrderNumber: transactionsTable.workOrderNumber,
        purpose: transactionsTable.purpose,
        remarks: transactionsTable.remarks,
        approvedBy: transactionsTable.approvedBy,
        equipmentId: transactionsTable.equipmentId,
        maintenanceNotes: transactionsTable.maintenanceNotes,
        equipmentAssetTag: equipmentTable.assetTag,
        equipmentName: equipmentTable.name,
        createdByName: usersTable.name,
      })
      .from(transactionsTable)
      .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
      .leftJoin(usersTable, eq(transactionsTable.createdById, usersTable.id))
      .leftJoin(equipmentTable, eq(transactionsTable.equipmentId, equipmentTable.id))
      .where(eq(transactionsTable.id, id))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(toTransactionResponse(row, row.productName ?? undefined, row.barcode ?? undefined, row.createdByName ?? undefined));
  } catch (err) {
    req.log.error({ err }, "Get transaction error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transactions/archive/preview?year=2025  (admin only)
router.get("/archive/preview", requireAuth, async (req, res) => {
  if ((req as any).user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  const year = parseInt(req.query.year as string, 10);
  if (!year || year < 2000 || year > 2099) {
    return res.status(400).json({ error: "Invalid year" });
  }
  try {
    const from = new Date(`${year}-01-01T00:00:00.000Z`);
    const to = new Date(`${year}-12-31T23:59:59.999Z`);
    const rows = await db
      .select({
        id: transactionsTable.id,
        transactionId: transactionsTable.transactionId,
        productName: productsTable.name,
        barcode: productsTable.barcode,
        type: transactionsTable.type,
        quantity: transactionsTable.quantity,
        balanceQuantity: transactionsTable.balanceQuantity,
        transactionDate: transactionsTable.transactionDate,
        vehicleNumber: transactionsTable.vehicleNumber,
        department: transactionsTable.department,
        issuedTo: transactionsTable.issuedTo,
        workOrderNumber: transactionsTable.workOrderNumber,
        purpose: transactionsTable.purpose,
        remarks: transactionsTable.remarks,
        createdByName: usersTable.name,
      })
      .from(transactionsTable)
      .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
      .leftJoin(usersTable, eq(transactionsTable.createdById, usersTable.id))
      .where(and(gte(transactionsTable.transactionDate, from), lte(transactionsTable.transactionDate, to)))
      .orderBy(desc(transactionsTable.transactionDate));

    const stockIn = rows.filter((r) => r.type === "stock_in").reduce((s, r) => s + parseFloat(r.quantity ?? "0"), 0);
    const stockOut = rows.filter((r) => r.type === "stock_out").reduce((s, r) => s + parseFloat(r.quantity ?? "0"), 0);

    return res.json({
      year,
      count: rows.length,
      stockInCount: rows.filter((r) => r.type === "stock_in").length,
      stockOutCount: rows.filter((r) => r.type === "stock_out").length,
      totalStockIn: stockIn,
      totalStockOut: stockOut,
      rows: rows.map((r) => ({
        transactionId: r.transactionId,
        transactionDate: r.transactionDate instanceof Date ? r.transactionDate.toISOString() : r.transactionDate,
        type: r.type,
        productName: r.productName ?? "",
        barcode: r.barcode ?? "",
        quantity: parseFloat(r.quantity ?? "0"),
        balanceQuantity: parseFloat(r.balanceQuantity ?? "0"),
        vehicleNumber: r.vehicleNumber ?? "",
        department: r.department ?? "",
        issuedTo: r.issuedTo ?? "",
        workOrderNumber: r.workOrderNumber ?? "",
        purpose: r.purpose ?? "",
        remarks: r.remarks ?? "",
        createdBy: r.createdByName ?? "",
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Archive preview error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /transactions/archive?year=2025  (admin only)
router.delete("/archive", requireAuth, async (req, res) => {
  if ((req as any).user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  const year = parseInt(req.query.year as string, 10);
  if (!year || year < 2000 || year > 2099) {
    return res.status(400).json({ error: "Invalid year" });
  }
  const currentYear = new Date().getFullYear();
  if (year >= currentYear) {
    return res.status(400).json({ error: "Cannot delete current or future year transactions" });
  }
  try {
    const from = new Date(`${year}-01-01T00:00:00.000Z`);
    const to = new Date(`${year}-12-31T23:59:59.999Z`);
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(transactionsTable)
      .where(and(gte(transactionsTable.transactionDate, from), lte(transactionsTable.transactionDate, to)));
    await db
      .delete(transactionsTable)
      .where(and(gte(transactionsTable.transactionDate, from), lte(transactionsTable.transactionDate, to)));
    req.log.info({ year, deleted: count }, "Archive delete completed");
    return res.json({ year, deleted: count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Archive delete error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
