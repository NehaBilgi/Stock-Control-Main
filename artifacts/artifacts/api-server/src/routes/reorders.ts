import { Router } from "express";
import { eq, and, gte, inArray } from "drizzle-orm";
import { db, productsTable, transactionsTable, categoriesTable, locationsTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

const ANALYSIS_DAYS = 30;
const DEFAULT_LEAD_TIME_DAYS = 7;

// GET /reorders
// Analyzes stock-out consumption over the past 30 days and surfaces items
// likely to hit reorder threshold before the lead time window closes.
router.get("/", requireAuth, async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ANALYSIS_DAYS);

    // Fetch all active products with category/location
    const products = await db
      .select({
        id: productsTable.id,
        productId: productsTable.productId,
        name: productsTable.name,
        categoryName: categoriesTable.name,
        locationName: locationsTable.name,
        unitOfMeasure: productsTable.unitOfMeasure,
        brand: productsTable.brand,
        supplier: productsTable.supplier,
        currentStock: productsTable.currentStock,
        minStockLevel: productsTable.minStockLevel,
        maxStockLevel: productsTable.maxStockLevel,
        reorderLevel: productsTable.reorderLevel,
        unitCost: productsTable.unitCost,
        status: productsTable.status,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .where(eq(productsTable.status, "active"));

    if (products.length === 0) return res.json([]);

    const productIds = products.map((p) => p.id);

    // Fetch all stock_out transactions for these products in the analysis window
    const transactions = await db
      .select({
        productId: transactionsTable.productId,
        quantity: transactionsTable.quantity,
        transactionDate: transactionsTable.transactionDate,
      })
      .from(transactionsTable)
      .where(
        and(
          inArray(transactionsTable.productId, productIds),
          eq(transactionsTable.type, "stock_out"),
          gte(transactionsTable.transactionDate, cutoff),
        ),
      );

    // Aggregate consumed qty per product
    const consumedMap = new Map<number, number>();
    for (const t of transactions) {
      const prev = consumedMap.get(t.productId) ?? 0;
      consumedMap.set(t.productId, prev + parseFloat(t.quantity ?? "0"));
    }

    const suggestions = [];

    for (const p of products) {
      const currentStock = parseFloat(p.currentStock ?? "0");
      const minStockLevel = parseFloat(p.minStockLevel ?? "0");
      const reorderLevel = parseFloat(p.reorderLevel ?? "0");
      const maxStockLevel = p.maxStockLevel ? parseFloat(p.maxStockLevel) : null;
      const unitCost = parseFloat(p.unitCost ?? "0");
      const totalConsumed = consumedMap.get(p.id) ?? 0;
      const dailyConsumption = totalConsumed / ANALYSIS_DAYS;

      // Days of stock remaining at current consumption rate
      const daysRemaining =
        dailyConsumption > 0 ? Math.max(0, currentStock / dailyConsumption) : null;

      // Determine if this product needs attention
      // Priority rules:
      //   critical  — already below reorder level OR daysRemaining <= lead time
      //   warning   — daysRemaining <= lead time * 2
      //   watch     — daysRemaining <= lead time * 4
      //   (skip products with null daysRemaining + stock above reorder level)
      let priority: "critical" | "warning" | "watch" | null = null;

      if (currentStock <= 0) {
        priority = "critical";
      } else if (currentStock <= reorderLevel || currentStock <= minStockLevel) {
        priority = "critical";
      } else if (daysRemaining !== null) {
        if (daysRemaining <= DEFAULT_LEAD_TIME_DAYS) priority = "critical";
        else if (daysRemaining <= DEFAULT_LEAD_TIME_DAYS * 2) priority = "warning";
        else if (daysRemaining <= DEFAULT_LEAD_TIME_DAYS * 4) priority = "watch";
      }

      if (!priority) continue;

      // Recommended order quantity to reach max stock (or 2x min if no max set)
      const targetStock = maxStockLevel ?? minStockLevel * 2;
      const recommendedQty = Math.max(0, targetStock - currentStock);

      suggestions.push({
        productId: p.productId,
        productDbId: p.id,
        name: p.name,
        categoryName: p.categoryName ?? null,
        locationName: p.locationName ?? null,
        brand: p.brand ?? null,
        supplier: p.supplier ?? null,
        unitOfMeasure: p.unitOfMeasure,
        currentStock,
        minStockLevel,
        reorderLevel,
        maxStockLevel,
        unitCost,
        dailyConsumption: Math.round(dailyConsumption * 100) / 100,
        totalConsumed30d: Math.round(totalConsumed * 100) / 100,
        daysRemaining: daysRemaining !== null ? Math.round(daysRemaining) : null,
        leadTimeDays: DEFAULT_LEAD_TIME_DAYS,
        recommendedQty: Math.round(recommendedQty * 10) / 10,
        estimatedCost: Math.round(recommendedQty * unitCost * 100) / 100,
        priority,
      });
    }

    // Sort: critical first, then warning, then watch; within same priority sort by daysRemaining asc
    const priorityOrder = { critical: 0, warning: 1, watch: 2 };
    suggestions.sort((a, b) => {
      const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pd !== 0) return pd;
      const ad = a.daysRemaining ?? 0;
      const bd = b.daysRemaining ?? 0;
      return ad - bd;
    });

    return res.json(suggestions);
  } catch (err) {
    req.log.error({ err }, "Reorder suggestions error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
