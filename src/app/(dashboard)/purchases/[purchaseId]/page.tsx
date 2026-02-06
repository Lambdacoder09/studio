
"use client"

import { use } from "react"
import { Printer, ArrowLeft, Loader2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import Link from "next/link"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function PurchaseVoucherPage({ params }: { params: Promise<{ purchaseId: string }> }) {
  const { purchaseId } = use(params)
  const { user } = useUser()
  const firestore = useFirestore()
  const businessLogo = PlaceHolderImages.find(img => img.id === 'business-logo')?.imageUrl || "https://picsum.photos/seed/biz1/200/200"

  const purchaseRef = useMemoFirebase(() => {
    if (!firestore || !purchaseId) return null
    return doc(firestore, "purchases", purchaseId)
  }, [firestore, purchaseId])

  const { data: purchase, isLoading } = useDoc(purchaseRef)

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Voucher Not Found</h2>
        <p className="text-muted-foreground mt-2">The procurement record could not be located.</p>
        <Button asChild className="mt-6">
          <Link href="/purchases">Back to Purchases</Link>
        </Button>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const totalCost = Number(purchase.quantity) * Number(purchase.purchasePrice)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" /> Back to Purchases
          </Link>
        </Button>
        <Button className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print Document
        </Button>
      </div>

      <Card className="border-none shadow-lg bg-white overflow-hidden">
        <CardContent className="p-0">
          <div id="printable-receipt" className="p-12 space-y-12 bg-white text-foreground font-sans print:p-8">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-6">
                <div className="relative w-20 h-20">
                  <Image 
                    src={businessLogo} 
                    alt="Logo" 
                    fill 
                    className="object-contain grayscale"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold uppercase tracking-tighter">BizManager Store</h2>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Premium Inventory Solutions</p>
                </div>
              </div>
              <div className="text-right space-y-3">
                <h3 className="text-5xl font-black text-primary/10 uppercase tracking-tighter">Voucher</h3>
                <div className="space-y-1 text-xs font-mono">
                  <p className="font-bold">NO: {purchase.voucherNumber}</p>
                  <p>DATE: {new Date(purchase.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Entity Info */}
            <div className="grid grid-cols-2 gap-12 border-y border-border py-8 text-[12px]">
              <div className="space-y-3">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Vendor / Supplier</p>
                <div className="space-y-1">
                  <p className="text-xl font-bold uppercase">{purchase.supplierName}</p>
                  <p className="text-muted-foreground font-mono">ID: SUP-{purchase.supplierName.slice(0, 3).toUpperCase()}</p>
                </div>
              </div>
              <div className="space-y-3 text-right">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Receiving Store</p>
                <div className="space-y-1">
                  <p className="text-xl font-bold uppercase">BizManager Store</p>
                  <p className="text-muted-foreground font-mono">OFFICER: {user?.email?.split('@')[0].toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Procurement Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-muted-foreground border-b pb-3">
                <div className="col-span-6">Inventory Description</div>
                <div className="col-span-2 text-center">Unit Qty</div>
                <div className="col-span-2 text-right">Unit Cost</div>
                <div className="col-span-2 text-right">Extended</div>
              </div>
              <div className="grid grid-cols-12 text-sm items-center border-b border-dashed pb-6">
                <div className="col-span-6">
                  <p className="font-bold uppercase leading-tight text-lg">{purchase.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1 tracking-wider">SKU: {purchase.sku || 'N/A'}</p>
                </div>
                <div className="col-span-2 text-center font-mono text-lg">+{purchase.quantity}</div>
                <div className="col-span-2 text-right font-mono">${Number(purchase.purchasePrice).toFixed(2)}</div>
                <div className="col-span-2 text-right font-bold font-mono text-lg">
                  ${totalCost.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="flex justify-end pt-8">
              <div className="w-1/2 space-y-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest border-b pb-2">
                  <span>Gross Procurement</span>
                  <span className="font-mono">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-widest">Total Voucher Value</span>
                  <span className="text-4xl font-black tracking-tighter text-primary font-mono">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-20 grid grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="w-full h-px bg-muted"></div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Supplier Authorized Signatory</p>
                </div>
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="w-full h-px bg-muted"></div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal Receiving Officer</p>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-12">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest italic flex items-center justify-center gap-2">
                <Truck className="h-3 w-3" /> System Verified: Inventory stock levels updated successfully
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
