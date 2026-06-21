import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCreateTransaction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ScanLine, Search, Plus, Minus, ArrowDownRight, ArrowUpRight,
  Usb, Camera, Car, Wifi
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ScanMode = "wired" | "camera";

export function Scan() {
  const [scanMode, setScanMode] = useState<ScanMode>("wired");
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [manualBarcode, setManualBarcode] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [scanActive, setScanActive] = useState<boolean>(false);
  const [product, setProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Wired scanner state: buffers keyboard input from USB scanner
  const [wiredBuffer, setWiredBuffer] = useState<string>("");
  const wiredInputRef = useRef<HTMLInputElement>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scannerRef = useRef<any>(null);
  const createTxMutation = useCreateTransaction();

  const fetchProduct = async (barcode: string) => {
    if (!barcode) return;
    setIsLoadingProduct(true);
    try {
      const token = localStorage.getItem("inventory_token");
      const res = await fetch(`/api/products/barcode/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProduct(await res.json());
      } else {
        setProduct(null);
        toast({ title: "Product not found for barcode: " + barcode, variant: "destructive" });
      }
    } catch {
      setProduct(null);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  useEffect(() => {
    if (scannedBarcode) fetchProduct(scannedBarcode);
  }, [scannedBarcode]);

  // Wired/USB scanner: listens for fast keyboard input + Enter
  const handleWiredKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeDelta = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    if (e.key === "Enter") {
      const barcode = wiredBuffer.trim();
      if (barcode) {
        setScannedBarcode(barcode);
        setManualBarcode(barcode);
        setWiredBuffer("");
        if (wiredInputRef.current) wiredInputRef.current.value = "";
      }
      e.preventDefault();
      return;
    }

    // USB scanners type each char very quickly (< 50ms apart).
    // If it's been more than 200ms since the last key, the user typed it — keep buffering normally.
    if (timeDelta < 200 || wiredBuffer.length === 0) {
      setWiredBuffer((prev) => prev + e.key);
    } else {
      setWiredBuffer(e.key);
    }

    // Auto-commit after 500ms inactivity (some scanners don't send Enter)
    if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    bufferTimerRef.current = setTimeout(() => {
      const barcode = wiredBuffer.trim();
      if (barcode && barcode.length >= 4) {
        setScannedBarcode(barcode);
        setManualBarcode(barcode);
        setWiredBuffer("");
        if (wiredInputRef.current) wiredInputRef.current.value = "";
      }
    }, 500);
  }, [wiredBuffer]);

  // Keep wired input focused
  useEffect(() => {
    if (scanMode === "wired" && wiredInputRef.current) {
      wiredInputRef.current.focus();
    }
  }, [scanMode]);

  // Camera scanner
  const startScanner = () => {
    setScanActive(true);
    setTimeout(async () => {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(
        (decodedText: string) => {
          setScannedBarcode(decodedText);
          setManualBarcode(decodedText);
          stopScanner();
        },
        () => {}
      );
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanActive(false);
  };

  useEffect(() => {
    return () => { if (scannerRef.current) scannerRef.current.clear().catch(console.error); };
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode) setScannedBarcode(manualBarcode);
  };

  const handleTransaction = (type: "stock_in" | "stock_out") => {
    if (!product) return;
    createTxMutation.mutate({
      data: {
        productId: product.id,
        type,
        quantity,
        vehicleNumber: vehicleNumber.trim().toUpperCase() || undefined,
        remarks: scanMode === "wired" ? "USB Scanner" : "Camera Scan",
      } as any
    }, {
      onSuccess: () => {
        toast({ title: `${type === "stock_in" ? "Stock In" : "Stock Out"} recorded`, description: vehicleNumber ? `Vehicle: ${vehicleNumber.toUpperCase()}` : undefined });
        setProduct({ ...product, currentStock: type === "stock_in" ? product.currentStock + quantity : product.currentStock - quantity });
        setQuantity(1);
        setVehicleNumber("");
      },
      onError: (err: any) => {
        toast({ title: "Transaction failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[900px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Barcode Scanner</h1>
        <p className="text-muted-foreground mt-1">Quick stock in / out via barcode.</p>
      </div>

      {/* Mode tabs */}
      <Tabs value={scanMode} onValueChange={(v) => { setScanMode(v as ScanMode); stopScanner(); }}>
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="wired" className="gap-2">
            <Usb className="w-4 h-4" /> Wired / USB Scanner
          </TabsTrigger>
          <TabsTrigger value="camera" className="gap-2">
            <Camera className="w-4 h-4" /> Camera Scanner
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{scanMode === "wired" ? "USB / Wired Scanner" : "Camera Scanner"}</CardTitle>
              <CardDescription>
                {scanMode === "wired"
                  ? "Click the input below, then scan with your wired/USB barcode scanner."
                  : "Start camera to scan a barcode."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanMode === "wired" ? (
                <div
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-primary/5 border-primary/30 cursor-text"
                  onClick={() => wiredInputRef.current?.focus()}
                >
                  <Usb className="w-10 h-10 text-primary mb-3" />
                  <p className="text-sm font-medium text-primary mb-1">Ready for USB scanner</p>
                  <p className="text-xs text-muted-foreground text-center mb-3">Click here, then scan your barcode</p>
                  <input
                    ref={wiredInputRef}
                    className="w-full border rounded-md px-3 py-2 font-mono text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Scan barcode here…"
                    value={wiredBuffer}
                    onChange={(e) => setWiredBuffer(e.target.value)}
                    onKeyDown={handleWiredKeyDown}
                    autoFocus
                  />
                  {scannedBarcode && (
                    <div className="flex items-center gap-2 mt-2">
                      <Wifi className="w-3 h-3 text-chart-3" />
                      <span className="text-xs text-chart-3 font-mono font-semibold">Last scan: {scannedBarcode}</span>
                    </div>
                  )}
                </div>
              ) : (
                !scanActive ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
                    <ScanLine className="w-12 h-12 text-muted-foreground mb-4" />
                    <Button onClick={startScanner} className="w-full max-w-xs">Start Camera Scanner</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div id="reader" className="overflow-hidden rounded-lg" />
                    <Button variant="outline" onClick={stopScanner} className="w-full">Stop Scanner</Button>
                  </div>
                )
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or manual entry</span>
                </div>
              </div>

              <form onSubmit={handleManualSearch} className="flex gap-2">
                <Input
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode manually…"
                  className="font-mono"
                />
                <Button type="submit" variant="secondary" disabled={!manualBarcode}>
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          {isLoadingProduct ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-12 text-muted-foreground">Loading product…</CardContent>
            </Card>
          ) : product ? (
            <Card className="h-full flex flex-col border-primary/20">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardDescription className="font-mono">{product.productId}</CardDescription>
                    <CardTitle className="text-xl mt-1">{product.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{product.locationName || 'No Loc'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-5 space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Current Stock</div>
                  <div className="text-3xl font-bold font-mono">
                    {product.currentStock} <span className="text-sm font-normal text-muted-foreground">{product.unitOfMeasure}</span>
                  </div>
                </div>

                {/* Vehicle Number */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Car className="w-3.5 h-3.5 text-primary" /> Vehicle Number
                  </Label>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH-12-AB-1234"
                    className="font-mono uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Quantity</div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center font-mono text-lg font-bold"
                    />
                    <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button size="lg" className="bg-chart-3 hover:bg-chart-3/90 text-white" onClick={() => handleTransaction("stock_in")} disabled={createTxMutation.isPending}>
                    <ArrowDownRight className="w-5 h-5 mr-2" /> Stock In
                  </Button>
                  <Button size="lg" className="bg-chart-4 hover:bg-chart-4/90 text-white" onClick={() => handleTransaction("stock_out")} disabled={createTxMutation.isPending}>
                    <ArrowUpRight className="w-5 h-5 mr-2" /> Stock Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                {scanMode === "wired"
                  ? "Scan a barcode with your USB scanner or enter it manually."
                  : "Scan a barcode or enter it manually to view product details."}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
