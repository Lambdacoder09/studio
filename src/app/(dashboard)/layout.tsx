import { SidebarNav } from "@/components/layout/sidebar-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="print:hidden">
        <SidebarNav />
      </div>
      <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
        <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:space-y-0">
          {children}
        </div>
      </main>
    </div>
  )
}