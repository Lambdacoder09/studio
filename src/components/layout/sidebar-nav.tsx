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
import { useAuth, useUser, setDocumentNonBlocking, useFirestore } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, collection } from "firebase/firestore"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

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
  const { state } = useSidebar()

  const handleLogout = async () => {
    if (auth && user && firestore) {
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b h-16 flex items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary overflow-hidden">
          <div className="h-8 w-8 min-w-[32px] rounded bg-primary text-white flex items-center justify-center shrink-0">
            B
          </div>
          <span className={cn(
            "transition-opacity duration-300",
            state === "collapsed" ? "opacity-0 w-0" : "opacity-100"
          )}>
            BizManager
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              tooltip="Logout"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}