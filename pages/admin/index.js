"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminNav from "../../components/AdminNav"
import { useAuth } from "../../contexts/AuthContext"
import { getUserRole, isAdminRole, isOwnerRole } from "../../utils/role"
import { MoonLoader } from "react-spinners"

export default function AdminDashboard() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    mostViewedProducts: [],
  });
  const [spinnerTimeout, setSpinnerTimeout] = useState(false);

  const userEmail = session?.user?.email || null;
  const role = userEmail ? getUserRole(userEmail) : null;
  const isAdmin = userEmail ? isAdminRole(userEmail) : false;
  const isOwner = userEmail ? isOwnerRole(userEmail) : false;

  useEffect(() => {
    if (!loading && !isAdmin && !isOwner) {
      router.replace("/");
    }
  }, [loading, isAdmin, isOwner]);

  // Prevent spinner from blocking UI forever (fallback after 10s)
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => setSpinnerTimeout(true), 10000);
    return () => clearTimeout(timeout);
  }, [loading]);

  if (!(isAdmin || isOwner)) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      {/* Non-blocking spinner overlay during loading, with fallback */}
      {loading && !spinnerTimeout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
          <MoonLoader color="#a855f7" size={48} />
        </div>
      )}
      {spinnerTimeout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="bg-white p-6 rounded shadow text-red-600 text-center flex flex-col items-center">
            Something went wrong. Please try refreshing the page.
            <button
              onClick={() => { window.location.href = window.location.href; }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded mx-auto"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <AdminNav isAdmin={isAdmin} />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
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
