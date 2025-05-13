"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import Layout from "../../components/Layout"
import supabase from "../../utils/supabaseClient"
import { MoonLoader } from "react-spinners"

export default function OrderConfirmation() {
  const router = useRouter()
  const { id } = router.query

  const [order, setOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [spinnerTimeout, setSpinnerTimeout] = useState(false)

  useEffect(() => {
    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  useEffect(() => {
    if (!loading) return
    const timeout = setTimeout(() => setSpinnerTimeout(true), 10000)
    return () => clearTimeout(timeout)
  }, [loading])

  async function fetchOrderDetails() {
    try {
      setLoading(true)

      // Check if user is logged in
      const session = supabase.auth.session()
      if (!session) {
        router.push("/login")
        return
      }

      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, user_id, total_amount, status, created_at, shipping_address, phone")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single()

      if (orderError) throw orderError

      if (!orderData) {
        router.push("/profile")
        return
      }

      setOrder(orderData)

      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, product_name, product_price, quantity")
        .eq("order_id", id)

      if (itemsError) throw itemsError

      setOrderItems(itemsData)
    } catch (error) {
      console.error("Error fetching order details:", error)
      setError("Failed to load order details. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Order Confirmation - BejeweledByJoy</title>
        <meta name="description" content="Order confirmation details." />
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
              onClick={() => { window.location.reload(true); }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded mx-auto"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">Order Confirmation</h1>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center justify-center py-8">
                <div className="bg-green-100 rounded-full p-3">
                  <svg
                    className="h-12 w-12 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Order Confirmation - BejeweledByJoy</h2>
                <p className="text-gray-600">Your order has been confirmed and will be shipped soon.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order ? order.id?.substring(0, 8)?.toUpperCase() : "-"}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{order ? new Date(order.created_at).toLocaleDateString() : "-"}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">Ksh{order ? order.total_amount?.toFixed(2) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{order ? order.status : "-"}</span>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>

              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">Ksh{item.product_price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Ksh{(item.product_price * item.quantity).toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <Link href="/" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  Continue Shopping
                </Link>
                <Link href="/profile" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  View All Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
