
"use client"

import { useState } from "react"
import { ShoppingCart, Plus, Receipt, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MOCK_SALES } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

export default function SalesPage() {
  const [view, setView] = useState<"history" | "new">("history")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Sales Management</h1>
          <p className="text-muted-foreground">Process new sales and manage transaction history.</p>
        </div>
        <div className="flex gap-2">
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
        <Card className="border-none shadow-sm bg-white">
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
                  {MOCK_SALES.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium font-mono">{sale.invoiceNumber}</TableCell>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sale.items.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] whitespace-nowrap">
                              {item.name} x{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        ${sale.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none">Paid</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Download Invoice">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Create New Sale</CardTitle>
              <CardDescription>Select products and quantities for this transaction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="Search products..."
                    className="w-full pl-8 h-10 rounded-md border border-input px-3 py-2 text-sm"
                  />
                </div>
                <Button variant="outline" className="shrink-0">Browse Catalog</Button>
              </div>

              <div className="rounded-md border p-8 text-center bg-muted/20 border-dashed">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Cart is empty</p>
                  <p className="text-xs text-muted-foreground">Add products from the catalog to begin.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white h-fit">
            <CardHeader>
              <CardTitle>Sale Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-emerald-600">-$0.00</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">$0.00</span>
                </div>
              </div>
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-white" disabled>
                Complete Transaction
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
