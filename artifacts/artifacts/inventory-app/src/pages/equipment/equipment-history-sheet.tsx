import React from "react";
import { useGetEquipmentHistory } from "@workspace/api-client-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, Cpu, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  equipment: any | null;
}

export function EquipmentHistorySheet({ open, onClose, equipment }: Props) {
  const { data: history = [], isLoading } = useGetEquipmentHistory(
    equipment?.id ?? 0,
    { query: { enabled: !!equipment?.id } }
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            {equipment?.name ?? "Equipment"} — Part Usage History
          </SheetTitle>
          <SheetDescription>
            Asset Tag: <span className="font-mono font-semibold">{equipment?.assetTag}</span>
            {equipment?.department && ` · ${equipment.department}`}
            {equipment?.location && ` · ${equipment.location}`}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="text-center text-muted-foreground py-16">Loading history…</div>
        )}

        {!isLoading && history.length === 0 && (
          <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10 opacity-30" />
            <p className="text-sm">No parts have been recorded for this machine yet.</p>
            <p className="text-xs">When creating a Stock Out transaction, select this equipment to log the part usage here.</p>
          </div>
        )}

        {!isLoading && history.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">{history.length} transaction{history.length !== 1 ? "s" : ""} recorded</p>
            {history.map((tx: any) => (
              <div key={tx.id} className="border rounded-lg p-4 bg-card hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {tx.type === "stock_in" ? (
                        <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-xs flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" /> Stock In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20 text-xs flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Stock Out
                        </Badge>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">{tx.transactionId}</span>
                    </div>
                    <p className="font-semibold text-sm">{tx.productName ?? "Unknown part"}</p>
                    {tx.maintenanceNotes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{tx.maintenanceNotes}"</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {tx.workOrderNumber && <span>WO: <span className="font-medium text-foreground">{tx.workOrderNumber}</span></span>}
                      {tx.department && <span>Dept: {tx.department}</span>}
                      {tx.issuedTo && <span>Issued to: {tx.issuedTo}</span>}
                      {tx.createdBy && <span>By: {tx.createdBy}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold tabular-nums ${tx.type === "stock_in" ? "text-chart-3" : "text-chart-4"}`}>
                      {tx.type === "stock_in" ? "+" : "−"}{tx.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(tx.transactionDate), "dd/MM/yy")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(tx.transactionDate), "HH:mm")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
