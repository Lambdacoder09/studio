
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Receipt, 
  BarChart3, 
  Settings,
  LogOut,
  ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth, useUser, setDocumentNonBlocking } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, collection } from "firebase/firestore"
import { useFirestore } from "@/firebase"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: Truck },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Logs", href: "/logs", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const firestore = useFirestore()

  const handleLogout = async () => {
    if (auth && user && firestore) {
      // Log the logout event
      const logRef = doc(collection(firestore, "logs"))
      setDocumentNonBlocking(logRef, {
        id: logRef.id,
        ownerId: user.uid,
        type: "auth",
        action: `User logged out: ${user.email}`,
        timestamp: new Date().toISOString()
      }, { merge: true })

      await signOut(auth)
      router.push("/login")
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="h-8 w-8 rounded bg-primary text-white flex items-center justify-center">B</div>
          <span>BizManager</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )
}
