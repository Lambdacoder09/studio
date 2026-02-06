
"use client"

import { useState, useMemo } from "react"
import { Calendar, Download, TrendingUp, TrendingDown, Loader2, IndianRupee, PieChart as PieChartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportsPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const [timeframe, setTimeframe] = useState<"month" | "year" | "all">("month")
  
  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "sales"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: rawSales, isLoading: isSalesLoading } = useCollection(salesQuery)

  const purchasesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "purchases"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: rawPurchases, isLoading: isPurchasesLoading } = useCollection(purchasesQuery)

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "expenses"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: rawExpenses, isLoading: isExpensesLoading } = useCollection(expensesQuery)

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "products"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery)

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    const now = new Date()
    let start: Date, end: Date

    if (timeframe === "month") {
      start = startOfMonth(now)
      end = endOfMonth(now)
    } else if (timeframe === "year") {
      start = startOfYear(now)
      end = endOfYear(now)
    } else {
      return { sales: rawSales || [], purchases: rawPurchases || [], expenses: rawExpenses || [] }
    }

    const filterFn = (item: any) => {
      const date = new Date(item.date || item.timestamp)
      return isWithinInterval(date, { start, end })
    }

    return {
      sales: rawSales?.filter(filterFn) || [],
      purchases: rawPurchases?.filter(filterFn) || [],
      expenses: rawExpenses?.filter(filterFn) || []
    }
  }, [timeframe, rawSales, rawPurchases, rawExpenses])

  if (isSalesLoading || isPurchasesLoading || isExpensesLoading || isProductsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { sales, purchases, expenses } = filteredData

  // Sales Calculations
  const totalSalesIncTax = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const totalTaxCollected = sales.reduce((sum, s) => sum + (s.totalTax || 0), 0)
  const netRevenue = totalSalesIncTax - totalTaxCollected
  
  // Purchase Calculations (Input Tax Credit)
  const totalPurchasesExcTax = purchases.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.purchasePrice)), 0)
  const totalTaxPaid = purchases.reduce((sum, p) => sum + (p.gstAmount || 0), 0)

  // GST Liability
  const netGstPayable = totalTaxCollected - totalTaxPaid

  // Profitability
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const grossProfit = netRevenue - totalPurchasesExcTax
  const netProfit = grossProfit - totalExpenses
  
  const stockValueAtCost = products?.reduce((sum, p) => sum + (p.currentQuantity * p.purchasePrice), 0) || 0
  const totalStockUnits = products?.reduce((sum, p) => sum + p.currentQuantity, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Financial Reports</h1>
          <p className="text-muted-foreground">GST accounting and profitability insights.</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={(val: any) => setTimeframe(val)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary text-white gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{netRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Excl. Sales Tax</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">GST Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totalTaxCollected.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Output Tax Liability</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">GST Paid (ITC)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{totalTaxPaid.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Input Tax Credit</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-primary uppercase">Net GST Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{netGstPayable.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">To be remitted</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gst" className="w-full">
        <TabsList className="bg-white border shadow-sm h-12 p-1">
          <TabsTrigger value="gst" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">GST Summary</TabsTrigger>
          <TabsTrigger value="pl" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Profit & Loss</TabsTrigger>
          <TabsTrigger value="stock" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Inventory Valuation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gst" className="mt-6 space-y-6">
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle>Detailed GST Computation</CardTitle>
              <CardDescription>Breakdown of taxes for {timeframe === 'month' ? format(new Date(), 'MMMM yyyy') : timeframe === 'year' ? format(new Date(), 'yyyy') : 'All Time'}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-bold flex items-center gap-2 text-orange-600 border-b pb-2 uppercase text-xs tracking-wider">
                        <TrendingUp className="h-4 w-4" /> Output Tax (Sales)
                      </h3>
                      <div className="flex justify-between items-center text-sm">
                        <span>CGST (Sales)</span>
                        <span className="font-mono">₹{(totalTaxCollected/2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>SGST (Sales)</span>
                        <span className="font-mono">₹{(totalTaxCollected/2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-dashed">
                        <span>Total Collected</span>
                        <span className="text-orange-600">₹{totalTaxCollected.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold flex items-center gap-2 text-blue-600 border-b pb-2 uppercase text-xs tracking-wider">
                        <TrendingDown className="h-4 w-4" /> Input Credit (Purchases)
                      </h3>
                      <div className="flex justify-between items-center text-sm">
                        <span>CGST Paid</span>
                        <span className="font-mono">₹{(totalTaxPaid/2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>SGST Paid</span>
                        <span className="font-mono">₹{(totalTaxPaid/2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-dashed">
                        <span>Total ITC</span>
                        <span className="text-blue-600">₹{totalTaxPaid.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h4 className="text-lg font-bold">Net Remittance</h4>
                        <p className="text-sm text-muted-foreground">Amount after deducting Input Tax Credit</p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-primary font-mono tracking-tighter">
                          ₹{netGstPayable.toFixed(2)}
                        </div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Due for remittance</p>
                      </div>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl" className="mt-6 space-y-6">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>Income Statement Summary</CardTitle>
              <CardDescription>Financial performance excluding taxes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm">Net Sales Revenue</span>
                    <span className="font-bold text-emerald-600">+₹{netRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm">Cost of Goods Sold (Purchases)</span>
                    <span className="font-bold text-rose-500">-₹{totalPurchasesExcTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-muted/30 px-3 rounded font-bold">
                    <span>Gross Profit</span>
                    <span className="text-emerald-700">₹{grossProfit.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm">Operating Expenses</span>
                    <span className="font-bold text-rose-500">-₹{totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-primary/10 px-3 rounded font-bold text-lg mt-4">
                    <span>Net Profit</span>
                    <span className={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      ₹{netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>Current Asset Valuation</CardTitle>
              <CardDescription>Total landing value of on-hand inventory.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-primary/5 rounded-2xl border border-primary/10 mb-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Total Valuation (Cost)</p>
                  <p className="text-6xl font-black text-primary tracking-tighter">₹{stockValueAtCost.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Excludes GST components</p>
                </div>
                <div className="mt-6 md:mt-0 flex flex-col items-end gap-2 text-right">
                  <div className="px-6 py-4 bg-white rounded-xl shadow-sm border">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Inventory Units</p>
                    <p className="text-3xl font-black">{totalStockUnits}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[0, 5, 12, 18].map(rate => {
                  const rateValue = products?.filter(p => p.gstRate === rate)
                    .reduce((sum, p) => sum + (p.currentQuantity * p.purchasePrice), 0) || 0
                  const count = products?.filter(p => p.gstRate === rate).length || 0
                  return (
                    <Card key={rate} className="bg-muted/10 border-none">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase">{rate}% GST Category</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="text-xl font-bold">₹{rateValue.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{count} items</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
