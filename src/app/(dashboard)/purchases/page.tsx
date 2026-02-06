
"use client"

import { useState } from "react"
import { Plus, Truck, Calendar, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"

const purchaseSchema = z.object({
  supplierName: z.string().min(2, "Supplier name required"),
  productId: z.string().min(1, "Product required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  purchasePrice: z.coerce.number().min(0.01, "Price must be positive"),
})

type PurchaseFormValues = z.infer<typeof purchaseSchema>

export default function PurchasesPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "products"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: products } = useCollection(productsQuery)

  const purchasesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "purchases"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: rawPurchases, isLoading } = useCollection(purchasesQuery)

  const purchases = rawPurchases ? [...rawPurchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierName: "",
      productId: "",
      quantity: 1,
      purchasePrice: 0,
    },
  })

  function onSubmit(values: PurchaseFormValues) {
    if (!user || !firestore) return

    const selectedProduct = products?.find(p => p.id === values.productId)
    if (!selectedProduct) return

    const purchaseRef = doc(collection(firestore, "purchases"))
    const purchaseData = {
      ...values,
      id: purchaseRef.id,
      ownerId: user.uid,
      productName: selectedProduct.productName,
      date: new Date().toISOString(),
    }

    // Save Purchase
    setDocumentNonBlocking(purchaseRef, purchaseData, { merge: true })

    // Update Product Stock
    const productRef = doc(firestore, "products", values.productId)
    updateDocumentNonBlocking(productRef, {
      currentQuantity: Number(selectedProduct.currentQuantity) + Number(values.quantity)
    })

    setIsAddDialogOpen(false)
    form.reset()
    toast({ title: "Purchase Recorded", description: "Inventory stock updated successfully." })
  }

  const totalProcurement = purchases.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Purchase Management</h1>
          <p className="text-muted-foreground">Record new supply orders and track purchase history.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2">
              <Plus className="h-4 w-4" /> Record New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Record New Purchase</DialogTitle>
                  <DialogDescription>Add items to your inventory from a supplier.</DialogDescription>
                </DialogHeader>
                <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Acme Corp" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.productName} (SKU: {p.sku})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Cost ($)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Save Purchase</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procurement</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProcurement.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total spent on supplies</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Comprehensive list of stock increases from suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Supplier</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="text-center font-semibold">Quantity</TableHead>
                  <TableHead className="text-right font-semibold">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold">Total Price</TableHead>
                  <TableHead className="text-center font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : purchases.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No purchase records found.</TableCell></TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                      <TableCell>{purchase.productName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-primary/5 text-primary">+{purchase.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${Number(purchase.purchasePrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        ${(purchase.quantity * purchase.purchasePrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {new Date(purchase.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
