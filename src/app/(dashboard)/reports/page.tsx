
"use client"

import { useState } from "react"
import { Calendar, Download, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export default function ReportsPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const [dateRange, setDateRange] = useState("This Month")
  
  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "sales"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: sales, isLoading: isSalesLoading } = useCollection(salesQuery)

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "expenses"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: expenses, isLoading: isExpensesLoading } = useCollection(expensesQuery)

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "products"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery)

  if (isSalesLoading || isExpensesLoading || isProductsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalSalesIncTax = sales?.reduce((sum, s) => sum + (s.totalAmount || 0), 0) || 0
  const totalTaxCollected = sales?.reduce((sum, s) => sum + (s.totalTax || 0), 0) || 0
  const netRevenue = totalSalesIncTax - totalTaxCollected
  
  const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
  const netProfit = netRevenue - totalExpenses
  
  const stockValueAtCost = products?.reduce((sum, p) => sum + (p.currentQuantity * p.purchasePrice), 0) || 0
  const totalStockUnits = products?.reduce((sum, p) => sum + p.currentQuantity, 0) || 0
  const profitMarginPercent = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Financial Reports</h1>
          <p className="text-muted-foreground">Profitability insights with GST accounting.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> {dateRange}
          </Button>
          <Button className="bg-primary text-white gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pl" className="w-full">
        <TabsList className="bg-white border shadow-sm h-12 p-1">
          <TabsTrigger value="pl" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Profit & Loss</TabsTrigger>
          <TabsTrigger value="stock" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Stock Valuation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pl" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Net Revenue (Excl Tax)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">₹{netRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">GST Payable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">₹{totalTaxCollected.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">₹{totalExpenses.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{netProfit.toFixed(2)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Margin: {profitMarginPercent.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>GST Liability Breakdown</CardTitle>
              <CardDescription>Estimated tax components collected from sales.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Central GST (CGST)</span>
                    <span className="font-mono font-medium">₹{(totalTaxCollected/2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">State GST (SGST)</span>
                    <span className="font-mono font-medium">₹{(totalTaxCollected/2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-bold bg-muted/20 px-4 rounded">
                    <span className="text-sm">Total Tax Collected</span>
                    <span className="font-mono text-orange-600">₹{totalTaxCollected.toFixed(2)}</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>Stock Valuation Report</CardTitle>
              <CardDescription>Asset value based on landing cost (Excl. Tax).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-primary/5 rounded-xl border border-primary/10 mb-8">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-primary uppercase tracking-widest">Total Inventory Value (Cost)</p>
                  <p className="text-5xl font-bold text-primary">₹{stockValueAtCost.toFixed(2)}</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm border text-center">
                    <p className="text-xs text-muted-foreground font-medium uppercase">Units</p>
                    <p className="text-xl font-bold">{totalStockUnits}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold text-primary border-b pb-2">GST Category Mix</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[0, 5, 12, 18].map(rate => {
                    const rateValue = products?.filter(p => p.gstRate === rate)
                      .reduce((sum, p) => sum + (p.currentQuantity * p.purchasePrice), 0) || 0
                    const count = products?.filter(p => p.gstRate === rate).length || 0
                    return (
                      <Card key={rate} className="bg-muted/10 border-none">
                        <CardHeader className="p-4 pb-0">
                          <CardTitle className="text-xs text-muted-foreground uppercase">{rate}% Category</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="text-xl font-bold">₹{rateValue.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">{count} Products</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
