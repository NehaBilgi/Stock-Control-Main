import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff, UserCog } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin", desc: "Full access — manage users, products, transactions", color: "bg-destructive/10 text-destructive border-destructive/20" },
  { value: "inventory_manager", label: "Inventory Manager", desc: "Manage products, transactions, reports", color: "bg-primary/10 text-primary border-primary/20" },
  { value: "store_keeper", label: "Store Keeper", desc: "Record stock in/out transactions, scan barcodes", color: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  { value: "auditor", label: "Auditor", desc: "Read-only access to all data and reports", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  { value: "read_only", label: "Read Only", desc: "View dashboard and products only", color: "bg-muted text-muted-foreground border-muted" },
];

function roleMeta(role: string) {
  return ROLES.find((r) => r.value === role) ?? ROLES[4];
}

interface UserRecord {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  createdAt: string;
}

function useUsersApi() {
  const token = useAuth((s) => s.token);
  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  const list = () => fetch("/api/users", { headers: headers() }).then((r) => r.json()) as Promise<UserRecord[]>;
  const create = (body: any) => fetch("/api/users", { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
  const update = (id: number, body: any) => fetch(`/api/users/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
  const remove = (id: number) => fetch(`/api/users/${id}`, { method: "DELETE", headers: headers() }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });

  return { list, create, update, remove };
}

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  editUser?: UserRecord | null;
}

function UserFormDialog({ open, onClose, editUser }: UserFormProps) {
  const api = useUsersApi();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", name: "", email: "", role: "store_keeper" });

  React.useEffect(() => {
    if (editUser) {
      setForm({ username: editUser.username, password: "", name: editUser.name, email: editUser.email ?? "", role: editUser.role });
    } else {
      setForm({ username: "", password: "", name: "", email: "", role: "store_keeper" });
    }
  }, [editUser, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body: any = { username: form.username, name: form.name, email: form.email || undefined, role: form.role };
      if (form.password) body.password = form.password;
      if (!editUser && !form.password) throw new Error("Password is required for new users");
      if (!editUser) body.password = form.password;
      return editUser ? api.update(editUser.id, body) : api.create(body);
    },
    onSuccess: () => {
      toast({ title: editUser ? "User updated" : "User created" });
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editUser ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Raj Sharma" />
            </div>
            <div className="space-y-1.5">
              <Label>Username *</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="rajsharma" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{editUser ? "New Password" : "Password *"} {editUser && <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>}</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editUser ? "Enter new password to change" : "Min 6 characters"}
                className="pr-10"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="raj@company.com" />
          </div>

          <div className="space-y-1.5">
            <Label>Role & Permissions *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div>
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.role && (
              <p className="text-xs text-muted-foreground mt-1">{roleMeta(form.role).desc}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {editUser ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Users() {
  const api = useUsersApi();
  const qc = useQueryClient();
  const { toast } = useToast();
  const currentUser = useAuth((s) => s.user);

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["users"],
    queryFn: api.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => { toast({ title: "User deleted" }); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditUser(null); setFormOpen(true); };
  const openEdit = (u: UserRecord) => { setEditUser(u); setFormOpen(true); };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <UserCog className="w-8 h-8 text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage system users, passwords, and role-based access control.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Role reference card */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ROLES.map((r) => (
          <Card key={r.value} className="p-3">
            <Badge variant="outline" className={`text-xs ${r.color} mb-1.5`}>{r.label}</Badge>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>System Users</CardTitle>
          <CardDescription>{users.length} user{users.length !== 1 ? "s" : ""} registered</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : users.map((u) => {
                const meta = roleMeta(u.role);
                const isSelf = currentUser?.id === u.id;
                return (
                  <TableRow key={u.id} className={isSelf ? "bg-primary/5" : "hover:bg-muted/50"}>
                    <TableCell className="font-semibold">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-primary font-normal">(you)</span>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${meta.color}`}>
                        <ShieldCheck className="w-3 h-3 mr-1" />{meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(`Delete user "${u.name}"?`)) deleteMutation.mutate(u.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormDialog open={formOpen} onClose={() => setFormOpen(false)} editUser={editUser} />
    </div>
  );
}
