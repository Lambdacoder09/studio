
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit2, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
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
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { useForm } from "react-hook-form"
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
})

type ProductFormValues = z.infer<typeof productSchema>

export default function InventoryPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

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

  const addForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      sku: "",
      category: "",
      purchasePrice: 0,
      sellingPrice: 0,
      gstRate: 5,
      currentQuantity: 0,
    },
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
      })
    }
  }, [editingProduct, editForm])

  const filteredProducts = products?.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  function onAdd(values: ProductFormValues) {
    if (!user || !firestore) return

    const productRef = doc(collection(firestore, "products"))
    const newProduct = {
      ...values,
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
      action: `Added new product: ${values.productName}`,
      timestamp: new Date().toISOString()
    }, { merge: true })

    setIsAddDialogOpen(false)
    addForm.reset()
    
    toast({
      title: "Product Added",
      description: `${values.productName} has been added.`,
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
        
        <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
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
                  <TableHead className="font-semibold">GST %</TableHead>
                  <TableHead className="text-right font-semibold">Selling (Base)</TableHead>
                  <TableHead className="text-center font-semibold">Stock</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading inventory...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter product details. Stock levels and GST will be updated automatically.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Paracetamol 500mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="sku"
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
                  control={addForm.control}
                  name="category"
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
                <FormField
                  control={addForm.control}
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
                  control={addForm.control}
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
                  control={addForm.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Rate (%)</FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value.toString()}>
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
                  control={addForm.control}
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
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save Product</Button>
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
    </div>
  )
}
