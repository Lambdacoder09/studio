
"use client"

import { useState } from "react"
import { Plus, Receipt, Filter, ArrowUpRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"

const expenseSchema = z.object({
  expenseName: z.string().min(2, "Description required"),
  category: z.string().min(1, "Category required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function ExpensesPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "expenses"), where("ownerId", "==", user.uid))
  }, [firestore, user])
  const { data: rawExpenses, isLoading } = useCollection(expensesQuery)

  const expenses = rawExpenses ? [...rawExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseName: "",
      category: "Utilities",
      amount: 0,
    },
  })

  function onSubmit(values: ExpenseFormValues) {
    if (!user || !firestore) return

    const expenseRef = doc(collection(firestore, "expenses"))
    const expenseData = {
      ...values,
      id: expenseRef.id,
      ownerId: user.uid,
      date: new Date().toISOString(),
    }

    setDocumentNonBlocking(expenseRef, expenseData, { merge: true })

    setIsAddDialogOpen(false)
    form.reset()
    toast({ title: "Expense Added", description: "Your business expenses have been updated." })
  }

  const totalSpent = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Expense Tracking</h1>
          <p className="text-muted-foreground">Monitor your operational costs and outflows.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2">
              <Plus className="h-4 w-4" /> Add New Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>Record a business cost or operational outflow.</DialogDescription>
                </DialogHeader>
                <FormField
                  control={form.control}
                  name="expenseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Input placeholder="e.g. Monthly Rent" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Supplies">Supplies</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Expense</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Expenditure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-rose-600">${totalSpent.toFixed(2)}</span>
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
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No expenses recorded yet.</TableCell></TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.expenseName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal capitalize">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600">
                        -${Number(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
