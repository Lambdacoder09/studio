
"use client"

import { useMemo } from "react"
import { History, Search, Loader2, ShieldCheck, ShoppingBag, Truck, CreditCard, UserCheck, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { format } from "date-fns"
import { useState } from "react"

const LogIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'auth': return <UserCheck className="h-4 w-4 text-blue-500" />
    case 'sale': return <ShoppingBag className="h-4 w-4 text-emerald-500" />
    case 'purchase': return <Truck className="h-4 w-4 text-orange-500" />
    case 'expense': return <CreditCard className="h-4 w-4 text-rose-500" />
    default: return <History className="h-4 w-4 text-muted-foreground" />
  }
}

export default function LogsPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    // Note: This requires an index if using orderBy.
    // For MVP, we'll fetch and sort in-memory or just use a basic query.
    return query(
      collection(firestore, "logs"),
      where("ownerId", "==", user.uid)
    )
  }, [firestore, user])

  const { data: rawLogs, isLoading } = useCollection(logsQuery)

  const logs = useMemo(() => {
    if (!rawLogs) return []
    return [...rawLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [rawLogs])

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <ShieldCheck className="h-8 w-8" /> Activity Audit Logs
        </h1>
        <p className="text-muted-foreground">Detailed history of all actions performed in your business account.</p>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-8 bg-muted/50 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[200px] font-semibold">Timestamp</TableHead>
                  <TableHead className="w-[120px] font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Action Performed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {format(new Date(log.timestamp), "MMM d, yyyy • HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1.5 font-normal capitalize py-0.5">
                          <LogIcon type={log.type} />
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{log.action}</span>
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
