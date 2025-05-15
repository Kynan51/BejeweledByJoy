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
import { fetchUserProfile } from "../lib/fetchers"

export default function Cart() {
  const { cart, loading, cartError, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState(null)
  const [spinnerTimeout, setSpinnerTimeout] = useState(false)
  const router = useRouter()

  // Prevent spinner from blocking UI forever (fallback after 20s)
  useEffect(() => {
    if (!loading && !checkoutLoading) {
      setSpinnerTimeout(false);
      return;
    }
    const timeout = setTimeout(() => setSpinnerTimeout(true), 20000)
    return () => clearTimeout(timeout)
  }, [loading, checkoutLoading])

  // Fallback: If not loading, not checking out, and cart is empty, show empty cart UI (prevents infinite spinner)
  if (!loading && !checkoutLoading && cart.length === 0 && !error && !cartError) {
    return (
      <Layout>
        <Head>
          <title>Shopping Cart - BejeweledByJoy</title>
        </Head>
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            Continue Shopping
          </Link>
        </div>
      </Layout>
    )
  }

  // If loading or spinnerTimeout, show spinner unless there is a real error
  if ((loading || spinnerTimeout) && !error && !cartError) {
    return (
      <Layout>
        <Head>
          <title>Shopping Cart - BejeweledByJoy</title>
        </Head>
        <div className="mt-6 flex justify-center items-center min-h-[120px]">
          <MoonLoader color="#7c3aed" size={48} />
          {spinnerTimeout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
              <div className="bg-white p-6 rounded shadow text-red-600 text-center flex flex-col items-center">
                Something went wrong. Please try refreshing the page.
                <button
                  onClick={() => {
                    setError(null);
                    setSpinnerTimeout(false);
                    if (typeof window !== 'undefined') window.location.reload();
                  }}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded mx-auto"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    )
  }

  // If error, show error prompt
  if (error || cartError) {
    return (
      <Layout>
        <Head>
          <title>Shopping Cart - BejeweledByJoy</title>
        </Head>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="bg-white p-6 rounded shadow text-red-600 text-center flex flex-col items-center">
            {error || cartError || "Something went wrong. Please try refreshing the page."}
            <button
              onClick={() => {
                setError(null);
                setSpinnerTimeout(false);
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded mx-auto"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

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

      // Get user data using fetchUserProfile (REST)
      const userData = await fetchUserProfile(session.user.id)

      // Remove address/phone check: always proceed to order creation
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: session.user.id,
            total_amount: getCartTotal(),
            status: "pending",
            shipping_address: userData.address || "",
            phone: userData.phone || "",
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

  // WhatsApp checkout handler
  const handleWhatsAppCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=/cart");
        return;
      }
      setCheckoutLoading(true);
      setError(null);
      const userData = await fetchUserProfile(session.user.id);
      // Create WhatsApp order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: session.user.id,
            total_amount: getCartTotal(),
            status: "pending",
            shipping_address: userData.address || "",
            phone: userData.phone || "",
            type: "whatsapp",
          },
        ])
        .select("id")
        .single();
      if (orderError) throw orderError;
      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;
      // Build WhatsApp message
      let message = `Hello, I would like to order (Order ID: ${order.id.substring(0,8).toUpperCase()}):`;
      cart.forEach((item) => {
        message += `\n- ${item.name} (x${item.quantity})`;
      });
      message += `\nTotal: Ksh${getCartTotal().toFixed(2)}`;
      if (userData.full_name) message += `\nName: ${userData.full_name}`;
      if (userData.phone) message += `\nPhone: ${userData.phone}`;
      if (userData.address) message += `\nAddress: ${userData.address}`;
      const phoneNumber = "+254768856680";
      const encodedMessage = encodeURIComponent(message);
      // Clear cart
      await clearCart();
      // Open WhatsApp
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
      // Optionally redirect to order confirmation or show a message
      router.push(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("Error during WhatsApp checkout:", error);
      setError("An error occurred during WhatsApp checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Shopping Cart - BejeweledByJoy</title>
        <meta name="description" content="View your shopping cart and proceed to checkout." />
        <meta name="description" content="Discover handcrafted beaded jewelry by Joy. Unique, colorful, and made with love." />
        <meta name="keywords" content="handmade jewelry, beaded, custom jewelry, fashion accessories" />
        <meta name="author" content="Bejeweled By Joy" />
      </Head>

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

              {cartError && (
                <div
                  className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <span className="block sm:inline">{cartError}</span>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <ul className="divide-y divide-gray-200">
                    {cart.map((item, idx) => (
                      <li key={`${item.product_id || item.id || idx}-${idx}`} className="p-6 flex items-center">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          {item.image ? (
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              width={80}
                              height={80}
                              sizes="80px"
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
                            onClick={() => {
                              updateQuantity(item.id, item.quantity - 1);
                            }}
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
                            onClick={() => {
                              updateQuantity(item.id, item.quantity + 1);
                            }}
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

                        <button onClick={() => {
                          removeFromCart(item.id);
                        }} className="ml-6 text-red-500 hover:text-red-700">
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
                </div>

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
                  <div className="flex gap-2">
                    <button
                      onClick={handleWhatsAppCheckout}
                      disabled={checkoutLoading}
                      className="inline-flex items-center border border-transparent font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50
                        px-2 py-1 text-xs
                        sm:px-4 sm:py-2 sm:text-sm"
                    >
                      {checkoutLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          <span className="mr-2">Checkout</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 sm:w-6 sm:h-6 fill-current">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                          </svg>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="inline-flex items-center border border-transparent font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50
                        px-2 py-1 text-xs
                        sm:px-4 sm:py-2 sm:text-sm"
                    >
                      {checkoutLoading ? "Processing..." : "Checkout"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
