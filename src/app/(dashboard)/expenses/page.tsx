
"use client"

import { useState } from "react"
import { Plus, Receipt, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MOCK_EXPENSES } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

export default function ExpensesPage() {
  const totalThisMonth = MOCK_EXPENSES.reduce((acc, curr) => acc + curr.amount, 0)
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Expense Tracking</h1>
          <p className="text-muted-foreground">Monitor your operational costs and outflows.</p>
        </div>
        <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2">
          <Plus className="h-4 w-4" /> Add New Expense
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Monthly Expenditure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-rose-600">${totalThisMonth.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground flex items-center">
                <ArrowUpRight className="h-3 w-3 text-rose-500 mr-1" /> +5.2% vs last month
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Fixed Costs</p>
                <p className="font-semibold">$1,200.00</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Variable Costs</p>
                <p className="font-semibold">${(totalThisMonth - 1200).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expense by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Rent</span>
                <span>80%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Utilities</span>
                <span>15%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: '15%' }}></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Other</span>
                <span>5%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground" style={{ width: '5%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expense Log</CardTitle>
            <CardDescription>Historical record of all business spending.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter By Date
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="text-right font-semibold">Amount</TableHead>
                  <TableHead className="text-center font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_EXPENSES.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal capitalize">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600">
                      -${expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {expense.date}
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
