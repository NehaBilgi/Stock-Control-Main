import React, { useState } from "react";
import { Link } from "wouter";
import { useListTransactions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ArrowUpRight, ArrowDownRight, Download, CalendarRange, X } from "lucide-react";
import { format, startOfMonth, endOfDay } from "date-fns";
import * as XLSX from "xlsx";

type TxType = "all" | "stock_in" | "stock_out";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Transactions() {
  const today = format(new Date(), "yyyy-MM-dd");
  const firstOfMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [txType, setTxType] = useState<TxType>("all");

  const { data: transactionsData, isLoading } = useListTransactions({
    limit: 2000,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo ? format(endOfDay(new Date(dateTo)), "yyyy-MM-dd'T'HH:mm:ss") : undefined,
    type: txType === "all" ? undefined : txType,
  });

  const rows = (transactionsData?.data ?? []).filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx.transactionId.toLowerCase().includes(q) ||
      (tx.productName ?? "").toLowerCase().includes(q) ||
      (tx.department ?? "").toLowerCase().includes(q) ||
      (tx.issuedTo ?? "").toLowerCase().includes(q) ||
      ((tx as any).vehicleNumber ?? "").toLowerCase().includes(q) ||
      (tx.workOrderNumber ?? "").toLowerCase().includes(q)
    );
  });

  const totalStockIn = rows
    .filter((r) => r.type === "stock_in")
    .reduce((s, r) => s + (r.quantity as unknown as number), 0);
  const totalStockOut = rows
    .filter((r) => r.type === "stock_out")
    .reduce((s, r) => s + (r.quantity as unknown as number), 0);

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
  }

  function exportExcel() {
    const data = rows.map((tx, i) => ({
      "#": i + 1,
      "TXN ID": tx.transactionId,
      "Date": format(new Date(tx.transactionDate), "dd/MM/yyyy HH:mm"),
      "Type": tx.type === "stock_in" ? "Stock In" : "Stock Out",
      "Product": tx.productName ?? "",
      "Barcode": tx.barcode ?? "",
      "Quantity": tx.quantity,
      "Balance After": tx.balanceQuantity,
      "Vehicle No.": (tx as any).vehicleNumber ?? "",
      "Department": tx.department ?? "",
      "Issued To": tx.issuedTo ?? "",
      "Work Order": tx.workOrderNumber ?? "",
      "Purpose": tx.purpose ?? "",
      "Remarks": tx.remarks ?? "",
      "Recorded By": (tx as any).createdBy ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 4 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 32 }, { wch: 14 },
      { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      { wch: 14 }, { wch: 20 }, { wch: 24 }, { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Summary sheet
    const summaryRows = [
      ["IndustrialOps — Transaction Export"],
      [],
      ["Period:", dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : "All time"],
      ["Type filter:", txType === "all" ? "All" : txType === "stock_in" ? "Stock In only" : "Stock Out only"],
      ["Total records:", rows.length],
      ["Total Stock In (qty):", totalStockIn],
      ["Total Stock Out (qty):", totalStockOut],
      ["Exported on:", format(new Date(), "dd/MM/yyyy HH:mm")],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws2["!cols"] = [{ wch: 22 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    const filename = `Transactions_${dateFrom || "all"}_to_${dateTo || "all"}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">Full audit log of all stock movements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Link href="/transactions/new">
            <Button className="font-semibold shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date From */}
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarRange className="w-3 h-3" /> From Date
            </Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-xs text-muted-foreground">To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Type filter */}
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-xs text-muted-foreground">Transaction Type</Label>
            <Select value={txType} onValueChange={(v) => setTxType(v as TxType)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock_in">Stock In only</SelectItem>
                <SelectItem value="stock_out">Stock Out only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear */}
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilter} className="h-9 text-muted-foreground">
              <X className="w-3.5 h-3.5 mr-1.5" /> Clear dates
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, product, vehicle no., department, work order…"
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary stat row */}
      {!isLoading && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-lg px-4 py-3">
            <p className="text-xs text-muted-foreground">Records shown</p>
            <p className="text-2xl font-bold">{rows.length}</p>
          </div>
          <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg px-4 py-3">
            <p className="text-xs text-chart-3">Total Stock In</p>
            <p className="text-2xl font-bold text-chart-3 tabular-nums">{totalStockIn.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg px-4 py-3">
            <p className="text-xs text-chart-4">Total Stock Out</p>
            <p className="text-2xl font-bold text-chart-4 tabular-nums">{totalStockOut.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[110px]">TXN ID</TableHead>
              <TableHead className="w-[130px]">Date</TableHead>
              <TableHead className="w-[90px]">Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right w-[90px]">Qty</TableHead>
              <TableHead className="w-[120px]">Vehicle No.</TableHead>
              <TableHead>Dept / Issued To</TableHead>
              <TableHead className="w-[110px]">Work Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Loading transactions…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No transactions found for the selected filters.
                </TableCell>
              </TableRow>
            ) : rows.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs font-semibold">{tx.transactionId}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(tx.transactionDate), "dd/MM/yy HH:mm")}
                </TableCell>
                <TableCell>
                  {tx.type === "stock_in" ? (
                    <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20 flex items-center w-fit gap-1 text-xs">
                      <ArrowDownRight className="w-3 h-3" /> In
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20 flex items-center w-fit gap-1 text-xs">
                      <ArrowUpRight className="w-3 h-3" /> Out
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{tx.productName}</div>
                  <div className="text-xs text-muted-foreground">{tx.barcode || ""}</div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-bold tabular-nums ${tx.type === "stock_in" ? "text-chart-3" : "text-chart-4"}`}>
                    {tx.type === "stock_in" ? "+" : "-"}{tx.quantity}
                  </span>
                </TableCell>
                <TableCell>
                  {(tx as any).vehicleNumber ? (
                    <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {(tx as any).vehicleNumber}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {tx.department || tx.issuedTo || "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {tx.workOrderNumber || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && rows.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            {rows.length} record{rows.length !== 1 ? "s" : ""}
            {dateFrom && dateTo ? ` · ${dateFrom} → ${dateTo}` : ""}
          </span>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <Download className="w-3 h-3" /> Download as Excel
          </button>
        </div>
      )}
    </div>
  );
}
