
"use client"

import { use } from "react"
import { Printer, ArrowLeft, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import Link from "next/link"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function SaleReceiptPage({ params }: { params: Promise<{ saleId: string }> }) {
  const { saleId } = use(params)
  const { user } = useUser()
  const firestore = useFirestore()
  const businessLogo = PlaceHolderImages.find(img => img.id === 'business-logo')?.imageUrl || "https://picsum.photos/seed/biz1/200/200"

  const saleRef = useMemoFirebase(() => {
    if (!firestore || !saleId) return null
    return doc(firestore, "sales", saleId)
  }, [firestore, saleId])

  const { data: sale, isLoading } = useDoc(saleRef)

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Receipt Not Found</h2>
        <p className="text-muted-foreground mt-2">The transaction record could not be located.</p>
        <Button asChild className="mt-6">
          <Link href="/sales">Back to Sales History</Link>
        </Button>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/sales">
            <ArrowLeft className="h-4 w-4" /> Back to Sales
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg bg-white overflow-hidden">
        <CardContent className="p-0">
          <div id="printable-receipt" className="p-12 space-y-10 bg-white text-foreground font-sans print:p-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <Image 
                  src={businessLogo} 
                  alt="Logo" 
                  fill 
                  className="object-contain grayscale"
                  data-ai-hint="business logo"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold uppercase tracking-tighter">BizManager Store</h2>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Premium Inventory Solutions</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 border-y border-border py-6 text-[12px]">
              <div className="space-y-1.5">
                <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Transaction Info</p>
                <div className="font-mono space-y-0.5">
                  <p>INV: #{sale.invoiceNumber}</p>
                  <p>DATE: {new Date(sale.date).toLocaleDateString()}</p>
                  <p>TIME: {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Store Details</p>
                <div className="font-mono space-y-0.5">
                  <p>STAFF: {user?.email?.split('@')[0].toUpperCase() || 'SYSTEM'}</p>
                  <p>STATUS: PAID / COMPLETED</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-6 min-h-[200px]">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-muted-foreground border-b pb-3">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              <div className="space-y-4">
                {sale.items?.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-sm items-center border-b border-dashed border-muted/30 pb-4 last:border-0">
                    <div className="col-span-6">
                      <p className="font-bold uppercase leading-none">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">SKU: {item.sku || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 text-center font-mono">x{item.quantity}</div>
                    <div className="col-span-2 text-right font-mono">${item.price.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-bold font-mono">${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Section */}
            <div className="pt-8 border-t-2 border-border flex flex-col items-end gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount Paid</p>
              <p className="text-5xl font-black tracking-tighter text-primary font-mono">
                ${Number(sale.totalAmount).toFixed(2)}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-16 text-center space-y-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-40 h-px bg-muted"></div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Authorized Store Signature</span>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">Thank you for choosing BizManager</p>
                <p className="text-[9px] text-muted-foreground/60 italic font-mono">Record ID: {sale.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
