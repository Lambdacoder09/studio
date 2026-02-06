
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Receipt 
} from "lucide-react"
import { MOCK_SALES, MOCK_EXPENSES, MOCK_PRODUCTS } from "@/lib/mock-data"

export default function DashboardPage() {
  const totalSales = MOCK_SALES.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalExpenses = MOCK_EXPENSES.reduce((sum, e) => sum + e.amount, 0)
  const lowStockCount = MOCK_PRODUCTS.filter(p => p.quantity < 10).length
  const totalInventoryValue = MOCK_PRODUCTS.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Overview</h1>
        <p className="text-muted-foreground mt-1">Summary of your business performance for the month.</p>
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
              <span className="text-emerald-500 flex items-center mr-1"><ArrowUpRight className="h-3 w-3" /> +12%</span> from last month
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
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-rose-500 flex items-center mr-1"><ArrowDownRight className="h-3 w-3" /> -4%</span> from last month
            </p>
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
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Items below threshold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>The last 5 transactions from your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_SALES.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{sale.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">+${sale.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{sale.items.length} item(s)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest outflows recorded.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_EXPENSES.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{expense.name}</p>
                    <p className="text-xs text-muted-foreground">{expense.category} • {expense.date}</p>
                  </div>
                  <div className="text-sm font-bold text-rose-600">-${expense.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Quick Alerts</CardTitle>
            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Needs Attention</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MOCK_PRODUCTS.filter(p => p.quantity < 10).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-md bg-orange-50/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Only {product.quantity} left</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">Restock Now</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
