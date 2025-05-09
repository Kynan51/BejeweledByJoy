"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminNav from "../../components/AdminNav"
import { DashboardTabs } from "../../components/AdminTabsNav"
import supabase from "../../utils/supabaseClient"

export default function AdminDashboard() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("overview")
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    mostViewedProducts: [],
  })

  useEffect(() => {
    // Fetch admin status and stats logic here
  }, [])

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <AdminNav />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <DashboardTabs />
            <div className="flex-1">
              {router.pathname === "/admin" && (
                loading ? (
                  <div className="animate-pulse">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                          <div className="px-4 py-5 sm:p-6">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-3">
                          {[...Array(5)].map((_, index) => (
                            <div key={index} className="h-8 bg-gray-200 rounded w-full"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalProducts}</dd>
                        </div>
                      </div>
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Product Views</dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalViews}</dd>
                        </div>
                      </div>
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <dt className="text-sm font-medium text-gray-500 truncate">Avg. Views Per Product</dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {stats.totalProducts > 0 ? Math.round(stats.totalViews / stats.totalProducts) : 0}
                          </dd>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Most Viewed Products</h3>
                        <div className="mt-4">
                          <ul className="divide-y divide-gray-200">
                            {stats.mostViewedProducts.length > 0 ? (
                              stats.mostViewedProducts.map((product) => (
                                <li key={product.id} className="py-4">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                      <p className="text-sm text-gray-500 truncate">
                                        ${product.price.toFixed(2)}
                                        {product.discount > 0 && (
                                          <span className="ml-2 text-xs text-red-500">{product.discount}% OFF</span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="inline-flex items-center text-sm font-semibold text-purple-600">
                                      {product.view_count} views
                                    </div>
                                  </div>
                                </li>
                              ))
                            ) : (
                              <li className="py-4 text-center text-gray-500">No product views recorded yet.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
