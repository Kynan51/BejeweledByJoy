"use client"

// Fix: Use correct router import for app/pages directory
import { usePathname, useRouter as useAppRouter } from "next/navigation"
import { useRouter as usePagesRouter } from "next/router"
import Link from "next/link"
import PropTypes from "prop-types"

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

export default function AdminNav({ isAdmin }) {
  const router = getRouter();

  const isActive = (path) => {
    return (router.pathname || router.asPath) === path
      ? "bg-purple-100 text-purple-700"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
  };

  if (!isAdmin) return null;

  return (
    <nav className="space-y-1 mb-6">
      <Link href="/admin" className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin")}`}> 
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        Dashboard
      </Link>
      <Link href="/admin/products" className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin/products")}`}> 
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        Manage Products
      </Link>
      <Link href="/admin/analytics" className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin/analytics")}`}> 
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Analytics
      </Link>
      <Link href="/admin/admins" className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin/admins")}`}> 
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        Manage Admins
      </Link>
    </nav>
  );
}

AdminNav.propTypes = { isAdmin: PropTypes.bool }
