import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEquipment, useUpdateEquipment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const schema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
  name: z.string().min(1, "Name is required"),
  type: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(["active", "under_maintenance", "decommissioned"]).default("active"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  item: any | null;
}

export function EquipmentDialog({ open, onClose, item }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  const status = watch("status");

  useEffect(() => {
    if (open) {
      if (item) {
        reset({
          assetTag: item.assetTag ?? "",
          name: item.name ?? "",
          type: item.type ?? "",
          department: item.department ?? "",
          location: item.location ?? "",
          manufacturer: item.manufacturer ?? "",
          model: item.model ?? "",
          serialNumber: item.serialNumber ?? "",
          status: item.status ?? "active",
          notes: item.notes ?? "",
        });
      } else {
        reset({ status: "active" });
      }
    }
  }, [open, item, reset]);

  function onSubmit(data: FormData) {
    const payload = {
      assetTag: data.assetTag,
      name: data.name,
      type: data.type || undefined,
      department: data.department || undefined,
      location: data.location || undefined,
      manufacturer: data.manufacturer || undefined,
      model: data.model || undefined,
      serialNumber: data.serialNumber || undefined,
      status: data.status,
      notes: data.notes || undefined,
    };

    if (isEdit) {
      updateMutation.mutate({ id: item.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Equipment updated" });
          queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
          onClose();
        },
        onError: (err: any) => {
          toast({ title: "Failed to update", description: err.message, variant: "destructive" });
        },
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Equipment added" });
          queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
          onClose();
        },
        onError: (err: any) => {
          toast({ title: "Failed to add", description: err.message, variant: "destructive" });
        },
      });
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {/* Row 1: Asset Tag + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Asset Tag *</Label>
              <Input {...register("assetTag")} placeholder="e.g. EQP-0042" className="font-mono" />
              {errors.assetTag && <p className="text-xs text-destructive">{errors.assetTag.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Equipment Name *</Label>
              <Input {...register("name")} placeholder="e.g. CNC Lathe Machine" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          {/* Row 2: Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type / Category</Label>
              <Input {...register("type")} placeholder="e.g. Lathe, Compressor, Pump" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: any) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Department + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input {...register("department")} placeholder="e.g. Production, Workshop" />
            </div>
            <div className="space-y-1.5">
              <Label>Location / Bay</Label>
              <Input {...register("location")} placeholder="e.g. Bay 3, Shop Floor A" />
            </div>
          </div>

          {/* Row 4: Manufacturer + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Manufacturer</Label>
              <Input {...register("manufacturer")} placeholder="e.g. SKF, Siemens" />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input {...register("model")} placeholder="e.g. VFD-2000" />
            </div>
          </div>

          {/* Serial Number */}
          <div className="space-y-1.5">
            <Label>Serial Number</Label>
            <Input {...register("serialNumber")} placeholder="Manufacturer serial number" className="font-mono" />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Any additional details about this equipment…" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isBusy} className="gap-2">
              <Save className="w-4 h-4" />
              {isBusy ? "Saving…" : isEdit ? "Save Changes" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
