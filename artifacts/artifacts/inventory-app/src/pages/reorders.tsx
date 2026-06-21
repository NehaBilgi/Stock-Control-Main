import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Flame,
  Eye,
  TrendingDown,
  RefreshCw,
  Search,
  Package,
  Clock,
  ShoppingCart,
  DollarSign,
  Info,
  FileText,
} from "lucide-react";
import { POGeneratorDialog } from "./po-generator";

interface ReorderSuggestion {
  productId: string;
  productDbId: number;
  name: string;
  categoryName: string | null;
  locationName: string | null;
  brand: string | null;
  supplier: string | null;
  unitOfMeasure: string;
  currentStock: number;
  minStockLevel: number;
  reorderLevel: number;
  maxStockLevel: number | null;
  unitCost: number;
  dailyConsumption: number;
  totalConsumed30d: number;
  daysRemaining: number | null;
  leadTimeDays: number;
  recommendedQty: number;
  estimatedCost: number;
  priority: "critical" | "warning" | "watch";
}

const PRIORITY_META = {
  critical: {
    label: "Critical",
    icon: Flame,
    classes: "bg-destructive/10 text-destructive border-destructive/30",
    row: "bg-destructive/5 hover:bg-destructive/10",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    row: "bg-amber-500/5 hover:bg-amber-500/10",
  },
  watch: {
    label: "Watch",
    icon: Eye,
    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    row: "hover:bg-muted/50",
  },
};

function DaysBar({ days, lead }: { days: number | null; lead: number }) {
  if (days === null) return <span className="text-muted-foreground text-xs">N/A</span>;
  const pct = Math.min(100, (days / (lead * 4)) * 100);
  const color =
    days <= lead ? "bg-destructive" : days <= lead * 2 ? "bg-amber-500" : "bg-chart-3";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums w-10 text-right">{days}d</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function Reorders() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "watch">("all");
  const [poOpen, setPoOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery<ReorderSuggestion[]>({
    queryKey: ["reorders"],
    queryFn: async () => {
      const token = localStorage.getItem("inventory_token");
      const res = await fetch("/api/reorders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch reorder suggestions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = data ?? [];

  const filtered = suggestions.filter((s) => {
    if (filter !== "all" && s.priority !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.productId.toLowerCase().includes(q) ||
        (s.supplier ?? "").toLowerCase().includes(q) ||
        (s.categoryName ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = suggestions.filter((s) => s.priority === "critical").length;
  const warningCount = suggestions.filter((s) => s.priority === "warning").length;
  const watchCount = suggestions.filter((s) => s.priority === "watch").length;
  const totalCost = suggestions.reduce((s, r) => s + r.estimatedCost, 0);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reorder Suggestions</h1>
          <p className="text-muted-foreground mt-1">
            Based on 30-day consumption history. Lead time assumed: 7 days.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setPoOpen(true)}
            disabled={suggestions.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate PO
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Critical Items"
          value={criticalCount}
          sub="Reorder immediately"
          icon={Flame}
          color="bg-destructive/10 text-destructive"
        />
        <StatCard
          label="Warning Items"
          value={warningCount}
          sub="Order within 14 days"
          icon={AlertTriangle}
          color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Watch Items"
          value={watchCount}
          sub="Monitor closely"
          icon={Eye}
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Est. Reorder Cost"
          value={`₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="To restock all flagged"
          icon={DollarSign}
          color="bg-chart-3/10 text-chart-3"
        />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, supplier, or category…"
            className="pl-9 w-full bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {(["all", "critical", "warning", "watch"] as const).map((p) => (
            <Button
              key={p}
              variant={filter === p ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilter(p)}
              className="capitalize"
            >
              {p === "all" ? "All" : p}
              {p !== "all" && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-xs h-4 px-1 bg-background"
                >
                  {p === "critical" ? criticalCount : p === "warning" ? warningCount : watchCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[90px]">Priority</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">
                <span className="flex items-center justify-end gap-1">
                  Current Stock
                </span>
              </TableHead>
              <TableHead className="text-right">Reorder At</TableHead>
              <TableHead>
                <span className="flex items-center gap-1">
                  Days Left
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Estimated days until stock hits zero at current 30-day consumption rate
                    </TooltipContent>
                  </Tooltip>
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="flex items-center justify-end gap-1">
                  Daily Use
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Average daily consumption over last 30 days ({"{30d total}"}
                    </TooltipContent>
                  </Tooltip>
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="flex items-center justify-end gap-1">
                  Suggest Qty
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Quantity needed to reach maximum stock level
                    </TooltipContent>
                  </Tooltip>
                </span>
              </TableHead>
              <TableHead className="text-right">Est. Cost</TableHead>
              <TableHead>Supplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <TrendingDown className="w-8 h-8 animate-pulse" />
                    <p>Analyzing consumption patterns…</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="w-8 h-8 opacity-40" />
                    <p className="font-medium">
                      {suggestions.length === 0
                        ? "No items need reordering right now"
                        : "No items match your filter"}
                    </p>
                    {suggestions.length === 0 && (
                      <p className="text-xs">All stock levels are healthy based on current consumption.</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const meta = PRIORITY_META[s.priority];
                const PriorityIcon = meta.icon;
                return (
                  <TableRow key={s.productDbId} className={meta.row}>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${meta.classes}`}>
                        <PriorityIcon className="w-3 h-3" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground leading-tight">{s.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{s.productId}</div>
                      {s.brand && <div className="text-xs text-muted-foreground">{s.brand}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.categoryName ?? "—"}
                      {s.locationName && (
                        <div className="text-xs mt-0.5 opacity-70">{s.locationName}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`font-semibold tabular-nums ${s.currentStock <= s.reorderLevel ? "text-destructive" : ""}`}>
                        {s.currentStock}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.unitOfMeasure}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm tabular-nums">{s.reorderLevel}</div>
                      <div className="text-xs text-muted-foreground">{s.unitOfMeasure}</div>
                    </TableCell>
                    <TableCell>
                      <DaysBar days={s.daysRemaining} lead={s.leadTimeDays} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm tabular-nums">
                        {s.dailyConsumption > 0 ? s.dailyConsumption.toFixed(2) : "—"}
                      </div>
                      {s.totalConsumed30d > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {s.totalConsumed30d} / 30d
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold tabular-nums text-foreground">
                        {s.recommendedQty > 0 ? s.recommendedQty : "—"}
                      </div>
                      {s.recommendedQty > 0 && (
                        <div className="text-xs text-muted-foreground">{s.unitOfMeasure}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.estimatedCost > 0 ? (
                        <div className="text-sm font-medium tabular-nums">
                          ₹{s.estimatedCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                      {s.supplier ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing {filtered.length} of {suggestions.length} items •{" "}
            Analysis window: last 30 days
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Lead time: 7 days assumed
          </span>
        </div>
      )}

      <POGeneratorDialog
        open={poOpen}
        onClose={() => setPoOpen(false)}
        suggestions={suggestions}
      />
    </div>
  );
}
