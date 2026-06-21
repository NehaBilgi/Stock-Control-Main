import { Router } from "express";
import { eq, and, or, ilike, sql, lt, lte } from "drizzle-orm";
import { db, productsTable, categoriesTable, locationsTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

function toProductResponse(row: any) {
  const currentStock = parseFloat(row.currentStock ?? "0");
  const reservedStock = parseFloat(row.reservedStock ?? "0");
  const availableStock = Math.max(0, currentStock - reservedStock);
  const minStockLevel = parseFloat(row.minStockLevel ?? "0");
  const reorderLevel = parseFloat(row.reorderLevel ?? "0");
  const unitCost = parseFloat(row.unitCost ?? "0");

  let stockStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
  if (currentStock <= 0) stockStatus = "out_of_stock";
  else if (currentStock <= minStockLevel) stockStatus = "low_stock";

  return {
    ...row,
    categoryName: row.categoryName ?? null,
    locationName: row.locationName ?? null,
    currentStock,
    reservedStock,
    availableStock,
    minStockLevel,
    maxStockLevel: row.maxStockLevel ? parseFloat(row.maxStockLevel) : null,
    reorderLevel,
    unitCost,
    totalValue: currentStock * unitCost,
    stockStatus,
  };
}

const productCols = {
  id: productsTable.id,
  productId: productsTable.productId,
  barcode: productsTable.barcode,
  name: productsTable.name,
  categoryId: productsTable.categoryId,
  categoryName: categoriesTable.name,
  brand: productsTable.brand,
  manufacturer: productsTable.manufacturer,
  description: productsTable.description,
  unitOfMeasure: productsTable.unitOfMeasure,
  partNumber: productsTable.partNumber,
  supplier: productsTable.supplier,
  locationId: productsTable.locationId,
  locationName: locationsTable.name,
  rackNumber: productsTable.rackNumber,
  binNumber: productsTable.binNumber,
  minStockLevel: productsTable.minStockLevel,
  maxStockLevel: productsTable.maxStockLevel,
  reorderLevel: productsTable.reorderLevel,
  currentStock: productsTable.currentStock,
  reservedStock: productsTable.reservedStock,
  unitCost: productsTable.unitCost,
  imageUrl: productsTable.imageUrl,
  purchaseDate: productsTable.purchaseDate,
  manufacturingDate: productsTable.manufacturingDate,
  expiryDate: productsTable.expiryDate,
  lastIssuedDate: productsTable.lastIssuedDate,
  lastReceivedDate: productsTable.lastReceivedDate,
  warrantyExpiry: productsTable.warrantyExpiry,
  status: productsTable.status,
  createdAt: productsTable.createdAt,
};

async function generateProductId(): Promise<string> {
  const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable);
  return `PRD-${String((count ?? 0) + 1).padStart(5, "0")}`;
}

// GET /products
router.get("/", requireAuth, async (req, res) => {
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = parseInt(req.query.limit as string ?? "20", 10);
  const search = req.query.search as string | undefined;
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
  const locationId = req.query.locationId ? parseInt(req.query.locationId as string, 10) : undefined;
  const status = req.query.status as string | undefined;
  const stockStatus = req.query.stockStatus as string | undefined;
  const brand = req.query.brand as string | undefined;
  const supplier = req.query.supplier as string | undefined;
  const offset = (page - 1) * limit;

  try {
    const conditions: any[] = [];
    if (search) conditions.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.barcode, `%${search}%`), ilike(productsTable.partNumber, `%${search}%`)));
    if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
    if (locationId) conditions.push(eq(productsTable.locationId, locationId));
    if (status) conditions.push(eq(productsTable.status, status as any));
    if (brand) conditions.push(ilike(productsTable.brand, `%${brand}%`));
    if (supplier) conditions.push(ilike(productsTable.supplier, `%${supplier}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select(productCols)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .$dynamic();

    if (where) query = query.where(where);

    let allRows = await query;

    // Filter by stockStatus in memory (computed field)
    if (stockStatus) {
      allRows = allRows.filter((r) => {
        const cs = parseFloat(r.currentStock ?? "0");
        const min = parseFloat(r.minStockLevel ?? "0");
        if (stockStatus === "out_of_stock") return cs <= 0;
        if (stockStatus === "low_stock") return cs > 0 && cs <= min;
        return cs > min;
      });
    }

    const total = allRows.length;
    const data = allRows.slice(offset, offset + limit).map(toProductResponse);

    return res.json({ data, total, page, limit });
  } catch (err) {
    req.log.error({ err }, "List products error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/barcode/:barcode
router.get("/barcode/:barcode", requireAuth, async (req, res) => {
  const { barcode } = req.params;
  try {
    const [row] = await db
      .select(productCols)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .where(eq(productsTable.barcode, barcode))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Product not found" });
    return res.json(toProductResponse(row));
  } catch (err) {
    req.log.error({ err }, "Get by barcode error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [row] = await db
      .select(productCols)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Product not found" });
    return res.json(toProductResponse(row));
  } catch (err) {
    req.log.error({ err }, "Get product error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/", requireAuth, async (req: any, res) => {
  const body = req.body;
  if (!body.name || !body.unitOfMeasure) {
    return res.status(400).json({ error: "Name and unitOfMeasure are required" });
  }
  try {
    const productId = await generateProductId();
    const [row] = await db.insert(productsTable).values({
      productId,
      barcode: body.barcode || null,
      name: body.name,
      categoryId: body.categoryId || null,
      brand: body.brand || null,
      manufacturer: body.manufacturer || null,
      description: body.description || null,
      unitOfMeasure: body.unitOfMeasure,
      partNumber: body.partNumber || null,
      supplier: body.supplier || null,
      locationId: body.locationId || null,
      rackNumber: body.rackNumber || null,
      binNumber: body.binNumber || null,
      minStockLevel: body.minStockLevel?.toString() ?? "0",
      maxStockLevel: body.maxStockLevel?.toString() ?? null,
      reorderLevel: body.reorderLevel?.toString() ?? "0",
      currentStock: body.currentStock?.toString() ?? "0",
      unitCost: body.unitCost?.toString() ?? "0",
      imageUrl: body.imageUrl || null,
      purchaseDate: body.purchaseDate || null,
      manufacturingDate: body.manufacturingDate || null,
      expiryDate: body.expiryDate || null,
      warrantyExpiry: body.warrantyExpiry || null,
      status: body.status || "active",
    }).returning();

    const [full] = await db
      .select(productCols)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .where(eq(productsTable.id, row.id))
      .limit(1);

    return res.status(201).json(toProductResponse(full));
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "Barcode already exists" });
    req.log.error({ err }, "Create product error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /products/:id
router.patch("/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body;
  try {
    const updateData: any = {};
    const fields = ["barcode","name","categoryId","brand","manufacturer","description","unitOfMeasure","partNumber","supplier","locationId","rackNumber","binNumber","imageUrl","purchaseDate","manufacturingDate","expiryDate","warrantyExpiry","status"];
    for (const f of fields) {
      if (f in body) updateData[f] = body[f] === undefined ? null : body[f];
    }
    const numFields = ["minStockLevel","maxStockLevel","reorderLevel","unitCost"];
    for (const f of numFields) {
      if (f in body) updateData[f] = body[f]?.toString() ?? null;
    }
    await db.update(productsTable).set(updateData).where(eq(productsTable.id, id));
    const [full] = await db
      .select(productCols)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(locationsTable, eq(productsTable.locationId, locationsTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);
    if (!full) return res.status(404).json({ error: "Not found" });
    return res.json(toProductResponse(full));
  } catch (err) {
    req.log.error({ err }, "Update product error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /products/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(productsTable).where(eq(productsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products/import
router.post("/import", requireAuth, async (req: any, res) => {
  const { products: rows } = req.body as { products: any[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "No products provided" });
  }

  try {
    const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable);
    const locations = await db.select({ id: locationsTable.id, name: locationsTable.name }).from(locationsTable);
    const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const locMap = new Map(locations.map((l) => [l.name.toLowerCase(), l.id]));

    const [{ count: existingCount }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable);
    let nextSeq = (existingCount ?? 0) + 1;

    let imported = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2;

      if (!r.name?.trim()) {
        errors.push({ row: rowNum, message: "Name is required" });
        continue;
      }
      if (!r.unitOfMeasure?.trim()) {
        errors.push({ row: rowNum, message: "Unit of Measure is required" });
        continue;
      }

      const categoryId = r.category ? catMap.get(r.category.toString().toLowerCase()) ?? null : null;
      const locationId = r.location ? locMap.get(r.location.toString().toLowerCase()) ?? null : null;

      const productId = `PRD-${String(nextSeq++).padStart(5, "0")}`;

      try {
        await db.insert(productsTable).values({
          productId,
          name: r.name.trim(),
          barcode: r.barcode?.toString().trim() || null,
          categoryId: categoryId ?? null,
          brand: r.brand?.toString().trim() || null,
          manufacturer: r.manufacturer?.toString().trim() || null,
          description: r.description?.toString().trim() || null,
          unitOfMeasure: r.unitOfMeasure.toString().trim(),
          partNumber: r.partNumber?.toString().trim() || null,
          supplier: r.supplier?.toString().trim() || null,
          locationId: locationId ?? null,
          rackNumber: r.rackNumber?.toString().trim() || null,
          binNumber: r.binNumber?.toString().trim() || null,
          minStockLevel: r.minStockLevel?.toString() ?? "0",
          maxStockLevel: r.maxStockLevel?.toString() ?? null,
          reorderLevel: r.reorderLevel?.toString() ?? "0",
          currentStock: r.currentStock?.toString() ?? "0",
          unitCost: r.unitCost?.toString() ?? "0",
          purchaseDate: r.purchaseDate?.toString() || null,
          expiryDate: r.expiryDate?.toString() || null,
          warrantyExpiry: r.warrantyExpiry?.toString() || null,
          status: (r.status === "inactive" ? "inactive" : "active") as any,
        });
        imported++;
      } catch (err: any) {
        if (err?.code === "23505") {
          errors.push({ row: rowNum, message: `Barcode "${r.barcode}" already exists` });
        } else {
          errors.push({ row: rowNum, message: "Database error" });
        }
      }
    }

    return res.json({ imported, skipped: errors.length, errors });
  } catch (err) {
    req.log.error({ err }, "Import products error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
