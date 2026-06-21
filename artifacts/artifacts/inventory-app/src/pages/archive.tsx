import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Archive,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface ArchiveRow {
  transactionId: string;
  transactionDate: string;
  type: string;
  productName: string;
  barcode: string;
  quantity: number;
  balanceQuantity: number;
  vehicleNumber: string;
  department: string;
  issuedTo: string;
  workOrderNumber: string;
  purpose: string;
  remarks: string;
  createdBy: string;
}

interface PreviewData {
  year: number;
  count: number;
  stockInCount: number;
  stockOutCount: number;
  totalStockIn: number;
  totalStockOut: number;
  rows: ArchiveRow[];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2023 }, (_, i) => CURRENT_YEAR - 1 - i);

type Step = "select" | "preview" | "exported" | "deleted";

export function ArchivePage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [year, setYear] = useState<string>("");
  const [step, setStep] = useState<Step>("select");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  const isAdmin = user?.role === "admin";

  async function fetchPreview() {
    if (!year) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/archive/preview?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: PreviewData = await res.json();
      setPreview(data);
      setStep("preview");
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to load preview", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function exportExcel() {
    if (!preview) return;
    const data = preview.rows.map((r, i) => ({
      "#": i + 1,
      "TXN ID": r.transactionId,
      "Date": format(new Date(r.transactionDate), "dd/MM/yyyy HH:mm"),
      "Type": r.type === "stock_in" ? "Stock In" : "Stock Out",
      "Product": r.productName,
      "Barcode": r.barcode,
      "Quantity": r.quantity,
      "Balance After": r.balanceQuantity,
      "Vehicle No.": r.vehicleNumber,
      "Department": r.department,
      "Issued To": r.issuedTo,
      "Work Order": r.workOrderNumber,
      "Purpose": r.purpose,
      "Remarks": r.remarks,
      "Recorded By": r.createdBy,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 4 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 32 }, { wch: 14 },
      { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      { wch: 14 }, { wch: 20 }, { wch: 24 }, { wch: 16 },
    ];

    const summaryRows = [
      ["IndustrialOps — Yearly Archive Export"],
      [],
      ["Year:", preview.year],
      ["Total Transactions:", preview.count],
      ["Stock In records:", preview.stockInCount],
      ["Stock Out records:", preview.stockOutCount],
      ["Total Stock In qty:", preview.totalStockIn],
      ["Total Stock Out qty:", preview.totalStockOut],
      ["Exported on:", format(new Date(), "dd/MM/yyyy HH:mm")],
      [],
      ["NOTE: Keep this file as your permanent record before deleting from the database."],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws2["!cols"] = [{ wch: 28 }, { wch: 36 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Transactions ${preview.year}`);
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    XLSX.writeFile(wb, `Archive_${preview.year}_Transactions.xlsx`);
    setStep("exported");
    toast({ title: "Export complete", description: `Archive_${preview.year}_Transactions.xlsx downloaded.` });
  }

  async function doDelete() {
    if (!preview) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/archive?year=${preview.year}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDeletedCount(data.deleted);
      setStep("deleted");
      toast({ title: "Archive complete", description: `${data.deleted} transactions from ${preview.year} have been permanently deleted.` });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message ?? "Server error", variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  function reset() {
    setYear("");
    setStep("select");
    setPreview(null);
    setDeletedCount(0);
  }

  if (!isAdmin) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive mb-2" />
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Only administrators can perform yearly archive operations.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Archive className="h-8 w-8 text-primary" />
          Yearly Transaction Archive
        </h1>
        <p className="text-muted-foreground mt-1">
          Export and permanently remove old transaction records to keep the database lean.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { id: "select", label: "1. Select Year" },
          { id: "preview", label: "2. Preview" },
          { id: "exported", label: "3. Export" },
          { id: "deleted", label: "4. Delete" },
        ].map((s, i, arr) => (
          <React.Fragment key={s.id}>
            <span className={`px-3 py-1 rounded-full font-medium ${
              step === s.id
                ? "bg-primary text-primary-foreground"
                : ["preview", "exported", "deleted"].indexOf(step) > ["select", "preview", "exported", "deleted"].indexOf(s.id)
                ? "bg-chart-3/20 text-chart-3"
                : "bg-muted text-muted-foreground"
            }`}>
              {s.label}
            </span>
            {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Select year ── */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select the year to archive</CardTitle>
            <CardDescription>
              Only past years are available. The current year ({CURRENT_YEAR}) cannot be archived.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended workflow:</strong> Select year → Preview records → Export to Excel (permanent backup) → Delete from database.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 items-end">
              <div className="space-y-1 flex-1">
                <label className="text-sm font-medium">Year</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a year…" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchPreview} disabled={!year || loading} className="gap-2">
                <Search className="h-4 w-4" />
                {loading ? "Loading…" : "Preview Records"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Preview ── */}
      {(step === "preview" || step === "exported") && preview && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Records found for {preview.year}
                {step === "exported" && (
                  <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20 ml-2">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Exported
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Review the summary before exporting and deleting.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.count.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Transactions</p>
                </div>
                <div className="bg-chart-3/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-chart-3 flex items-center justify-center gap-1">
                    <ArrowDownRight className="h-5 w-5" />{preview.stockInCount}
                  </p>
                  <p className="text-xs text-chart-3 mt-1">Stock In</p>
                </div>
                <div className="bg-chart-4/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-chart-4 flex items-center justify-center gap-1">
                    <ArrowUpRight className="h-5 w-5" />{preview.stockOutCount}
                  </p>
                  <p className="text-xs text-chart-4 mt-1">Stock Out</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.rows.length > 0 ? format(new Date(preview.rows[preview.rows.length - 1].transactionDate), "dd/MM/yy") : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Oldest record</p>
                </div>
              </div>

              {preview.count === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No transactions found for {preview.year}. Nothing to archive.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {step === "preview" && (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-300">
                        <strong>Important:</strong> Export to Excel first and save it somewhere safe. After deletion, these records cannot be recovered.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={exportExcel} className="gap-2 flex-1 sm:flex-none">
                      <Download className="h-4 w-4" />
                      Download Excel Backup ({preview.count} records)
                    </Button>
                    {step === "exported" && (
                      <Button
                        variant="destructive"
                        onClick={() => setConfirmOpen(true)}
                        className="gap-2 flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete {preview.count} Records from Database
                      </Button>
                    )}
                    <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                      ← Start Over
                    </Button>
                  </div>

                  {step === "preview" && (
                    <p className="text-xs text-muted-foreground">
                      The Delete button will appear after you download the Excel backup.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample records table */}
          {preview.count > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sample records (first 10 of {preview.count})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">TXN ID</th>
                        <th className="text-left px-3 py-2 font-medium">Date</th>
                        <th className="text-left px-3 py-2 font-medium">Type</th>
                        <th className="text-left px-3 py-2 font-medium">Product</th>
                        <th className="text-right px-3 py-2 font-medium">Qty</th>
                        <th className="text-left px-3 py-2 font-medium">Dept</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 10).map((r) => (
                        <tr key={r.transactionId} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono font-semibold">{r.transactionId}</td>
                          <td className="px-3 py-2 text-muted-foreground">{format(new Date(r.transactionDate), "dd/MM/yy")}</td>
                          <td className="px-3 py-2">
                            {r.type === "stock_in"
                              ? <span className="text-chart-3 font-medium">In</span>
                              : <span className="text-chart-4 font-medium">Out</span>}
                          </td>
                          <td className="px-3 py-2">{r.productName}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.quantity}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.department || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.count > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2 border-t">
                      … and {preview.count - 10} more records (all included in the Excel export)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === "deleted" && (
        <Card className="text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-chart-3" />
            <div>
              <h2 className="text-2xl font-bold">Archive Complete</h2>
              <p className="text-muted-foreground mt-1">
                <strong>{deletedCount.toLocaleString("en-IN")} transactions</strong> from {preview?.year} have been permanently deleted from the database.
              </p>
            </div>
            <Alert className="text-left max-w-sm mx-auto">
              <CheckCircle2 className="h-4 w-4 text-chart-3" />
              <AlertDescription>
                Your Excel backup file contains the full record. Store it in a safe location (network drive, SharePoint, email, etc.).
              </AlertDescription>
            </Alert>
            <Button onClick={reset} variant="outline" className="mt-2">
              Archive Another Year
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Permanently delete {preview?.count} transactions?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You are about to permanently delete all <strong>{preview?.count} transactions from {preview?.year}</strong> from the database.
              </span>
              <span className="block font-semibold text-destructive">
                This action cannot be undone. Ensure your Excel backup is saved before proceeding.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel — go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : `Yes, delete ${preview?.count} records`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
