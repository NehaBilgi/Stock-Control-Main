import { pgTable, text, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { usersTable } from "./users";
import { equipmentTable } from "./equipment";

export const transactionTypeEnum = pgEnum("transaction_type", ["stock_in", "stock_out"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "restrict" }),
  type: transactionTypeEnum("type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  balanceQuantity: numeric("balance_quantity", { precision: 12, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull().defaultNow(),
  vehicleNumber: text("vehicle_number"),
  issuedTo: text("issued_to"),
  department: text("department"),
  employeeName: text("employee_name"),
  workOrderNumber: text("work_order_number"),
  purpose: text("purpose"),
  remarks: text("remarks"),
  approvedBy: text("approved_by"),
  equipmentId: integer("equipment_id").references(() => equipmentTable.id, { onDelete: "set null" }),
  maintenanceNotes: text("maintenance_notes"),
  createdById: integer("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, transactionId: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
