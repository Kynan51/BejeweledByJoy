import { useRouter } from "next/router"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useIsMobile } from "../hooks/use-mobile"

const adminTabs = [
  { label: "Dashboard", path: "/admin" },
  { label: "Products", path: "/admin/products" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Manage Admins", path: "/admin/admins" },
]

const dashboardTabs = [
  { label: "Overview", value: "overview" },
  { label: "Analytics", value: "analytics" },
  { label: "Manage Products", value: "products" },
  { label: "Manage Admins", value: "admins" },
]

export function DashboardTabs() {
  const router = useRouter()
  const isMobile = useIsMobile()
  // Map tab value to route
  const tabToRoute = {
    overview: "/admin",
    analytics: "/admin/analytics",
    products: "/admin/products",
    admins: "/admin/admins",
  }
  // Determine current tab from route
  let currentTab = "overview"
  if (router.pathname === "/admin/analytics") currentTab = "analytics"
  else if (router.pathname === "/admin/products") currentTab = "products"
  else if (router.pathname === "/admin/admins") currentTab = "admins"

  return (
    <Tabs value={currentTab} onValueChange={val => router.push(tabToRoute[val])} className="w-full mb-4">
      <TabsList className="w-full flex justify-between">
        {dashboardTabs.map(t => (
          <TabsTrigger key={t.value} value={t.value} className="flex-1">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default function AdminTabsNav() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const current = adminTabs.find(tab => router.pathname === tab.path) || adminTabs[0]

  // On mobile, use tabs UI at the top
  if (isMobile) {
    return (
      <Tabs value={current.path} onValueChange={val => router.push(val)} className="w-full mb-4">
        <TabsList className="w-full flex justify-between">
          {adminTabs.map(tab => (
            <TabsTrigger key={tab.path} value={tab.path} className="flex-1">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    )
  }
  // On desktop, fallback to nothing (sidebar will show)
  return null
}
