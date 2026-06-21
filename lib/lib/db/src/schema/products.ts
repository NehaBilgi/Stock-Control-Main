import { pgTable, text, serial, timestamp, integer, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { locationsTable } from "./locations";

export const productStatusEnum = pgEnum("product_status", ["active", "inactive"]);

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull().unique(),
  barcode: text("barcode").unique(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  brand: text("brand"),
  manufacturer: text("manufacturer"),
  description: text("description"),
  unitOfMeasure: text("unit_of_measure").notNull().default("Nos"),
  partNumber: text("part_number"),
  supplier: text("supplier"),
  locationId: integer("location_id").references(() => locationsTable.id, { onDelete: "set null" }),
  rackNumber: text("rack_number"),
  binNumber: text("bin_number"),
  minStockLevel: numeric("min_stock_level", { precision: 12, scale: 2 }).notNull().default("0"),
  maxStockLevel: numeric("max_stock_level", { precision: 12, scale: 2 }),
  reorderLevel: numeric("reorder_level", { precision: 12, scale: 2 }).notNull().default("0"),
  currentStock: numeric("current_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  reservedStock: numeric("reserved_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  imageUrl: text("image_url"),
  purchaseDate: date("purchase_date", { mode: "string" }),
  manufacturingDate: date("manufacturing_date", { mode: "string" }),
  expiryDate: date("expiry_date", { mode: "string" }),
  lastIssuedDate: date("last_issued_date", { mode: "string" }),
  lastReceivedDate: date("last_received_date", { mode: "string" }),
  warrantyExpiry: date("warranty_expiry", { mode: "string" }),
  status: productStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, productId: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
