
import { Plus, Truck, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MOCK_PURCHASES } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Purchase Management</h1>
          <p className="text-muted-foreground">Record new supply orders and track purchase history.</p>
        </div>
        <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2">
          <Plus className="h-4 w-4" /> Record New Purchase
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procurement</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,450.00</div>
            <p className="text-xs text-muted-foreground">Total spent on supplies this month</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Suppliers</CardTitle>
            <User className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active suppliers in database</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Restock</CardTitle>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 days ago</div>
            <p className="text-xs text-muted-foreground">Last purchase date</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Comprehensive list of stock increases from suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Supplier</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="text-center font-semibold">Quantity</TableHead>
                  <TableHead className="text-right font-semibold">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold">Total Price</TableHead>
                  <TableHead className="text-center font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PURCHASES.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                    <TableCell>{purchase.productName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-primary/5 text-primary">+{purchase.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${purchase.purchasePrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ${(purchase.quantity * purchase.purchasePrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {purchase.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
