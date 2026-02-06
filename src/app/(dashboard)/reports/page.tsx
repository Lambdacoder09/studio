
"use client"

import { useState } from "react"
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Package, PieChart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export default function ReportsPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const [dateRange, setDateRange] = useState("This Month")
  
  // Real-time Sales Data
  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "sales"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: sales, isLoading: isSalesLoading } = useCollection(salesQuery)

  // Real-time Expenses Data
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "expenses"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: expenses, isLoading: isExpensesLoading } = useCollection(expensesQuery)

  // Real-time Products Data (for stock valuation)
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

  const totalSales = sales?.reduce((sum, s) => sum + (s.totalAmount || 0), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
  const grossProfit = totalSales - totalExpenses
  const stockValue = products?.reduce((sum, p) => sum + (p.currentQuantity * p.purchasePrice), 0) || 0
  const totalStockUnits = products?.reduce((sum, p) => sum + p.currentQuantity, 0) || 0
  const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Financial Reports</h1>
          <p className="text-muted-foreground">Deep dive into your business metrics and profitability.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> {dateRange}
          </Button>
          <Button className="bg-primary text-white gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Export PDF / Print
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pl" className="w-full">
        <TabsList className="bg-white border shadow-sm h-12 p-1">
          <TabsTrigger value="pl" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Profit & Loss</TabsTrigger>
          <TabsTrigger value="stock" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Stock Valuation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pl" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-white border-none shadow-sm border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">₹{totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Cash inflow from all sales</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm border-l-4 border-l-rose-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Outflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-600">₹{totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Sum of all expenses recorded</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Gross Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">₹{grossProfit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className={`h-3 w-3 mr-1 ${profitMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} /> 
                  Margin ({profitMargin.toFixed(1)}%)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>Detailed P&L Breakdown</CardTitle>
              <CardDescription>Itemized income and expense accounts for {dateRange}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-emerald-600 border-b pb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Income
                  </h3>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm">Product Sales</span>
                    <span className="font-medium font-mono">₹{totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 font-bold border-t border-emerald-100 pt-2">
                    <span>Total Income</span>
                    <span className="font-mono text-emerald-600">₹{totalSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-rose-600 border-b pb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> Expenses
                  </h3>
                  {expenses?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No expenses recorded for this period.</p>
                  ) : (
                    expenses?.map((e, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span className="text-sm">{e.expenseName}</span>
                        <span className="font-medium font-mono">₹{Number(e.amount).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between items-center py-1 font-bold border-t border-rose-100 pt-2">
                    <span>Total Expenses</span>
                    <span className="font-mono text-rose-600">₹{totalExpenses.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-lg">Net Profit/Loss</span>
                  <span className={`text-xl font-bold font-mono ${grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{grossProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>Stock Valuation Report</CardTitle>
              <CardDescription>Current asset value of all products held in inventory.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-primary/5 rounded-xl border border-primary/10 mb-8">
                <div className="space-y-1 text-center md:text-left">
                  <p className="text-sm font-medium text-primary uppercase tracking-widest">Total Stock Value (Cost)</p>
                  <p className="text-5xl font-bold text-primary">₹{stockValue.toFixed(2)}</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm border text-center">
                    <p className="text-xs text-muted-foreground font-medium uppercase">Units</p>
                    <p className="text-xl font-bold">{totalStockUnits}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border text-center">
                    <p className="text-xs text-muted-foreground font-medium uppercase">SKUs</p>
                    <p className="text-xl font-bold">{products?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-primary border-b pb-2">Category Wise Distribution</h3>
                <div className="space-y-3">
                  {Array.from(new Set(products?.map(p => p.category) || [])).map((cat, idx) => {
                    const catValue = products
                      ?.filter(p => p.category === cat)
                      .reduce((sum, p) => sum + (p.currentQuantity * p.purchasePrice), 0) || 0
                    const percent = stockValue > 0 ? (catValue / stockValue) * 100 : 0
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cat}</span>
                          <span className="text-muted-foreground font-mono">₹{catValue.toFixed(2)} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${idx % 2 === 0 ? 'bg-primary' : 'bg-secondary'}`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
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
