import { Router } from "express";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db, productsTable, transactionsTable, categoriesTable, locationsTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

// GET /reports/stock-summary
router.get("/stock-summary", requireAuth, async (req, res) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
  const locationId = req.query.locationId ? parseInt(req.query.locationId as string, 10) : undefined;

  try {
    const conditions: any[] = [];
    if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
    if (locationId) conditions.push(eq(productsTable.locationId, locationId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        productId: productsTable.productId,
        productName: productsTable.name,
        categoryName: categoriesTable.name,
        locationName: locationsTable.name,
        currentStock: productsTable.currentStock,
        reservedStock: productsTable.reservedStock,
        unitOfMeasure: productsTable.unitOfMeasure,
        unitCost: productsTable.unitCost,
        minStockLevel: productsTable.minStockLevel,
        status: productsTable.status,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .$dynamic()
      .where(where)
      .orderBy(productsTable.name);

    return res.json(rows.map((r) => {
      const cs = parseFloat(r.currentStock ?? "0");
      const rs = parseFloat(r.reservedStock ?? "0");
      const uc = parseFloat(r.unitCost ?? "0");
      const min = parseFloat(r.minStockLevel ?? "0");
      let stockStatus = "in_stock";
      if (cs <= 0) stockStatus = "out_of_stock";
      else if (cs <= min) stockStatus = "low_stock";
      return {
        productId: r.productId,
        productName: r.productName,
        categoryName: r.categoryName ?? null,
        locationName: r.locationName ?? null,
        currentStock: cs,
        availableStock: Math.max(0, cs - rs),
        reservedStock: rs,
        unitOfMeasure: r.unitOfMeasure,
        unitCost: uc,
        totalValue: cs * uc,
        stockStatus,
        status: r.status,
      };
    }));
  } catch (err) {
    req.log.error({ err }, "Stock summary error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reports/stock-movement
router.get("/stock-movement", requireAuth, async (req, res) => {
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const productId = req.query.productId ? parseInt(req.query.productId as string, 10) : undefined;

  try {
    const conditions: any[] = [];
    if (productId) conditions.push(eq(transactionsTable.productId, productId));
    if (dateFrom) conditions.push(gte(transactionsTable.transactionDate, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(transactionsTable.transactionDate, new Date(dateTo)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        transactionId: transactionsTable.transactionId,
        productName: productsTable.name,
        barcode: productsTable.barcode,
        type: transactionsTable.type,
        quantity: transactionsTable.quantity,
        balanceQuantity: transactionsTable.balanceQuantity,
        transactionDate: transactionsTable.transactionDate,
        department: transactionsTable.department,
        issuedTo: transactionsTable.issuedTo,
        purpose: transactionsTable.purpose,
      })
      .from(transactionsTable)
      .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
      .$dynamic()
      .where(where)
      .orderBy(desc(transactionsTable.transactionDate));

    return res.json(rows.map((r) => ({
      transactionId: r.transactionId,
      productName: r.productName ?? "",
      barcode: r.barcode ?? null,
      type: r.type,
      quantity: parseFloat(r.quantity ?? "0"),
      balanceQuantity: parseFloat(r.balanceQuantity ?? "0"),
      transactionDate: r.transactionDate instanceof Date ? r.transactionDate.toISOString() : r.transactionDate,
      department: r.department ?? null,
      issuedTo: r.issuedTo ?? null,
      purpose: r.purpose ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Stock movement error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reports/low-stock
router.get("/low-stock", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        productId: productsTable.productId,
        productName: productsTable.name,
        categoryName: categoriesTable.name,
        supplier: productsTable.supplier,
        locationName: locationsTable.name,
        currentStock: productsTable.currentStock,
        minStockLevel: productsTable.minStockLevel,
        reorderLevel: productsTable.reorderLevel,
        unitOfMeasure: productsTable.unitOfMeasure,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .where(eq(productsTable.status, "active"));

    const lowStock = rows
      .filter((r) => {
        const cs = parseFloat(r.currentStock ?? "0");
        const min = parseFloat(r.minStockLevel ?? "0");
        return cs <= min;
      })
      .map((r) => {
        const cs = parseFloat(r.currentStock ?? "0");
        return {
          productId: r.productId,
          productName: r.productName,
          categoryName: r.categoryName ?? null,
          supplier: r.supplier ?? null,
          locationName: r.locationName ?? null,
          currentStock: cs,
          minStockLevel: parseFloat(r.minStockLevel ?? "0"),
          reorderLevel: parseFloat(r.reorderLevel ?? "0"),
          unitOfMeasure: r.unitOfMeasure,
          stockStatus: cs <= 0 ? "out_of_stock" : "low_stock",
        };
      });

    return res.json(lowStock);
  } catch (err) {
    req.log.error({ err }, "Low stock report error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reports/expiry
router.get("/expiry", requireAuth, async (req, res) => {
  const daysAhead = parseInt(req.query.daysAhead as string ?? "90", 10);
  const today = new Date();
  const ahead = new Date(today);
  ahead.setDate(ahead.getDate() + daysAhead);
  const todayStr = today.toISOString().split("T")[0];
  const aheadStr = ahead.toISOString().split("T")[0];

  try {
    const rows = await db
      .select({
        productId: productsTable.productId,
        productName: productsTable.name,
        categoryName: categoriesTable.name,
        locationName: locationsTable.name,
        expiryDate: productsTable.expiryDate,
        warrantyExpiry: productsTable.warrantyExpiry,
        currentStock: productsTable.currentStock,
        unitOfMeasure: productsTable.unitOfMeasure,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .where(eq(productsTable.status, "active"));

    const expiring = rows
      .filter((r) => r.expiryDate && r.expiryDate >= todayStr && r.expiryDate <= aheadStr)
      .map((r) => {
        const expiry = new Date(r.expiryDate!);
        const diffMs = expiry.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          productId: r.productId,
          productName: r.productName,
          categoryName: r.categoryName ?? null,
          locationName: r.locationName ?? null,
          expiryDate: r.expiryDate!,
          warrantyExpiry: r.warrantyExpiry ?? null,
          daysUntilExpiry,
          currentStock: parseFloat(r.currentStock ?? "0"),
          unitOfMeasure: r.unitOfMeasure,
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return res.json(expiring);
  } catch (err) {
    req.log.error({ err }, "Expiry report error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
