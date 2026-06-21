import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable, locationsTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

// GET /alerts
router.get("/", requireAuth, async (req, res) => {
  const typeFilter = req.query.type as string | undefined;

  try {
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        currentStock: productsTable.currentStock,
        minStockLevel: productsTable.minStockLevel,
        reorderLevel: productsTable.reorderLevel,
        expiryDate: productsTable.expiryDate,
        warrantyExpiry: productsTable.warrantyExpiry,
        status: productsTable.status,
      })
      .from(productsTable)
      .where(eq(productsTable.status, "active"));

    const alerts: any[] = [];
    let alertId = 1;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const in30Str = in30.toISOString().split("T")[0];
    const in90 = new Date(today); in90.setDate(in90.getDate() + 90);
    const in90Str = in90.toISOString().split("T")[0];

    for (const p of products) {
      const cs = parseFloat(p.currentStock ?? "0");
      const min = parseFloat(p.minStockLevel ?? "0");
      const reorder = parseFloat(p.reorderLevel ?? "0");

      if (cs <= 0) {
        alerts.push({
          id: alertId++,
          type: "out_of_stock",
          productId: p.id,
          productName: p.name,
          message: `${p.name} is out of stock`,
          severity: "critical",
          currentStock: cs,
          threshold: min,
          expiryDate: null,
        });
      } else if (cs <= min) {
        alerts.push({
          id: alertId++,
          type: "low_stock",
          productId: p.id,
          productName: p.name,
          message: `${p.name} is below minimum stock level (${cs} ${cs === 1 ? "unit" : "units"} remaining)`,
          severity: cs <= reorder ? "critical" : "warning",
          currentStock: cs,
          threshold: min,
          expiryDate: null,
        });
      } else if (cs <= reorder) {
        alerts.push({
          id: alertId++,
          type: "reorder",
          productId: p.id,
          productName: p.name,
          message: `${p.name} has reached reorder level — place a new order`,
          severity: "warning",
          currentStock: cs,
          threshold: reorder,
          expiryDate: null,
        });
      }

      if (p.expiryDate && p.expiryDate >= todayStr && p.expiryDate <= in30Str) {
        alerts.push({
          id: alertId++,
          type: "expiry",
          productId: p.id,
          productName: p.name,
          message: `${p.name} expires on ${p.expiryDate}`,
          severity: "critical",
          currentStock: cs,
          threshold: null,
          expiryDate: p.expiryDate,
        });
      } else if (p.expiryDate && p.expiryDate >= todayStr && p.expiryDate <= in90Str) {
        alerts.push({
          id: alertId++,
          type: "expiry",
          productId: p.id,
          productName: p.name,
          message: `${p.name} expires soon on ${p.expiryDate}`,
          severity: "warning",
          currentStock: cs,
          threshold: null,
          expiryDate: p.expiryDate,
        });
      }

      if (p.warrantyExpiry && p.warrantyExpiry >= todayStr && p.warrantyExpiry <= in30Str) {
        alerts.push({
          id: alertId++,
          type: "warranty_expiry",
          productId: p.id,
          productName: p.name,
          message: `${p.name} warranty expires on ${p.warrantyExpiry}`,
          severity: "warning",
          currentStock: cs,
          threshold: null,
          expiryDate: p.warrantyExpiry,
        });
      }
    }

    const filtered = typeFilter ? alerts.filter((a) => a.type === typeFilter) : alerts;
    return res.json(filtered);
  } catch (err) {
    req.log.error({ err }, "List alerts error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
