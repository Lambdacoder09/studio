"use client"

import { useState } from "react"
import { ShoppingCart, Plus, Receipt, Search, Download, Trash2, Printer, CheckCircle2, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export default function SalesPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [view, setView] = useState<"history" | "new">("history")
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [currentSale, setCurrentSale] = useState<any>(null)

  const businessLogo = PlaceHolderImages.find(img => img.id === 'business-logo')?.imageUrl || "https://picsum.photos/seed/biz1/200/200"

  // Fetch Products for the Catalog
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "products"), where("ownerId", "==", user.uid))
  }, [firestore, user])

  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery)

  // Fetch Sales for History (Sort in-memory)
  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "sales"), where("ownerId", "==", user.uid))
  }, [firestore, user])

  const { data: rawSalesHistory, isLoading: isSalesLoading } = useCollection(salesQuery)
  
  const salesHistory = rawSalesHistory ? [...rawSalesHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []

  const filteredProducts = products?.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const addToCart = (product: any) => {
    const existingInCart = cart.find(item => item.productId === product.id)?.quantity || 0
    if (product.currentQuantity <= existingInCart) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Only ${product.currentQuantity} units of ${product.productName} available.`,
      })
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }
      return [...prev, { 
        productId: product.id, 
        name: product.productName, 
        quantity: 1, 
        price: product.sellingPrice 
      }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const handleCompleteSale = () => {
    if (!user || !firestore || cart.length === 0) return

    const saleRef = doc(collection(firestore, "sales"))
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    
    const saleData = {
      id: saleRef.id,
      ownerId: user.uid,
      date: new Date().toISOString(),
      invoiceNumber,
      totalAmount: cartTotal,
      productIds: cart.map(item => item.productId),
      items: cart
    }

    // Save Sale
    setDocumentNonBlocking(saleRef, saleData, { merge: true })

    // Update Inventory Quantities
    cart.forEach(item => {
      const product = products?.find(p => p.id === item.productId)
      if (product) {
        const productRef = doc(firestore, "products", item.productId)
        updateDocumentNonBlocking(productRef, {
          currentQuantity: Number(product.currentQuantity) - Number(item.quantity)
        })
      }
    })

    setCurrentSale(saleData)
    setIsReceiptOpen(true)
    setCart([])
    
    toast({
      title: "Sale Completed",
      description: `Invoice ${invoiceNumber} has been generated.`,
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Sales Management</h1>
          <p className="text-muted-foreground">Process new sales and manage transaction history.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={view === "history" ? "default" : "outline"} 
            onClick={() => setView("history")}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" /> Sales History
          </Button>
          <Button 
            variant={view === "new" ? "default" : "outline"} 
            className="bg-secondary hover:bg-secondary/90 text-white gap-2"
            onClick={() => setView("new")}
          >
            <Plus className="h-4 w-4" /> New Sale Entry
          </Button>
        </div>
      </div>

      {view === "history" ? (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Transaction Records</CardTitle>
            <CardDescription>A list of all sales processed through BizManager.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">Invoice #</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Products</TableHead>
                    <TableHead className="text-right font-semibold">Total Amount</TableHead>
                    <TableHead className="text-center font-semibold">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSalesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : salesHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No sales recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesHistory.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium font-mono">{sale.invoiceNumber}</TableCell>
                        <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sale.items?.map((item: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[10px] whitespace-nowrap">
                                {item.name} x{item.quantity}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          ${Number(sale.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 text-emerald-800 border-none">Paid</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setCurrentSale(sale); setIsReceiptOpen(true); }}
                            title="View Receipt"
                          >
                            <Download className="h-4 w-4" />
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Catalog</CardTitle>
              <CardDescription>Select products to add to this transaction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {isProductsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center p-12 bg-muted/20 rounded-lg border-dashed border-2">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">No products available in inventory.</p>
                  <Button variant="link" onClick={() => window.location.href = '/inventory'}>Go to Inventory</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => addToCart(product)}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="font-bold">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          <Badge variant={product.currentQuantity < 10 ? "destructive" : "secondary"}>
                            {product.currentQuantity} in stock
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">${Number(product.sellingPrice).toFixed(2)}</p>
                          <Button size="sm" variant="outline" className="mt-2 h-7 px-2 text-[10px]">Add to Cart</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Current Sale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="flex justify-between items-start gap-2 border-b pb-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} x ${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">${(item.quantity * item.price).toFixed(2)}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-secondary hover:bg-secondary/90 text-white" 
                disabled={cart.length === 0}
                onClick={handleCompleteSale}
              >
                Complete Transaction
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white">
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div id="printable-receipt" className="space-y-6 text-slate-900 bg-white">
              {/* Receipt Header */}
              <div className="flex flex-col items-center text-center space-y-2 pb-6 border-b-2 border-dashed">
                <div className="relative w-16 h-16 mb-2 grayscale opacity-80">
                   <Image 
                    src={businessLogo} 
                    alt="Logo" 
                    fill 
                    className="object-contain"
                    data-ai-hint="business logo"
                  />
                </div>
                <h2 className="text-2xl font-bold tracking-tight uppercase">BizManager Store</h2>
                <p className="text-xs text-slate-500 max-w-[200px]">123 Business Avenue, Suite 100, Innovation City, IC 54321</p>
                <p className="text-[10px] text-slate-400">Phone: (555) 123-4567 • bizmanager.com</p>
              </div>

              {/* Transaction Info */}
              <div className="flex justify-between items-start text-xs font-mono py-4 bg-slate-50/50 px-2 rounded">
                <div className="space-y-1">
                  <p className="font-bold">INVOICE: #{currentSale?.invoiceNumber}</p>
                  <p>DATE: {currentSale?.date && new Date(currentSale.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right space-y-1">
                  <p>TIME: {currentSale?.date && new Date(currentSale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>CASHIER: {user?.email?.split('@')[0] || 'System'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-400 px-1">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <Separator className="h-[1px] bg-slate-200" />
                <div className="space-y-4">
                  {currentSale?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] items-center px-1">
                      <div className="col-span-6 font-medium truncate pr-2">{item.name}</div>
                      <div className="col-span-2 text-center text-slate-600">{item.quantity}</div>
                      <div className="col-span-2 text-right text-slate-600">${item.price.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-bold">${(item.quantity * item.price).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Section */}
              <div className="pt-6 border-t-2 border-dashed space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span>${Number(currentSale?.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold uppercase tracking-wider">Amount Due</span>
                  <span className="text-xl font-black text-primary">${Number(currentSale?.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                  <span>Payment Method</span>
                  <span>Cash/Debit</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                  <span>Transaction ID</span>
                  <span className="truncate max-w-[150px]">{currentSale?.id}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center space-y-4 pt-4">
                <div className="flex flex-col items-center">
                   <div className="w-full border-t border-slate-300 mb-1 max-w-[120px]"></div>
                   <span className="text-[9px] uppercase text-slate-400">Authorized Signature</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary italic">"Thank you for choosing BizManager!"</p>
                  <p className="text-[10px] text-slate-400">Please retain this receipt for your records.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-slate-50 gap-2 sm:justify-center">
            <Button variant="outline" className="flex-1 max-w-[140px]" onClick={() => setIsReceiptOpen(false)}>
              Dismiss
            </Button>
            <Button className="flex-1 max-w-[140px] bg-primary text-white gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
