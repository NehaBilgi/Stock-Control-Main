import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Package2 } from "lucide-react";

interface Product {
  id: number;
  productId: string;
  name: string;
  currentStock: number;
  unitOfMeasure: string;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

const REASONS = [
  "Physical count correction",
  "Damaged / write-off",
  "Found surplus stock",
  "Opening stock entry",
  "Annual stock take",
  "Transfer from another location",
  "Other",
];

export function StockAdjustDialog({ open, onClose, product }: Props) {
  const { toast } = useToast();
  const token = useAuth((s) => s.token);
  const qc = useQueryClient();

  const [newQty, setNewQty] = useState<string>("");
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  React.useEffect(() => {
    if (open && product) {
      setNewQty(product.currentStock.toString());
      setReason(REASONS[0]);
      setCustomReason("");
    }
  }, [open, product]);

  const currentStock = product?.currentStock ?? 0;
  const newQtyNum = parseFloat(newQty) || 0;
  const diff = newQtyNum - currentStock;
  const isIncrease = diff > 0;
  const isDecrease = diff < 0;
  const noChange = diff === 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product");
      if (noChange) throw new Error("No change in stock quantity");
      if (newQtyNum < 0) throw new Error("Stock cannot be negative");

      const remarkText = reason === "Other" ? customReason || "Manual adjustment" : reason;
      const body = {
        productId: product.id,
        type: isIncrease ? "stock_in" : "stock_out",
        quantity: Math.abs(diff),
        purpose: "Stock Adjustment",
        remarks: remarkText,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to adjust stock");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock adjusted",
        description: `${product?.name} → ${newQtyNum} ${product?.unitOfMeasure}`,
      });
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: any) => {
      toast({ title: "Adjustment failed", description: e.message, variant: "destructive" });
    },
  });

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="w-5 h-5 text-primary" />
            Adjust Stock
          </DialogTitle>
          <DialogDescription>
            Set the correct quantity for <span className="font-semibold text-foreground">{product.name}</span>. A correction transaction will be created automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Current vs New */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
              <p className="text-2xl font-bold tabular-nums">{currentStock}</p>
              <p className="text-xs text-muted-foreground">{product.unitOfMeasure}</p>
            </div>
            <div className={`p-3 rounded-lg text-center border-2 transition-colors ${
              isIncrease ? "border-chart-3/40 bg-chart-3/5" :
              isDecrease ? "border-chart-4/40 bg-chart-4/5" :
              "border-border bg-muted/30"
            }`}>
              <p className="text-xs text-muted-foreground mb-1">New Stock</p>
              <p className={`text-2xl font-bold tabular-nums ${
                isIncrease ? "text-chart-3" : isDecrease ? "text-chart-4" : ""
              }`}>{newQtyNum || 0}</p>
              <p className="text-xs text-muted-foreground">{product.unitOfMeasure}</p>
            </div>
          </div>

          {/* Difference pill */}
          {!noChange && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
              isIncrease ? "bg-chart-3/10 text-chart-3" : "bg-chart-4/10 text-chart-4"
            }`}>
              {isIncrease
                ? <ArrowDownRight className="w-4 h-4 shrink-0" />
                : <ArrowUpRight className="w-4 h-4 shrink-0" />
              }
              {isIncrease ? `Stock In +${diff}` : `Stock Out ${diff}`} {product.unitOfMeasure} will be recorded
            </div>
          )}

          {newQtyNum < 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-destructive/10 text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Stock cannot be negative
            </div>
          )}

          {/* New quantity input */}
          <div className="space-y-1.5">
            <Label>New Quantity ({product.unitOfMeasure})</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="text-lg font-mono font-bold"
              autoFocus
            />
            {product.minStockLevel != null && (
              <p className="text-xs text-muted-foreground">
                Min: {product.minStockLevel} · Max: {product.maxStockLevel ?? "—"} {product.unitOfMeasure}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason for Adjustment</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === "Other" && (
              <Input
                placeholder="Describe the reason…"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || noChange || newQtyNum < 0 || (reason === "Other" && !customReason.trim())}
            >
              {mutation.isPending ? "Saving…" : "Apply Adjustment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
