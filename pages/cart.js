"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import Layout from "../components/Layout"
import { useCart } from "../contexts/CartContext"
import supabase from "../utils/supabaseClient"
import { MoonLoader } from "react-spinners"

export default function Cart() {
  const { cart, loading, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState(null)
  const [spinnerTimeout, setSpinnerTimeout] = useState(false)
  const router = useRouter()

  // Prevent spinner from blocking UI forever (fallback after 10s)
  useEffect(() => {
    if (!loading && !checkoutLoading) return
    const timeout = setTimeout(() => setSpinnerTimeout(true), 10000)
    return () => clearTimeout(timeout)
  }, [loading, checkoutLoading])

  const handleCheckout = async () => {
    try {
      // Check if user is logged in (Supabase v2+)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login?redirect=/cart")
        return
      }

      setCheckoutLoading(true)
      setError(null)

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, address, phone")
        .eq("id", session.user.id)
        .single()

      if (userError) throw userError

      // Check if user has address
      if (!userData.address || !userData.phone) {
        router.push("/profile?checkout=true")
        return
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: session.user.id,
            total_amount: getCartTotal(),
            status: "pending",
            shipping_address: userData.address,
            phone: userData.phone,
          },
        ])
        .select("id")
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      await clearCart()

      // Redirect to order confirmation
      router.push(`/order-confirmation/${order.id}`)
    } catch (error) {
      console.error("Error during checkout:", error)
      setError("An error occurred during checkout. Please try again.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Shopping Cart - BejeweledByJoy</title>
        <meta name="description" content="View your shopping cart and proceed to checkout." />
      </Head>

      {/* Remove the overlay spinner, keep only the error prompt below */}
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
          <h1 className="text-2xl font-semibold text-gray-900">Your Shopping Cart</h1>
          {/* <h2 className="text-2xl font-bold mb-4">Your BejeweledByJoy Shopping Cart</h2> */}

          {loading ? (
            <div className="mt-6 flex justify-center items-center min-h-[120px]">
              <MoonLoader color="#7c3aed" size={48} />
            </div>
          ) : cart.length === 0 ? (
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-500 mb-4">Your cart is empty.</p>
              <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              {error && (
                <div
                  className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <li key={item.id} className="p-6 flex items-center">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        {item.image ? (
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No image</span>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex-1">
                        <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">Ksh{item.price.toFixed(2)}</p>
                      </div>

                      <div className="flex items-center">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-gray-500 focus:outline-none focus:text-gray-600"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                        <span className="mx-2 text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-gray-500 focus:outline-none focus:text-gray-600"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                      </div>

                      <div className="ml-6 text-base font-medium text-gray-900">
                        Ksh{(item.price * item.quantity).toFixed(2)}
                      </div>

                      <button onClick={() => removeFromCart(item.id)} className="ml-6 text-red-500 hover:text-red-700">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Subtotal</p>
                    <p>Ksh{getCartTotal().toFixed(2)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                </div>

                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <Link href="/" className="text-sm font-medium text-purple-600 hover:text-purple-500">
                    Continue Shopping
                  </Link>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {checkoutLoading ? "Processing..." : "Checkout"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
