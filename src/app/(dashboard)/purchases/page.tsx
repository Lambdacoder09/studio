
"use client"

import { useState } from "react"
import { Plus, Truck, Calendar, User, Loader2, Printer, FileText, CheckCircle2 } from "lucide-react"
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
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

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
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [currentPurchase, setCurrentPurchase] = useState<any>(null)

  const businessLogo = PlaceHolderImages.find(img => img.id === 'business-logo')?.imageUrl || "https://picsum.photos/seed/biz1/200/200"

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
      sku: selectedProduct.sku,
      date: new Date().toISOString(),
      voucherNumber: `PUR-${Date.now().toString().slice(-6)}`,
    }

    // Save Purchase
    setDocumentNonBlocking(purchaseRef, purchaseData, { merge: true })

    // Update Product Stock
    const productRef = doc(firestore, "products", values.productId)
    updateDocumentNonBlocking(productRef, {
      currentQuantity: Number(selectedProduct.currentQuantity) + Number(values.quantity)
    })

    setCurrentPurchase(purchaseData)
    setIsAddDialogOpen(false)
    setIsSummaryOpen(true)
    form.reset()
    toast({ title: "Purchase Recorded", description: "Inventory stock updated successfully." })
  }

  const handlePrint = () => {
    window.print()
  }

  const totalProcurement = purchases.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.purchasePrice)), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:hidden">
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

      <Card className="border-none shadow-sm bg-white print:hidden">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Comprehensive list of stock increases from suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Voucher #</TableHead>
                  <TableHead className="font-semibold">Supplier</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="text-center font-semibold">Quantity</TableHead>
                  <TableHead className="text-right font-semibold">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold">Total Price</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : purchases.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No purchase records found.</TableCell></TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-xs">{purchase.voucherNumber || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                      <TableCell>{purchase.productName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-primary/5 text-primary">+{purchase.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${Number(purchase.purchasePrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        ${(Number(purchase.quantity) * Number(purchase.purchasePrice)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setCurrentPurchase(purchase); setIsSummaryOpen(true); }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Summary Dialog (The "Receipt" for Purchases) */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="p-6 pb-0 print:hidden">
            <DialogTitle>Purchase Document Generated</DialogTitle>
            <DialogDescription>Record of inventory procurement for Voucher #{currentPurchase?.voucherNumber}</DialogDescription>
          </DialogHeader>

          <div id="printable-receipt" className="p-8 space-y-8 bg-white text-foreground font-sans print:p-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="relative w-16 h-16">
                  <Image 
                    src={businessLogo} 
                    alt="Logo" 
                    fill 
                    className="object-contain grayscale"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold uppercase tracking-tighter">BizManager Store</h2>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Premium Inventory Solutions</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <h3 className="text-4xl font-black text-primary/10 uppercase tracking-tighter">Voucher</h3>
                <div className="space-y-1 text-[11px] font-mono">
                  <p>NO: {currentPurchase?.voucherNumber}</p>
                  <p>DATE: {currentPurchase?.date && new Date(currentPurchase.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Entity Info */}
            <div className="grid grid-cols-2 gap-8 border-y border-border py-6 text-[11px]">
              <div className="space-y-2">
                <p className="font-bold text-muted-foreground uppercase tracking-wider">Vendor / Supplier</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold uppercase">{currentPurchase?.supplierName}</p>
                  <p className="text-muted-foreground">Account: Regular Supplier</p>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <p className="font-bold text-muted-foreground uppercase tracking-wider">Bill To</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold uppercase">BizManager Store</p>
                  <p className="text-muted-foreground">Admin: {user?.email?.split('@')[0].toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-muted-foreground border-b pb-2">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Unit Cost</div>
                <div className="col-span-2 text-right">Extended</div>
              </div>
              <div className="grid grid-cols-12 text-[12px] items-center border-b border-dashed pb-4">
                <div className="col-span-6">
                  <p className="font-bold uppercase">{currentPurchase?.productName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">SKU: {currentPurchase?.sku || 'N/A'}</p>
                </div>
                <div className="col-span-2 text-center font-mono">+{currentPurchase?.quantity}</div>
                <div className="col-span-2 text-right font-mono">${Number(currentPurchase?.purchasePrice).toFixed(2)}</div>
                <div className="col-span-2 text-right font-bold font-mono">
                  ${(Number(currentPurchase?.quantity) * Number(currentPurchase?.purchasePrice)).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-6">
              <div className="w-1/2 space-y-3">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider">Subtotal</span>
                  <span className="font-mono">${(Number(currentPurchase?.quantity) * Number(currentPurchase?.purchasePrice)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-widest">Total Cost</span>
                  <span className="text-3xl font-bold tracking-tighter text-primary font-mono">
                    ${(Number(currentPurchase?.quantity) * Number(currentPurchase?.purchasePrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-12 grid grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Supplier Confirmation</p>
                  <div className="w-full h-12 border-b border-dashed border-muted-foreground/30"></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Receiving Officer</p>
                  <div className="w-full h-12 border-b border-dashed border-muted-foreground/30"></div>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-8">
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest italic">Inventory successfully updated in system</p>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/50 gap-2 print:hidden sm:justify-center">
            <Button variant="outline" className="flex-1" onClick={() => setIsSummaryOpen(false)}>
              Close
            </Button>
            <Button className="flex-1 bg-primary text-white gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
