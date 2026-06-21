import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetProduct, 
  useCreateProduct, 
  useUpdateProduct, 
  useListCategories, 
  useListLocations,
  getGetProductQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  barcode: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  partNumber: z.string().optional(),
  supplier: z.string().optional(),
  locationId: z.coerce.number().optional(),
  rackNumber: z.string().optional(),
  binNumber: z.string().optional(),
  minStockLevel: z.coerce.number().optional(),
  maxStockLevel: z.coerce.number().optional(),
  reorderLevel: z.coerce.number().optional(),
  currentStock: z.coerce.number().optional(),
  unitCost: z.coerce.number().optional(),
  status: z.enum(['active', 'inactive']).default('active')
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isNew = !params.id || params.id === "new";
  const productId = isNew ? 0 : parseInt(params.id as string, 10);
  
  const { data: categories } = useListCategories();
  const { data: locations } = useListLocations();
  const { data: product, isLoading: isProductLoading } = useGetProduct(productId, {
    query: { enabled: !isNew, queryKey: getGetProductQueryKey(productId) }
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      unitOfMeasure: "pcs",
      status: "active",
      currentStock: 0
    }
  });

  useEffect(() => {
    if (product && !isNew) {
      reset({
        name: product.name,
        barcode: product.barcode || "",
        categoryId: product.categoryId || undefined,
        brand: product.brand || "",
        manufacturer: product.manufacturer || "",
        description: product.description || "",
        unitOfMeasure: product.unitOfMeasure,
        partNumber: product.partNumber || "",
        supplier: product.supplier || "",
        locationId: product.locationId || undefined,
        rackNumber: product.rackNumber || "",
        binNumber: product.binNumber || "",
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel || undefined,
        reorderLevel: product.reorderLevel,
        currentStock: product.currentStock,
        unitCost: product.unitCost,
        status: product.status
      });
    }
  }, [product, isNew, reset]);

  const onSubmit = (data: ProductFormData) => {
    if (isNew) {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Product created successfully" });
          setLocation("/products");
        },
        onError: () => {
          toast({ title: "Failed to create product", variant: "destructive" });
        }
      });
    } else {
      updateMutation.mutate({ id: productId, data }, {
        onSuccess: () => {
          toast({ title: "Product updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
          setLocation("/products");
        },
        onError: () => {
          toast({ title: "Failed to update product", variant: "destructive" });
        }
      });
    }
  };

  if (!isNew && isProductLoading) {
    return <div className="p-8">Loading product details...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/products")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isNew ? "New Product" : "Edit Product"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNew ? "Add a new item to the inventory catalog." : `Update details for ${product?.productId}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode" {...register("barcode")} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <Select 
                      value={watch("categoryId")?.toString()} 
                      onValueChange={(val) => setValue("categoryId", parseInt(val, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                    <Input id="unitOfMeasure" {...register("unitOfMeasure")} placeholder="pcs, kg, liters..." />
                    {errors.unitOfMeasure && <p className="text-xs text-destructive">{errors.unitOfMeasure.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} rows={3} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manufacturing & Supply</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" {...register("brand")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input id="manufacturer" {...register("manufacturer")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partNumber">Part Number</Label>
                    <Input id="partNumber" {...register("partNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input id="supplier" {...register("supplier")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locationId">Location</Label>
                  <Select 
                    value={watch("locationId")?.toString()} 
                    onValueChange={(val) => setValue("locationId", parseInt(val, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => (
                        <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rackNumber">Rack</Label>
                    <Input id="rackNumber" {...register("rackNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="binNumber">Bin</Label>
                    <Input id="binNumber" {...register("binNumber")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Min Stock</Label>
                    <Input id="minStockLevel" type="number" {...register("minStockLevel")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input id="reorderLevel" type="number" {...register("reorderLevel")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStockLevel">Max Stock</Label>
                    <Input id="maxStockLevel" type="number" {...register("maxStockLevel")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Unit Cost</Label>
                    <Input id="unitCost" type="number" step="0.01" {...register("unitCost")} />
                  </div>
                  {isNew && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="currentStock">Initial Stock</Label>
                      <Input id="currentStock" type="number" {...register("currentStock")} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" type="button" onClick={() => setLocation("/products")}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isNew ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
