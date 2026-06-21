import React, { useState } from "react";
import { 
  useGetStockSummaryReport,
  useGetStockMovementReport,
  useGetLowStockReport,
  useGetExpiryReport
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export function Reports() {
  const [activeTab, setActiveTab] = useState("summary");
  
  const { data: summaryData, isLoading: summaryLoading } = useGetStockSummaryReport();
  const { data: movementData, isLoading: movementLoading } = useGetStockMovementReport();
  const { data: lowStockData, isLoading: lowStockLoading } = useGetLowStockReport();
  const { data: expiryData, isLoading: expiryLoading } = useGetExpiryReport();

  const exportToExcel = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reporting</h1>
        <p className="text-muted-foreground mt-1">Exportable data views for auditing and analysis.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-muted/50 border">
            <TabsTrigger value="summary">Stock Summary</TabsTrigger>
            <TabsTrigger value="movement">Stock Movement</TabsTrigger>
            <TabsTrigger value="low">Low Stock</TabsTrigger>
            <TabsTrigger value="expiry">Expiry</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" onClick={() => {
            if (activeTab === 'summary') exportToExcel(summaryData || [], 'Stock_Summary');
            if (activeTab === 'movement') exportToExcel(movementData || [], 'Stock_Movement');
            if (activeTab === 'low') exportToExcel(lowStockData || [], 'Low_Stock');
            if (activeTab === 'expiry') exportToExcel(expiryData || [], 'Expiry_Report');
          }}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <TabsContent value="summary" className="m-0 border-none outline-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Unit Value</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : summaryData?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{row.productId}</TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.categoryName}</TableCell>
                      <TableCell className="text-right font-mono">{row.currentStock} {row.unitOfMeasure}</TableCell>
                      <TableCell className="text-right font-mono">₹{row.unitCost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right font-mono font-bold">₹{row.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="movement" className="m-0 border-none outline-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>TXN ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : movementData?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{format(new Date(row.transactionDate), 'yyyy-MM-dd')}</TableCell>
                      <TableCell className="font-mono text-xs">{row.transactionId}</TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{row.type === 'stock_in' ? '+' : '-'}{row.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{row.balanceQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="low" className="m-0 border-none outline-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Min Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : lowStockData?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{row.productId}</TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.categoryName}</TableCell>
                      <TableCell className="text-right font-mono text-destructive font-bold">{row.currentStock}</TableCell>
                      <TableCell className="text-right font-mono">{row.minStockLevel}</TableCell>
                      <TableCell className="text-destructive text-sm font-semibold">{row.stockStatus?.replace('_', ' ').toUpperCase()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="expiry" className="m-0 border-none outline-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiryLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : expiryData?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{row.productId}</TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.locationName}</TableCell>
                      <TableCell className="text-right font-mono">{row.currentStock}</TableCell>
                      <TableCell className="text-sm">{row.expiryDate}</TableCell>
                      <TableCell className={`font-bold ${row.daysUntilExpiry < 0 ? 'text-destructive' : row.daysUntilExpiry < 30 ? 'text-warning' : ''}`}>
                        {row.daysUntilExpiry}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
