
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit2, Trash2, MoreHorizontal, Loader2, X, PlusCircle, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ExcelImportButton from "@/components/ui/excel-import-button"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"

const productSchema = z.object({
  productName: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  category: z.string().min(2, "Category is required"),
  purchasePrice: z.coerce.number().min(0, "Price must be positive"),
  sellingPrice: z.coerce.number().min(0, "Price must be positive"),
  gstRate: z.coerce.number(),
  currentQuantity: z.coerce.number().min(0, "Quantity must be positive"),
  manufacturer: z.string().min(2, "Manufacturer is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
})

const bulkAddSchema = z.object({
  products: z.array(productSchema).min(1),
})

type ProductFormValues = z.infer<typeof productSchema>
type BulkAddFormValues = z.infer<typeof bulkAddSchema>

export default function InventoryPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [isStructureInfoOpen, setIsStructureInfoOpen] = useState(false)


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "products"), where("ownerId", "==", user.uid))
  }, [firestore, user])

  const { data: products, isLoading: isDataLoading } = useCollection(productsQuery)

  const bulkAddForm = useForm<BulkAddFormValues>({
    resolver: zodResolver(bulkAddSchema),
    defaultValues: {
      products: [{
        productName: "",
        sku: "",
        category: "",
        purchasePrice: 0,
        sellingPrice: 0,
        gstRate: 5,
        currentQuantity: 0,
        manufacturer: "",
        expiryDate: "",
      }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: bulkAddForm.control,
    name: "products",
  })

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  })

  useEffect(() => {
    if (editingProduct) {
      editForm.reset({
        productName: editingProduct.productName,
        sku: editingProduct.sku,
        category: editingProduct.category,
        purchasePrice: editingProduct.purchasePrice,
        sellingPrice: editingProduct.sellingPrice,
        gstRate: editingProduct.gstRate,
        currentQuantity: editingProduct.currentQuantity,
        manufacturer: editingProduct.manufacturer,
        expiryDate: editingProduct.expiryDate,
      })
    }
  }, [editingProduct, editForm])

  const filteredProducts = products?.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleImport = (data: any[]) => {
    const [header, ...rows] = data;
    const products = rows.map(row => ({
      productName: row[0],
      sku: row[1],
      category: row[2],
      purchasePrice: row[3],
      sellingPrice: row[4],
      gstRate: row[5],
      currentQuantity: row[6],
      manufacturer: row[7],
      expiryDate: row[8],
    }));

    onBulkAdd({ products });
  };

  function onBulkAdd(values: BulkAddFormValues) {
    if (!user || !firestore) return

    values.products.forEach((product) => {
      const productRef = doc(collection(firestore, "products"))
      const newProduct = {
        ...product,
        id: productRef.id,
        ownerId: user.uid,
      }

      setDocumentNonBlocking(productRef, newProduct, { merge: true })
      
      // Log the event
      const logRef = doc(collection(firestore, "logs"))
      setDocumentNonBlocking(logRef, {
        id: logRef.id,
        ownerId: user.uid,
        type: "inventory",
        action: `Added product: ${product.productName} (Bulk Add)`,
        timestamp: new Date().toISOString()
      }, { merge: true })
    })

    setIsAddDialogOpen(false)
    bulkAddForm.reset({
      products: [{
        productName: "",
        sku: "",
        category: "",
        purchasePrice: 0,
        sellingPrice: 0,
        gstRate: 5,
        currentQuantity: 0,
        manufacturer: "",
        expiryDate: "",
      }],
    })
    
    toast({
      title: "Inventory Updated",
      description: `${values.products.length} products have been added.`,
    })
  }

  function onEdit(values: ProductFormValues) {
    if (!user || !firestore || !editingProduct) return

    const productRef = doc(firestore, "products", editingProduct.id)
    updateDocumentNonBlocking(productRef, values)

    // Log the event
    const logRef = doc(collection(firestore, "logs"))
    setDocumentNonBlocking(logRef, {
      id: logRef.id,
      ownerId: user.uid,
      type: "inventory",
      action: `Updated product: ${editingProduct.productName} -> ${values.productName}`,
      timestamp: new Date().toISOString()
    }, { merge: true })

    setEditingProduct(null)
    toast({
      title: "Product Updated",
      description: `${values.productName} has been updated.`,
    })
  }

  function onDelete(product: any) {
    if (!user || !firestore) return
    const productRef = doc(firestore, "products", product.id)
    deleteDocumentNonBlocking(productRef)

    // Log the event
    const logRef = doc(collection(firestore, "logs"))
    setDocumentNonBlocking(logRef, {
      id: logRef.id,
      ownerId: user.uid,
      type: "inventory",
      action: `Deleted product: ${product.productName}`,
      timestamp: new Date().toISOString()
    }, { merge: true })

    toast({
      title: "Product Deleted",
      description: `${product.productName} removed from inventory.`,
    })
  }

  if (isUserLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor and manage pharmaceutical stock and GST rates.</p>
        </div>
        
        <div className="flex gap-2">
          <ExcelImportButton onImport={handleImport} />
          <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add Products
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-8 bg-muted/50 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="link" className="gap-2" onClick={() => setIsStructureInfoOpen(true)}>
              <FileQuestion className="h-4 w-4" />
              Required File Structure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Manufacturer</TableHead>
                  <TableHead className="font-semibold">Expiry Date</TableHead>
                  <TableHead className="font-semibold">GST %</TableHead>
                  <TableHead className="text-right font-semibold">Selling (Base)</TableHead>
                  <TableHead className="text-center font-semibold">Stock</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading inventory...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-sm font-mono">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{product.manufacturer}</TableCell>
                      <TableCell>{product.expiryDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{product.gstRate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{Number(product.sellingPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span className={product.currentQuantity < 10 ? "text-orange-600 font-bold" : "font-medium"}>
                          {product.currentQuantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setEditingProduct(product)}>
                              <Edit2 className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive gap-2 cursor-pointer" onClick={() => onDelete(product)}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Products</DialogTitle>
            <DialogDescription>
              Add one or more products to your inventory.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...bulkAddForm}>
            <form onSubmit={bulkAddForm.handleSubmit(onBulkAdd)} className="space-y-6 overflow-y-auto px-1">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative p-4 border rounded-lg bg-muted/20 space-y-4">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.productName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Paracetamol 500mg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.sku`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU / Batch</FormLabel>
                            <FormControl>
                              <Input placeholder="BAT-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="Antibiotics" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.manufacturer`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Cipla" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.expiryDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YYYY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.purchasePrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.sellingPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selling (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.gstRate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST %</FormLabel>
                            <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="GST" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="12">12%</SelectItem>
                                <SelectItem value="18">18%</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkAddForm.control}
                        name={`products.${index}.currentQuantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-dashed border-2"
                  onClick={() => append({
                    productName: "",
                    sku: "",
                    category: "",
                    purchasePrice: 0,
                    sellingPrice: 0,
                    gstRate: 5,
                    currentQuantity: 0,
                    manufacturer: "",
                    expiryDate: "",
                  })}
                >
                  <PlusCircle className="h-4 w-4" /> Add Another Row
                </Button>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save All Products</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Modify attributes for {editingProduct?.productName}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / Batch</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input placeholder="MM/YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (Excl. GST) (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={editForm.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Rate (%)</FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select GST" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0% (Exempt)</SelectItem>
                          <SelectItem value="5">5% (General)</SelectItem>
                          <SelectItem value="12">12% (Bulk)</SelectItem>
                          <SelectItem value="18">18% (Supplements)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="currentQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStructureInfoOpen} onOpenChange={setIsStructureInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excel File Structure</DialogTitle>
            <DialogDescription>
              Your Excel file should have the following columns in this exact order:
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>productName</TableHead>
                  <TableHead>sku</TableHead>
                  <TableHead>category</TableHead>
                  <TableHead>purchasePrice</TableHead>
                  <TableHead>sellingPrice</TableHead>
                  <TableHead>gstRate</TableHead>
                  <TableHead>currentQuantity</TableHead>
                  <TableHead>manufacturer</TableHead>
                  <TableHead>expiryDate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Paracetamol 500mg</TableCell>
                  <TableCell>PC500</TableCell>
                  <TableCell>Painkiller</TableCell>
                  <TableCell>10.50</TableCell>
                  <TableCell>15.00</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>Cipla</TableCell>
                  <TableCell>12/2025</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
