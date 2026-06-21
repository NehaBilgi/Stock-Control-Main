import React, { useState } from "react";
import { useListEquipment, useDeleteEquipment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Cpu, Pencil, Trash2, History } from "lucide-react";
import { EquipmentDialog } from "./equipment-dialog";
import { EquipmentHistorySheet } from "./equipment-history-sheet";

type StatusFilter = "all" | "active" | "under_maintenance" | "decommissioned";

function statusBadge(status: string) {
  if (status === "active") return <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">Active</Badge>;
  if (status === "under_maintenance") return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300">Under Maintenance</Badge>;
  return <Badge variant="outline" className="bg-muted text-muted-foreground">Decommissioned</Badge>;
}

export function Equipment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);

  const { data: equipment = [], isLoading, refetch } = useListEquipment({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteMutation = useDeleteEquipment();

  const rows = equipment.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.assetTag.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.type ?? "").toLowerCase().includes(q) ||
      (e.department ?? "").toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q)
    );
  });

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Equipment deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Failed to delete", variant: "destructive" });
        setDeleteId(null);
      },
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Cpu className="h-8 w-8 text-primary" />
            Equipment Register
          </h1>
          <p className="text-muted-foreground mt-1">
            Asset register for all machines and equipment. Track which parts were used on each machine.
          </p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true); }} className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tag, name, type, department…"
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-md bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">Asset Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Make / Model</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Loading equipment…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {equipment.length === 0 ? "No equipment added yet. Click 'Add Equipment' to start." : "No equipment matches your search."}
                </TableCell>
              </TableRow>
            ) : rows.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50">
                <TableCell>
                  <span className="font-mono text-sm font-bold text-primary">{item.assetTag}</span>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  {item.serialNumber && <div className="text-xs text-muted-foreground">S/N: {item.serialNumber}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground">{item.type || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{item.department || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{item.location || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {[item.manufacturer, item.model].filter(Boolean).join(" / ") || "—"}
                </TableCell>
                <TableCell>{statusBadge(item.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline" size="sm" className="h-7 px-2 text-xs gap-1"
                      onClick={() => setHistoryItem(item)}
                    >
                      <History className="w-3 h-3" /> History
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => { setEditItem(item); setDialogOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && <p className="text-xs text-muted-foreground px-1">{rows.length} equipment records</p>}

      <EquipmentDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); refetch(); }}
        item={editItem}
      />

      <EquipmentHistorySheet
        open={!!historyItem}
        onClose={() => setHistoryItem(null)}
        equipment={historyItem}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this equipment record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the equipment record. Past transactions linked to it will remain in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
