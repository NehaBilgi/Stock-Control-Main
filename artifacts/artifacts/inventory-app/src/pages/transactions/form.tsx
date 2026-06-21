import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTransaction, useListProducts, useListEquipment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Car, Cpu } from "lucide-react";

const txSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  type: z.enum(['stock_in', 'stock_out']),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  vehicleNumber: z.string().optional(),
  department: z.string().optional(),
  issuedTo: z.string().optional(),
  workOrderNumber: z.string().optional(),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
  equipmentId: z.coerce.number().optional(),
  maintenanceNotes: z.string().optional(),
});

type TxFormData = z.infer<typeof txSchema>;

export function TransactionForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreateTransaction();
  const { data: products } = useListProducts({ limit: 1000 });
  const { data: equipmentList = [] } = useListEquipment({ status: "active" });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<TxFormData>({
    resolver: zodResolver(txSchema),
    defaultValues: { type: "stock_out", quantity: 1 }
  });

  const txType = watch("type");
  const equipmentId = watch("equipmentId");

  const onSubmit = (data: TxFormData) => {
    const payload: any = { ...data };
    if (!payload.equipmentId) delete payload.equipmentId;
    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Transaction recorded successfully" });
        queryClient.invalidateQueries();
        setLocation("/transactions");
      },
      onError: (err: any) => {
        toast({ title: "Failed to record transaction", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/transactions")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">New Transaction</h1>
          <p className="text-muted-foreground mt-1">Record a stock in or stock out event.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
          <CardContent className="space-y-6">

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Transaction Type *</Label>
                <Select value={txType} onValueChange={(val: any) => setValue("type", val)}>
                  <SelectTrigger className={txType === 'stock_in' ? 'border-chart-3 text-chart-3' : 'border-chart-4 text-chart-4'}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_in">Stock In (Receive)</SelectItem>
                    <SelectItem value="stock_out">Stock Out (Issue)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product *</Label>
                <Select value={watch("productId")?.toString()} onValueChange={(val) => setValue("productId", parseInt(val, 10))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.data.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.productId} — {p.name} (Stock: {p.currentStock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" {...register("quantity")} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Work Order #</Label>
                <Input {...register("workOrderNumber")} />
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <Label className="flex items-center gap-2 text-primary font-semibold">
                <Car className="w-4 h-4" />
                Vehicle Number <span className="text-muted-foreground font-normal text-xs">(optional — for vehicle-based issuance)</span>
              </Label>
              <Input
                {...register("vehicleNumber")}
                placeholder="e.g. MH-12-AB-1234"
                className="font-mono uppercase"
                onChange={(e) => setValue("vehicleNumber", e.target.value.toUpperCase())}
              />
            </div>

            {/* Equipment / Machine (stock_out only) */}
            {txType === 'stock_out' && (
              <div className="space-y-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <Label className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
                  <Cpu className="w-4 h-4" />
                  Machine / Equipment <span className="text-muted-foreground font-normal text-xs">(optional — links this part to a machine)</span>
                </Label>
                <Select
                  value={equipmentId?.toString() ?? "none"}
                  onValueChange={(val) => setValue("equipmentId", val === "none" ? undefined : parseInt(val, 10))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine (optional)…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No specific machine —</SelectItem>
                    {equipmentList.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        <span className="font-mono font-semibold">{e.assetTag}</span> — {e.name}
                        {e.department ? ` (${e.department})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equipmentId && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Maintenance Notes</Label>
                    <Textarea
                      {...register("maintenanceNotes")}
                      placeholder="e.g. Replaced bearing during scheduled maintenance, bearing was seized…"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {txType === 'stock_out' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input {...register("department")} />
                </div>
                <div className="space-y-2">
                  <Label>Issued To</Label>
                  <Input {...register("issuedTo")} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input {...register("purpose")} />
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea {...register("remarks")} rows={3} />
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <Button variant="outline" type="button" onClick={() => setLocation("/transactions")}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Submit Transaction
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
