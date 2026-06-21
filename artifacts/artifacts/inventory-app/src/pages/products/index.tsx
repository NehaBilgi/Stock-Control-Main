import React, { useState } from "react";
import { Link } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Upload, SlidersHorizontal } from "lucide-react";
import { ImportDialog } from "./import-dialog";
import { StockAdjustDialog } from "./stock-adjust-dialog";

interface ProductRow {
  id: number;
  productId: string;
  name: string;
  currentStock: number;
  unitOfMeasure: string;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  categoryName?: string | null;
  locationName?: string | null;
  partNumber?: string | null;
  barcode?: string | null;
  stockStatus?: string | null;
}

export function Products() {
  const [importOpen, setImportOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<ProductRow | null>(null);
  const [search, setSearch] = useState("");

  const { data: productsData, isLoading, refetch } = useListProducts({ limit: 500 });

  const rows = (productsData?.data ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.productId.toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q) ||
      (p.partNumber ?? "").toLowerCase().includes(q) ||
      (p.categoryName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Products Master</h1>
          <p className="text-muted-foreground mt-1">Manage catalog, inventory limits, and item details.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Link href="/products/new">
            <Button className="font-semibold shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, barcode, or category…"
            className="pl-9 w-full bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name & Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right w-[110px]">Stock</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[130px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading products…</TableCell>
              </TableRow>
            ) : rows.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs">{product.productId}</TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{product.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{product.partNumber || product.barcode || '—'}</div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{product.categoryName || '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{product.locationName || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="font-semibold tabular-nums">
                    {product.currentStock} <span className="text-xs text-muted-foreground font-normal">{product.unitOfMeasure}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {product.stockStatus === 'in_stock' && <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">In Stock</Badge>}
                  {product.stockStatus === 'low_stock' && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Low Stock</Badge>}
                  {product.stockStatus === 'out_of_stock' && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Out of Stock</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => setAdjustProduct(product as ProductRow)}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      Adjust
                    </Button>
                    <Link href={`/products/${product.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Edit</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground px-1">
          {rows.length} of {productsData?.total ?? 0} products
        </p>
      )}

      <ImportDialog open={importOpen} onClose={() => { setImportOpen(false); refetch(); }} />

      <StockAdjustDialog
        open={!!adjustProduct}
        onClose={() => { setAdjustProduct(null); refetch(); }}
        product={adjustProduct}
      />
    </div>
  );
}
