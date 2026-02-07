
"use client"

import { use } from "react"
import { Printer, ArrowLeft, Loader2 } from "lucide-react"
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
        <Button asChild className="mt-6">
          <Link href="/sales">Back to Sales History</Link>
        </Button>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const subtotal = sale.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0
  const tax = sale.totalTax || 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/sales">
            <ArrowLeft className="h-4 w-4" /> Back to Sales
          </Link>
        </Button>
        <Button variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print Tax Invoice
        </Button>
      </div>

      <Card className="border-none shadow-lg bg-white overflow-hidden">
        <CardContent className="p-0">
          <div id="printable-receipt" className="p-12 space-y-10 bg-white text-foreground font-sans print:p-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <Image src={businessLogo} alt="Logo" fill className="object-contain grayscale" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold uppercase tracking-tighter">BizManager Pharmacy</h2>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Authorized Tax Invoice</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 border-y border-border py-6 text-[11px]">
              <div className="space-y-1.5 font-mono">
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Invoice Details</p>
                <p>INV NO: #{sale.invoiceNumber}</p>
                <p>DATE: {new Date(sale.date).toLocaleDateString()}</p>
                <p>TIME: {new Date(sale.date).toLocaleTimeString()}</p>
              </div>
              <div className="text-right space-y-1.5 font-mono">
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Tax Registration</p>
                <p>GSTIN: 27AAAAA0000A1Z5 (Sample)</p>
                <p>CASHIER: {user?.email?.split('@')[0].toUpperCase()}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-6 min-h-[200px]">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-muted-foreground border-b pb-3">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-1 text-center">GST%</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              <div className="space-y-4">
                {sale.items?.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-xs items-center border-b border-dashed border-muted/30 pb-4 last:border-0">
                    <div className="col-span-5">
                      <p className="font-bold uppercase">{item.name}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">SKU: {item.sku || 'N/A'}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">MFR: {item.manufacturer || 'N/A'}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">EXP: {item.expiryDate || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 text-center font-mono">x{item.quantity}</div>
                    <div className="col-span-1 text-center font-mono">{item.gstRate}%</div>
                    <div className="col-span-2 text-right font-mono">₹{item.price.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-bold font-mono">₹{(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Summary Section */}
            <div className="pt-8 border-t-2 border-border grid grid-cols-2 gap-8">
              <div className="space-y-2 text-[10px] font-mono text-muted-foreground">
                <p className="font-bold uppercase">GST Summary</p>
                <div className="grid grid-cols-2 border-t pt-2">
                  <span>CGST (Excl)</span>
                  <span className="text-right">₹{(tax/2).toFixed(2)}</span>
                  <span>SGST (Excl)</span>
                  <span className="text-right">₹{(tax/2).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex justify-between w-full text-[11px] font-mono text-muted-foreground">
                  <span>SUBTOTAL</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full text-[11px] font-mono text-muted-foreground">
                  <span>TOTAL TAX</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4">Invoice Total (Net)</p>
                <p className="text-5xl font-black tracking-tighter text-primary font-mono">
                  ₹{Number(sale.totalAmount).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-16 text-center space-y-6">
              <div className="w-40 h-px bg-muted mx-auto"></div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Authorized Store Signature</p>
              <p className="text-[10px] text-muted-foreground italic">GST is calculated based on Govt. specified medical categories.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
