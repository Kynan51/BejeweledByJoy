import { usePathname, useRouter as useAppRouter } from "next/navigation"
import { useRouter as usePagesRouter } from "next/router"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useIsMobile } from "../hooks/use-mobile"

function getRouter() {
  // If window is defined and pathname is available, use app router
  if (typeof window !== "undefined" && usePathname) {
    try {
      return useAppRouter();
    } catch {
      // fallback
    }
  }
  // fallback to pages router
  return usePagesRouter();
}

const adminTabs = [
  { label: "Dashboard", path: "/admin" },
  { label: "Products", path: "/admin/products" },
  { label: "Analytics", path: "/admin/analytics" },
  // Manage Admins will be conditionally added below
];

const dashboardTabs = [
  { label: "Overview", value: "overview" },
  { label: "Analytics", value: "analytics" },
  { label: "Manage Products", value: "products" },
  // Manage Admins will be conditionally added below
];

export function DashboardTabs({ isOwner }) {
  const router = getRouter();
  const isMobile = useIsMobile();
  // Map tab value to route
  const tabToRoute = {
    overview: "/admin",
    analytics: "/admin/analytics",
    products: "/admin/products",
    admins: "/admin/admins",
  }
  // Determine current tab from route
  let currentTab = "overview"
  if ((router.pathname || router.asPath) === "/admin/analytics") currentTab = "analytics"
  else if ((router.pathname || router.asPath) === "/admin/products") currentTab = "products"
  else if ((router.pathname || router.asPath) === "/admin/admins") currentTab = "admins"

  // Only show Manage Admins tab if owner
  const tabsToShow = isOwner
    ? [...dashboardTabs, { label: "Manage Admins", value: "admins" }]
    : dashboardTabs;

  return (
    <Tabs value={currentTab} onValueChange={val => router.push(tabToRoute[val])} className="w-full mb-4">
      <TabsList className="w-full flex justify-between">
        {tabsToShow.map(t => (
          <TabsTrigger key={t.value} value={t.value} className="flex-1">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default function AdminTabsNav({ isAdmin, isOwner }) {
  const router = getRouter();
  const isMobile = useIsMobile();
  // Only show Manage Admins tab if owner
  const tabsToShow = isOwner
    ? [...adminTabs, { label: "Manage Admins", path: "/admin/admins" }]
    : adminTabs.filter(tab => tab.path !== "/admin/admins");
  const current = tabsToShow.find(tab => (router.pathname || router.asPath) === tab.path) || tabsToShow[0];
  if (!isAdmin && !isOwner) return null;

  // On mobile, use tabs UI at the top
  if (isMobile) {
    return (
      <Tabs value={current.path} onValueChange={val => router.push(val)} className="w-full mb-4">
        <TabsList className="w-full flex justify-between">
          {tabsToShow.map(tab => (
            <TabsTrigger key={tab.path} value={tab.path} className="flex-1">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }
  // On desktop, fallback to nothing (sidebar will show)
  return null;
}
