import { Router } from "express";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

function hashPassword(plain: string): string {
  return createHash("sha256").update(plain + "inv_salt_2024").digest("hex");
}

function toUserResponse(u: any) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email ?? null,
    role: u.role,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  };
}

function requireAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// GET /users
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await db
      .select({ id: usersTable.id, username: usersTable.username, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .orderBy(usersTable.id);
    return res.json(users.map(toUserResponse));
  } catch (err) {
    req.log.error({ err }, "List users error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { username, password, name, email, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: "username, password and name are required" });
  }
  const validRoles = ["admin", "inventory_manager", "store_keeper", "auditor", "read_only"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const [u] = await db.insert(usersTable).values({
      username,
      passwordHash: hashPassword(password),
      name,
      email: email || null,
      role: role || "read_only",
    }).returning();
    return res.status(201).json(toUserResponse(u));
  } catch (err) {
    req.log.error({ err }, "Create user error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /users/:id
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { username, password, name, email, role } = req.body;
  const validRoles = ["admin", "inventory_manager", "store_keeper", "auditor", "read_only"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found" });

    if (username && username !== existing.username) {
      const conflict = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
      if (conflict.length > 0) return res.status(409).json({ error: "Username already taken" });
    }

    const updates: any = {};
    if (username) updates.username = username;
    if (name) updates.name = name;
    if (email !== undefined) updates.email = email || null;
    if (role) updates.role = role;
    if (password) updates.passwordHash = hashPassword(password);

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    return res.json(toUserResponse(updated));
  } catch (err) {
    req.log.error({ err }, "Update user error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /users/:id
router.delete("/:id", requireAuth, requireAdmin, async (req: any, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.user?.id === id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found" });
    await db.delete(usersTable).where(eq(usersTable.id, id));
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete user error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
