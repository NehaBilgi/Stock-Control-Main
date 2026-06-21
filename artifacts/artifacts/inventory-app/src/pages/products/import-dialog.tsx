import React, { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEMPLATE_COLUMNS = [
  "name",
  "barcode",
  "category",
  "brand",
  "manufacturer",
  "description",
  "unitOfMeasure",
  "partNumber",
  "supplier",
  "location",
  "rackNumber",
  "binNumber",
  "minStockLevel",
  "maxStockLevel",
  "reorderLevel",
  "currentStock",
  "unitCost",
  "purchaseDate",
  "expiryDate",
  "warrantyExpiry",
  "status",
];

const SAMPLE_ROWS = [
  [
    "Hydraulic Oil ISO 68",
    "BC-SAMPLE-001",
    "Lubricants & Oils",
    "Mobil",
    "ExxonMobil",
    "ISO VG 68 hydraulic oil",
    "Litre",
    "MBL-HYD68",
    "Industrial Lubricants Co.",
    "Main Warehouse",
    "R-A1",
    "B-01",
    20,
    200,
    40,
    50,
    3.5,
    "2024-01-15",
    "2026-01-15",
    "",
    "active",
  ],
  [
    "SKF 6205 Bearing",
    "BC-SAMPLE-002",
    "Bearings",
    "SKF",
    "SKF Group",
    "Deep groove ball bearing",
    "Nos",
    "SKF-6205",
    "SKF Bearings",
    "Workshop Store",
    "R-B1",
    "B-02",
    5,
    50,
    10,
    20,
    12.5,
    "2024-03-01",
    "",
    "2026-03-01",
    "active",
  ],
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, ...SAMPLE_ROWS]);

  ws["!cols"] = TEMPLATE_COLUMNS.map((col) => ({
    wch: ["name", "description", "supplier", "manufacturer"].includes(col) ? 28 : 16,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "product_import_template.xlsx");
}

interface ParsedRow {
  [key: string]: string | number | undefined;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "upload" | "preview" | "result";

export function ImportDialog({ open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setStep("upload");
    setFileName("");
    setRows([]);
    setResult(null);
    setImporting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function parseFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ title: "Invalid file type", description: "Please upload an .xlsx, .xls, or .csv file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (raw.length < 2) {
          toast({ title: "Empty file", description: "The spreadsheet has no data rows.", variant: "destructive" });
          return;
        }

        const headers: string[] = raw[0].map((h: any) => h?.toString().trim());
        const parsed: ParsedRow[] = [];

        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          if (row.every((cell: any) => cell === "" || cell === null || cell === undefined)) continue;

          const obj: ParsedRow = {};
          headers.forEach((h, idx) => {
            const val = row[idx];
            if (val instanceof Date) {
              obj[h] = val.toISOString().split("T")[0];
            } else {
              obj[h] = val !== undefined && val !== "" ? val : undefined;
            }
          });
          parsed.push(obj);
        }

        if (parsed.length === 0) {
          toast({ title: "No data found", description: "Spreadsheet contains headers but no data rows.", variant: "destructive" });
          return;
        }

        setFileName(file.name);
        setRows(parsed);
        setStep("preview");
      } catch {
        toast({ title: "Parse error", description: "Could not read the spreadsheet. Ensure it is a valid .xlsx/.csv file.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  async function handleImport() {
    setImporting(true);
    try {
      const token = localStorage.getItem("inventory_token");
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: rows }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Import failed");
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });

      if (data.imported > 0) {
        toast({ title: `${data.imported} product${data.imported > 1 ? "s" : ""} imported`, description: data.skipped > 0 ? `${data.skipped} row${data.skipped > 1 ? "s" : ""} had errors.` : "All rows imported successfully." });
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  const PREVIEW_COLS = ["name", "barcode", "category", "unitOfMeasure", "currentStock", "minStockLevel", "location", "status"];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk Import Products
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import multiple products at once.
            Category and location names must match existing entries exactly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === "upload" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <div className="text-sm text-muted-foreground">
                  Download the template to see the expected column format with sample data.
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-base font-medium text-foreground mb-1">
                  {isDragging ? "Drop file here" : "Click to upload or drag & drop"}
                </p>
                <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Required columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {["name", "unitOfMeasure"].map((c) => (
                    <Badge key={c} variant="secondary" className="font-mono text-xs bg-primary/10 text-primary border-primary/20">{c} *</Badge>
                  ))}
                  {TEMPLATE_COLUMNS.filter((c) => !["name", "unitOfMeasure"].includes(c)).map((c) => (
                    <Badge key={c} variant="outline" className="font-mono text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{fileName}</span>
                  <Badge variant="secondary">{rows.length} rows</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="w-4 h-4 mr-1" />
                  Change file
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        {PREVIEW_COLS.map((c) => (
                          <TableHead key={c} className="text-xs">{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => {
                        const hasName = !!row["name"];
                        const hasUom = !!row["unitOfMeasure"];
                        const isValid = hasName && hasUom;
                        return (
                          <TableRow key={i} className={!isValid ? "bg-destructive/5" : ""}>
                            <TableCell className="text-center text-xs text-muted-foreground">{i + 2}</TableCell>
                            {PREVIEW_COLS.map((c) => (
                              <TableCell key={c} className="text-xs max-w-[140px] truncate">
                                {row[c] !== undefined ? String(row[c]) : <span className="text-muted-foreground/50">—</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {rows.filter((r) => !r["name"] || !r["unitOfMeasure"]).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {rows.filter((r) => !r["name"] || !r["unitOfMeasure"]).length} row(s) are missing required fields and will be skipped.
                </div>
              )}
            </div>
          )}

          {step === "result" && result && (
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-6 bg-chart-3/10 border border-chart-3/20 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-chart-3 mb-2" />
                  <p className="text-3xl font-bold text-chart-3">{result.imported}</p>
                  <p className="text-sm text-muted-foreground mt-1">Products imported</p>
                </div>
                <div className={`flex flex-col items-center justify-center p-6 rounded-xl border ${result.skipped > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted/30 border-border"}`}>
                  <XCircle className={`w-8 h-8 mb-2 ${result.skipped > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                  <p className={`text-3xl font-bold ${result.skipped > 0 ? "text-destructive" : "text-muted-foreground"}`}>{result.skipped}</p>
                  <p className="text-sm text-muted-foreground mt-1">Rows skipped</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Errors</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded px-3 py-1.5">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span><span className="font-medium">Row {e.row}:</span> {e.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-2">
          {step === "upload" && (
            <>
              <div />
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={reset}>Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Import {rows.length} Products</>
                  )}
                </Button>
              </div>
            </>
          )}
          {step === "result" && (
            <>
              <Button variant="outline" onClick={reset}>Import Another File</Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
