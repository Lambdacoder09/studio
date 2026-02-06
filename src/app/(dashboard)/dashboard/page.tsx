
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  Receipt,
  Loader2
} from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()

  // Real-time Products Data
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "products"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery)

  // Real-time Sales Data
  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "sales"), where("ownerId", "==", user.uid), orderBy("date", "desc"))
  }, [firestore, user])
  const { data: sales, isLoading: isSalesLoading } = useCollection(salesQuery)

  // Real-time Expenses (Still mock for now as per schema logic)
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "expenses"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: expenses } = useCollection(expensesQuery)

  if (isUserLoading || isProductsLoading || isSalesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalSales = sales?.reduce((sum, s) => sum + (s.totalAmount || 0), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
  const lowStockItems = products?.filter(p => p.currentQuantity < 10) || []
  const totalInventoryValue = products?.reduce((sum, p) => sum + (p.currentQuantity * p.purchasePrice), 0) || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Business Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time performance summary for your business.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-emerald-500 flex items-center mr-1"><ArrowUpRight className="h-3 w-3" /> Updated</span> just now
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total recorded costs</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current assets in inventory</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Items needing attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions from your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
              ) : (
                sales?.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none font-mono">{sale.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(sale.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">+${Number(sale.totalAmount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{sale.items?.length || 0} item(s)</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Inventory Quick Alerts</CardTitle>
            <CardDescription>Items below threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-20" />
                  <p className="text-xs text-muted-foreground">All stock levels healthy.</p>
                </div>
              ) : (
                lowStockItems.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-md bg-orange-50/50">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-sm">{product.productName}</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-[10px]">
                      {product.currentQuantity} left
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
