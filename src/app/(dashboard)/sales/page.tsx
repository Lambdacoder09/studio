"use client"

import { useState } from "react"
import { ShoppingCart, Plus, Receipt, Search, Trash2, Printer, Loader2, Package, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

interface CartItem {
  productId: string;
  name: string;
  sku: string;
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

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "products"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery)

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
        sku: product.sku,
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

    setDocumentNonBlocking(saleRef, saleData, { merge: true })

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
        <div className="flex gap-2 print-hidden">
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
        <Card className="border-none shadow-sm bg-white print-hidden">
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
                            <Printer className="h-4 w-4" />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-hidden">
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
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-0 print-hidden">
            <DialogTitle>Sales Receipt Generated</DialogTitle>
            <DialogDescription>
              Transaction record for invoice #{currentSale?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          <div id="printable-receipt" className="p-8 space-y-8 bg-white text-slate-900 font-sans">
            {/* Professional Header */}
            <div className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <Image 
                  src={businessLogo} 
                  alt="Logo" 
                  fill 
                  className="object-contain grayscale"
                  data-ai-hint="business logo"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter">BizManager Store</h2>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Premium Inventory & Supply Solutions</p>
                <p className="text-[10px] text-slate-400 font-mono">123 Innovation Way, Silicon Valley, CA 94025</p>
              </div>
            </div>

            {/* Transaction Data Block */}
            <div className="grid grid-cols-2 gap-8 border-y-2 border-slate-100 py-4 text-[11px]">
              <div className="space-y-1.5">
                <p className="font-bold text-slate-400 uppercase tracking-wider">Transaction Info</p>
                <p className="font-mono"><span className="text-slate-400">INV:</span> #{currentSale?.invoiceNumber}</p>
                <p className="font-mono"><span className="text-slate-400">DATE:</span> {currentSale?.date && new Date(currentSale.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right space-y-1.5">
                <p className="font-mono pt-4"><span className="text-slate-400">TIME:</span> {currentSale?.date && new Date(currentSale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="font-mono"><span className="text-slate-400">STAFF:</span> {user?.email?.split('@')[0].toUpperCase()}</p>
              </div>
            </div>

            {/* Itemized Billing Table */}
            <div className="space-y-4 min-h-[150px]">
              <div className="grid grid-cols-12 text-[10px] font-black uppercase text-slate-400 border-b pb-2">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              <div className="space-y-3">
                {currentSale?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] items-center">
                    <div className="col-span-6 space-y-0.5">
                      <p className="font-bold uppercase leading-none">{item.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">SKU: {item.sku || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 text-center font-mono text-slate-600">{item.quantity}</div>
                    <div className="col-span-2 text-right font-mono text-slate-600">${item.price.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-black font-mono">${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="pt-6 border-t-4 border-double border-slate-100 flex justify-between items-center">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Amount Due</p>
              <p className="text-3xl font-black tracking-tighter text-primary font-mono">
                ${Number(currentSale?.totalAmount).toFixed(2)}
              </p>
            </div>

            {/* Footer & Signature */}
            <div className="pt-8 text-center space-y-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-48 h-[1px] bg-slate-200"></div>
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Official Authorization</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.3em]">Thank you for your business</p>
                <div className="flex items-center justify-center gap-1 text-slate-300">
                  <CheckCircle2 className="h-3 w-3 receipt-icon" />
                  <span className="text-[8px] font-mono italic">Verified Transaction</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-slate-50 gap-2 print-hidden sm:justify-center">
            <Button variant="outline" className="flex-1" onClick={() => setIsReceiptOpen(false)}>
              Dismiss
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
