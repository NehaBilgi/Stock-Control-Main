import React, { useRef } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, X, Building2, Calendar, Hash } from "lucide-react";

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

interface POLineItem {
  productId: string;
  name: string;
  brand: string | null;
  categoryName: string | null;
  unitOfMeasure: string;
  qty: number;
  unitCost: number;
  total: number;
  priority: "critical" | "warning" | "watch";
}

interface PurchaseOrder {
  poNumber: string;
  supplier: string;
  lines: POLineItem[];
  subtotal: number;
}

function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildPOs(suggestions: ReorderSuggestion[]): PurchaseOrder[] {
  const today = format(new Date(), "yyyyMMdd");
  const grouped = new Map<string, ReorderSuggestion[]>();

  for (const s of suggestions) {
    const supplier = s.supplier?.trim() || "Unspecified Supplier";
    const existing = grouped.get(supplier) ?? [];
    existing.push(s);
    grouped.set(supplier, existing);
  }

  let seq = 1;
  return Array.from(grouped.entries()).map(([supplier, items]) => {
    const lines: POLineItem[] = items.map((s) => ({
      productId: s.productId,
      name: s.name,
      brand: s.brand,
      categoryName: s.categoryName,
      unitOfMeasure: s.unitOfMeasure,
      qty: s.recommendedQty,
      unitCost: s.unitCost,
      total: s.estimatedCost,
      priority: s.priority,
    }));
    const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
    return {
      poNumber: `PO-${today}-${String(seq++).padStart(3, "0")}`,
      supplier,
      lines,
      subtotal,
    };
  });
}

const PRIORITY_LABEL: Record<string, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  warning: { label: "Warning", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  watch: { label: "Watch", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
};

function POSheet({ po, index, total }: { po: PurchaseOrder; index: number; total: number }) {
  const today = format(new Date(), "dd MMM yyyy");
  return (
    <div className={`bg-white text-gray-900 rounded-xl border shadow-sm overflow-hidden ${index < total - 1 ? "mb-6 print:mb-0 print:page-break-after-always" : ""}`}>
      {/* PO Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Purchase Order</p>
          <p className="text-2xl font-bold tracking-tight mt-0.5">{po.poNumber}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-400 text-xs">IndustrialOps</p>
          <p className="font-semibold text-white">Procurement Department</p>
          <p className="text-slate-300 text-xs mt-0.5">Maintenance & Engineering Division</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-slate-50 border-b">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">PO Date</p>
            <p className="text-sm font-semibold text-slate-800">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Supplier</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{po.supplier}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Payment Terms</p>
            <p className="text-sm font-semibold text-slate-800">Net 30 Days</p>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product / Description</th>
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Product ID</th>
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Priority</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Qty</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Unit Price</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((line, i) => (
              <tr key={line.productId} className={`border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                <td className="py-3 text-slate-400 text-xs">{i + 1}</td>
                <td className="py-3">
                  <p className="font-medium text-slate-800">{line.name}</p>
                  {line.brand && <p className="text-xs text-slate-500 mt-0.5">{line.brand}{line.categoryName ? ` · ${line.categoryName}` : ""}</p>}
                </td>
                <td className="py-3 font-mono text-xs text-slate-500">{line.productId}</td>
                <td className="py-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PRIORITY_LABEL[line.priority]?.cls}`}>
                    {PRIORITY_LABEL[line.priority]?.label}
                  </span>
                </td>
                <td className="py-3 text-right font-semibold text-slate-800 tabular-nums">
                  {line.qty} <span className="text-xs font-normal text-slate-500">{line.unitOfMeasure}</span>
                </td>
                <td className="py-3 text-right tabular-nums text-slate-700">{inr(line.unitCost)}</td>
                <td className="py-3 text-right tabular-nums font-semibold text-slate-800">{inr(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 pb-4 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1.5 text-sm text-slate-600">
            <span>Subtotal ({po.lines.length} item{po.lines.length > 1 ? "s" : ""})</span>
            <span className="tabular-nums">{inr(po.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm text-slate-600">
            <span>GST (18%)</span>
            <span className="tabular-nums">{inr(po.subtotal * 0.18)}</span>
          </div>
          <Separator className="my-1.5 bg-slate-300" />
          <div className="flex justify-between py-1.5 text-base font-bold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{inr(po.subtotal * 1.18)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t grid grid-cols-2 gap-8 text-xs text-slate-500">
        <div>
          <p className="font-semibold text-slate-700 mb-1">Delivery Instructions</p>
          <p>Please deliver to: Main Warehouse, Gate 1</p>
          <p className="mt-1">Expected delivery within {po.lines.some(l => l.priority === "critical") ? "3–5" : "7–10"} business days.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-700 mb-2">Authorized Signature</p>
          <div className="border-b border-slate-300 mt-6 mb-1" />
          <p>Procurement Manager &nbsp;·&nbsp; IndustrialOps</p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  suggestions: ReorderSuggestion[];
}

export function POGeneratorDialog({ open, onClose, suggestions }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const pos = buildPOs(suggestions.filter((s) => s.recommendedQty > 0));
  const grandSubtotal = pos.reduce((s, p) => s + p.subtotal, 0);
  const grandTotal = grandSubtotal * 1.18;

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Purchase Orders — IndustrialOps</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #1a1a1a; background: white; }
            .po-wrapper { padding: 24px; }
            .po-sheet { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 32px; page-break-after: always; }
            .po-sheet:last-child { margin-bottom: 0; page-break-after: avoid; }
            .po-header { background: #1e293b; color: white; padding: 16px 24px; display: flex; justify-content: space-between; }
            .po-header h1 { font-size: 10px; letter-spacing: 0.1em; color: #94a3b8; text-transform: uppercase; }
            .po-header h2 { font-size: 20px; font-weight: 700; margin-top: 2px; }
            .po-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 12px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
            .po-meta p.label { font-size: 10px; color: #64748b; }
            .po-meta p.value { font-size: 13px; font-weight: 600; color: #1e293b; }
            .po-items { padding: 16px 24px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            th.right, td.right { text-align: right; }
            td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            tr:nth-child(even) td { background: #f8fafc; }
            td .name { font-weight: 600; color: #1e293b; }
            td .sub { font-size: 10px; color: #64748b; margin-top: 2px; }
            td .mono { font-family: monospace; font-size: 11px; color: #64748b; }
            td .pri { font-size: 10px; padding: 2px 6px; border-radius: 3px; border: 1px solid; font-weight: 600; }
            .pri-critical { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
            .pri-warning { background: #fffbeb; color: #b45309; border-color: #fde68a; }
            .pri-watch { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
            .totals { padding: 8px 24px 16px; display: flex; justify-content: flex-end; }
            .totals-box { width: 260px; }
            .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #475569; }
            .totals-row.grand { font-size: 14px; font-weight: 700; color: #1e293b; border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 4px; }
            .po-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 12px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
            .po-footer .title { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
            .sig-line { border-bottom: 1px solid #94a3b8; margin-top: 24px; margin-bottom: 4px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="po-wrapper">
            ${pos.map((po) => `
              <div class="po-sheet">
                <div class="po-header">
                  <div><h1>Purchase Order</h1><h2>${po.poNumber}</h2></div>
                  <div style="text-align:right"><p style="font-size:10px;color:#94a3b8">IndustrialOps</p><p style="font-weight:600">Procurement Department</p><p style="font-size:10px;color:#cbd5e1;margin-top:2px">Maintenance &amp; Engineering Division</p></div>
                </div>
                <div class="po-meta">
                  <div><p class="label">PO Date</p><p class="value">${format(new Date(), "dd MMM yyyy")}</p></div>
                  <div><p class="label">Supplier</p><p class="value">${po.supplier}</p></div>
                  <div><p class="label">Payment Terms</p><p class="value">Net 30 Days</p></div>
                </div>
                <div class="po-items">
                  <table>
                    <thead><tr>
                      <th style="width:24px">#</th>
                      <th>Product / Description</th>
                      <th style="width:90px">Product ID</th>
                      <th style="width:70px">Priority</th>
                      <th class="right" style="width:70px">Qty</th>
                      <th class="right" style="width:100px">Unit Price</th>
                      <th class="right" style="width:100px">Total</th>
                    </tr></thead>
                    <tbody>
                      ${po.lines.map((l, i) => `
                        <tr>
                          <td style="color:#94a3b8;font-size:11px">${i + 1}</td>
                          <td><div class="name">${l.name}</div>${l.brand ? `<div class="sub">${l.brand}${l.categoryName ? " · " + l.categoryName : ""}</div>` : ""}</td>
                          <td><span class="mono">${l.productId}</span></td>
                          <td><span class="pri pri-${l.priority}">${PRIORITY_LABEL[l.priority]?.label}</span></td>
                          <td class="right" style="font-weight:600">${l.qty} <span style="font-size:10px;font-weight:400;color:#64748b">${l.unitOfMeasure}</span></td>
                          <td class="right">₹${l.unitCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td class="right" style="font-weight:600">₹${l.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
                <div class="totals">
                  <div class="totals-box">
                    <div class="totals-row"><span>Subtotal (${po.lines.length} item${po.lines.length > 1 ? "s" : ""})</span><span>₹${po.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                    <div class="totals-row"><span>GST (18%)</span><span>₹${(po.subtotal * 0.18).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                    <div class="totals-row grand"><span>Total</span><span>₹${(po.subtotal * 1.18).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                  </div>
                </div>
                <div class="po-footer">
                  <div><div class="title">Delivery Instructions</div><p>Please deliver to: Main Warehouse, Gate 1</p><p style="margin-top:4px">Expected delivery within ${po.lines.some(l => l.priority === "critical") ? "3–5" : "7–10"} business days.</p></div>
                  <div><div class="title">Authorized Signature</div><div class="sig-line"></div><p>Procurement Manager · IndustrialOps</p></div>
                </div>
              </div>
            `).join("")}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }

  function handleExport() {
    const wb = XLSX.utils.book_new();

    for (const po of pos) {
      const rows = [
        ["PURCHASE ORDER"],
        ["PO Number:", po.poNumber],
        ["Date:", format(new Date(), "dd MMM yyyy")],
        ["Supplier:", po.supplier],
        ["Payment Terms:", "Net 30 Days"],
        [],
        ["#", "Product ID", "Product Name", "Brand", "Category", "Priority", "Qty", "Unit of Measure", "Unit Price (₹)", "Total (₹)"],
        ...po.lines.map((l, i) => [
          i + 1,
          l.productId,
          l.name,
          l.brand ?? "",
          l.categoryName ?? "",
          PRIORITY_LABEL[l.priority]?.label ?? "",
          l.qty,
          l.unitOfMeasure,
          l.unitCost,
          l.total,
        ]),
        [],
        ["", "", "", "", "", "", "", "", "Subtotal (₹)", po.subtotal],
        ["", "", "", "", "", "", "", "", "GST 18% (₹)", po.subtotal * 0.18],
        ["", "", "", "", "", "", "", "", "Total (₹)", po.subtotal * 1.18],
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 4 }, { wch: 12 }, { wch: 36 }, { wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws, po.poNumber.slice(-7));
    }

    XLSX.writeFile(wb, `PurchaseOrders_${format(new Date(), "yyyyMMdd")}.xlsx`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-lg font-bold">Purchase Orders</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pos.length} PO{pos.length !== 1 ? "s" : ""} · {suggestions.filter(s => s.recommendedQty > 0).length} line items · Grand Total: <span className="font-semibold text-foreground">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> (incl. 18% GST)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-muted/30" ref={printRef}>
          {pos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="font-medium">No items with a recommended order quantity.</p>
              <p className="text-sm mt-1">All stock levels may already be at maximum.</p>
            </div>
          ) : (
            pos.map((po, i) => (
              <POSheet key={po.poNumber} po={po} index={i} total={pos.length} />
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t bg-card flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            All amounts in Indian Rupees (INR) · GST @ 18% · {format(new Date(), "dd MMM yyyy")}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4 mr-1.5" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
