import { Router } from "express";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { db, productsTable, transactionsTable, categoriesTable, usersTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

// GET /dashboard/stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const [productStats] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        totalValue: sql<number>`cast(sum(cast(${productsTable.currentStock} as numeric) * cast(${productsTable.unitCost} as numeric)) as float)`,
      })
      .from(productsTable)
      .where(eq(productsTable.status, "active"));

    const products = await db.select({
      currentStock: productsTable.currentStock,
      minStockLevel: productsTable.minStockLevel,
      expiryDate: productsTable.expiryDate,
    }).from(productsTable).where(eq(productsTable.status, "active"));

    let inStockCount = 0, outOfStockCount = 0, lowStockCount = 0, expiringCount = 0;
    const today = new Date();
    const in90Days = new Date(today);
    in90Days.setDate(in90Days.getDate() + 90);
    const in90Str = in90Days.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    for (const p of products) {
      const cs = parseFloat(p.currentStock ?? "0");
      const min = parseFloat(p.minStockLevel ?? "0");
      if (cs <= 0) outOfStockCount++;
      else if (cs <= min) lowStockCount++;
      else inStockCount++;
      if (p.expiryDate && p.expiryDate <= in90Str && p.expiryDate >= todayStr) expiringCount++;
    }

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const [txToday] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(transactionsTable)
      .where(gte(transactionsTable.transactionDate, todayStart));

    // Inventory turnover rate (last 30 days stock out / avg stock value)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [turnover] = await db
      .select({ totalOut: sql<number>`cast(coalesce(sum(cast(${transactionsTable.quantity} as numeric)), 0) as float)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.type, "stock_out"), gte(transactionsTable.transactionDate, thirtyDaysAgo)));

    const avgValue = (productStats.totalValue ?? 0) / 2;
    const turnoverRate = avgValue > 0 ? (turnover.totalOut ?? 0) / avgValue : 0;

    return res.json({
      totalProducts: productStats.total ?? 0,
      totalValue: productStats.totalValue ?? 0,
      inStockCount,
      outOfStockCount,
      lowStockCount,
      expiringCount,
      totalTransactionsToday: txToday.count ?? 0,
      inventoryTurnoverRate: parseFloat(turnoverRate.toFixed(2)),
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/recent-transactions
router.get("/recent-transactions", requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit as string ?? "10", 10);
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
        issuedTo: transactionsTable.issuedTo,
        department: transactionsTable.department,
        employeeName: transactionsTable.employeeName,
        workOrderNumber: transactionsTable.workOrderNumber,
        purpose: transactionsTable.purpose,
        remarks: transactionsTable.remarks,
        approvedBy: transactionsTable.approvedBy,
        createdBy: usersTable.name,
      })
      .from(transactionsTable)
      .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
      .leftJoin(usersTable, eq(transactionsTable.createdById, usersTable.id))
      .orderBy(desc(transactionsTable.transactionDate))
      .limit(limit);

    return res.json(rows.map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity ?? "0"),
      balanceQuantity: parseFloat(r.balanceQuantity ?? "0"),
      transactionDate: r.transactionDate instanceof Date ? r.transactionDate.toISOString() : r.transactionDate,
    })));
  } catch (err) {
    req.log.error({ err }, "Recent transactions error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/top-consumed
router.get("/top-consumed", requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit as string ?? "10", 10);
  const days = parseInt(req.query.days as string ?? "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const rows = await db
      .select({
        productId: transactionsTable.productId,
        productName: productsTable.name,
        unitOfMeasure: productsTable.unitOfMeasure,
        categoryName: categoriesTable.name,
        totalConsumed: sql<number>`cast(sum(cast(${transactionsTable.quantity} as numeric)) as float)`,
      })
      .from(transactionsTable)
      .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(and(eq(transactionsTable.type, "stock_out"), gte(transactionsTable.transactionDate, since)))
      .groupBy(transactionsTable.productId, productsTable.name, productsTable.unitOfMeasure, categoriesTable.name)
      .orderBy(desc(sql`sum(cast(${transactionsTable.quantity} as numeric))`))
      .limit(limit);

    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Top consumed error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/monthly-consumption
router.get("/monthly-consumption", requireAuth, async (req, res) => {
  const months = parseInt(req.query.months as string ?? "6", 10);
  try {
    const result: any[] = [];
    const today = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [inRow] = await db
        .select({ total: sql<number>`cast(coalesce(sum(cast(${transactionsTable.quantity} as numeric)), 0) as float)` })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.type, "stock_in"), gte(transactionsTable.transactionDate, start), sql`${transactionsTable.transactionDate} <= ${end}`));
      const [outRow] = await db
        .select({ total: sql<number>`cast(coalesce(sum(cast(${transactionsTable.quantity} as numeric)), 0) as float)` })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.type, "stock_out"), gte(transactionsTable.transactionDate, start), sql`${transactionsTable.transactionDate} <= ${end}`));

      result.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        totalStockIn: inRow.total ?? 0,
        totalStockOut: outRow.total ?? 0,
      });
    }
    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "Monthly consumption error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/category-breakdown
router.get("/category-breakdown", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        categoryName: categoriesTable.name,
        totalValue: sql<number>`cast(sum(cast(${productsTable.currentStock} as numeric) * cast(${productsTable.unitCost} as numeric)) as float)`,
        productCount: sql<number>`cast(count(${productsTable.id}) as int)`,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.status, "active"))
      .groupBy(categoriesTable.name)
      .orderBy(desc(sql`sum(cast(${productsTable.currentStock} as numeric) * cast(${productsTable.unitCost} as numeric))`));

    return res.json(rows.map((r) => ({ ...r, categoryName: r.categoryName ?? "Uncategorized" })));
  } catch (err) {
    req.log.error({ err }, "Category breakdown error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
