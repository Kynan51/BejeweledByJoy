"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import Layout from "../components/Layout"
import supabase from "../utils/supabaseClient"
import Image from "next/image"

export default function Profile() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Kenya",
    is_default: false,
  })

  const router = useRouter()
  const { checkout } = router.query

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[DEBUG] Session fetched:", session)
      setSession(session)

      if (!session) {
        router.push("/login?redirect=/profile")
        return
      }

      // Fetch user data
      fetchUserData(session.user.id)
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[DEBUG] Auth state changed:", event, session)
      setSession(session)
      if (!session) {
        router.push("/login?redirect=/profile")
      }
    })

    // Set active tab based on query param
    if (checkout) {
      setActiveTab("addresses")
    }

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router, checkout])

  useEffect(() => {
    if (session?.user && activeTab === "orders") {
      fetchOrders()
    }
  }, [session, activeTab])

  useEffect(() => {
    if (session?.user && activeTab === "addresses") {
      fetchAddresses()
    }
  }, [session, activeTab])

  useEffect(() => {
    if (session?.user && activeTab === "wishlist") {
      fetchWishlist()
    }
  }, [session, activeTab])

  async function fetchUserData(userId) {
    try {
      setLoading(true)
      console.log("[DEBUG] Fetching user data for userId:", userId)

      // Get user data from our users table
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
      console.log("[DEBUG] Supabase user data fetch result:", { data, error })

      if (error) {
        throw error
      }

      if (data) {
        // If data is an array (from Supabase), use the first element
        const userData = Array.isArray(data) ? data[0] : data;
        setUser(userData)
        setFormData({
          full_name: userData.full_name ?? "",
          phone: userData.phone ?? "",
          address: userData.address ?? "",
        })
        console.log("[DEBUG] Setting formData:", {
          full_name: userData.full_name ?? "",
          phone: userData.phone ?? "",
          address: userData.address ?? "",
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to load user data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrders() {
    try {
      setOrdersLoading(true)

      // Get user's orders
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setOrdersLoading(false)
    }
  }

  async function fetchAddresses() {
    try {
      setAddressesLoading(true)

      // Get user's saved addresses
      const { data, error } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("is_default", { ascending: false })

      if (error) {
        throw error
      }

      setAddresses(data || [])
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setAddressesLoading(false)
    }
  }

  async function fetchWishlist() {
    try {
      setWishlistLoading(true)

      // Get user's wishlist items with product details
      const { data, error } = await supabase
        .from("wishlists")
        .select(
          `
          id,
          created_at,
          products (
            id,
            name,
            price,
            discount,
            image_urls
          )
        `,
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setWishlist(data || [])
    } catch (error) {
      console.error("Error fetching wishlist:", error)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setAddressFormData({
      ...addressFormData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setFormLoading(true)
      setError(null)
      setMessage(null)
      console.log('[DEBUG] Submitting profile update:', {
        p_id: session.user.id,
        p_email: user?.email || "",
        p_full_name: formData.full_name,
        p_address: formData.address,
        p_phone: formData.phone || null
      })
      // Directly update the user profile in the users table
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          address: formData.address,
          phone: formData.phone,
          email: user?.email || ""
        })
        .eq("id", session.user.id);
      console.log('[DEBUG] Supabase direct update response:', { error });
      if (error) {
        throw error;
      }
      setMessage("Profile updated successfully!");
      if (checkout) {
        router.push("/cart");
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again. " )
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()

    try {
      setFormLoading(true)
      setError(null)
      setMessage(null)

      // If setting as default, update all other addresses to not be default
      if (addressFormData.is_default) {
        await supabase.from("saved_addresses").update({ is_default: false }).eq("user_id", session.user.id)
      }

      // Add new address
      const { error } = await supabase.from("saved_addresses").insert([
        {
          user_id: session.user.id,
          name: addressFormData.name,
          address: addressFormData.address,
          city: addressFormData.city,
          state: addressFormData.state,
          postal_code: addressFormData.postal_code,
          country: addressFormData.country,
          is_default: addressFormData.is_default,
        },
      ])

      if (error) {
        throw error
      }

      setMessage("Address added successfully!")
      setShowAddressForm(false)
      setAddressFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Kenya",
        is_default: false,
      })

      // Refresh addresses
      fetchAddresses()
    } catch (error) {
      console.error("Error adding address:", error)
      setError("Failed to add address. Please try again.")
    } finally {
      setFormLoading(false)
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      // Update all addresses to not be default
      await supabase.from("saved_addresses").update({ is_default: false }).eq("user_id", session.user.id)

      // Set selected address as default
      await supabase.from("saved_addresses").update({ is_default: true }).eq("id", addressId)

      // Refresh addresses
      fetchAddresses()
    } catch (error) {
      console.error("Error setting default address:", error)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    try {
      // Delete address
      await supabase.from("saved_addresses").delete().eq("id", addressId)

      // Refresh addresses
      fetchAddresses()
    } catch (error) {
      console.error("Error deleting address:", error)
    }
  }

  const handleRemoveFromWishlist = async (wishlistId) => {
    try {
      // Delete wishlist item
      await supabase.from("wishlists").delete().eq("id", wishlistId)

      // Refresh wishlist
      fetchWishlist()
    } catch (error) {
      console.error("Error removing from wishlist:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>My Profile - BejeweledByJoy</title>
        <meta name="description" content="Manage your BejeweledByJoy account." />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">My Account</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="md:w-64 md:mr-8 mb-6 md:mb-0">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "profile"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "orders"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Orders
                </button>

                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "addresses"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Addresses
                </button>

                <button
                  onClick={() => setActiveTab("wishlist")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "wishlist"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Wishlist
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <svg
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </nav>
            </div>

            {/* Main content */}
            <div className="flex-1">
              {error && (
                <div
                  className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {message && (
                <div
                  className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <span className="block sm:inline">{message}</span>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>

                    <form onSubmit={handleSubmit}>
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                          </label>
                          <div className="mt-1">
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={user?.email || ""}
                              disabled
                              className="bg-gray-50 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                        </div>

                        <div>
                          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                            Full Name
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="full_name"
                              id="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          <div className="mt-1">
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="address"
                              name="address"
                              rows={3}
                              value={formData.address}
                              onChange={handleInputChange}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={formLoading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                          >
                            {formLoading ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Order History</h2>

                    {ordersLoading ? (
                      <div className="animate-pulse">
                        <div className="space-y-4">
                          {[...Array(3)].map((_, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                        <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                          Start Shopping
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                              <div>
                                <span className="text-xs text-gray-500">Order ID:</span>
                                <span className="ml-2 text-sm font-medium">
                                  {order.id.substring(0, 8).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Date:</span>
                                <span className="ml-2 text-sm font-medium">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "shipped"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="px-4 py-3 flex justify-between items-center">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Total: ${order.total_amount.toFixed(2)}
                                </span>
                              </div>
                              <Link href={`/order-confirmation/${order.id}`} className="text-sm font-medium text-purple-600 hover:text-purple-500">
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Saved Addresses</h2>
                      <button
                        onClick={() => setShowAddressForm(!showAddressForm)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        {showAddressForm ? "Cancel" : "Add Address"}
                      </button>
                    </div>

                    {showAddressForm && (
                      <div className="mb-6 border rounded-lg p-4">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Add New Address</h3>
                        <form onSubmit={handleAddressSubmit}>
                          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Address Name
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="name"
                                  id="name"
                                  placeholder="Home, Work, etc."
                                  value={addressFormData.name}
                                  onChange={handleAddressInputChange}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Street Address
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="address"
                                  id="address"
                                  value={addressFormData.address}
                                  onChange={handleAddressInputChange}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="city"
                                  id="city"
                                  value={addressFormData.city}
                                  onChange={handleAddressInputChange}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                State / Province
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="state"
                                  id="state"
                                  value={addressFormData.state}
                                  onChange={handleAddressInputChange}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                                Postal Code
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="postal_code"
                                  id="postal_code"
                                  value={addressFormData.postal_code}
                                  onChange={handleAddressInputChange}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                Country
                              </label>
                              <div className="mt-1">
                                <select
                                  id="country"
                                  name="country"
                                  value={addressFormData.country}
                                  onChange={handleAddressInputChange}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  required
                                >
                                  <option value="Kenya">Kenya</option>
                                  <option value="Uganda">Uganda</option>
                                  <option value="Tanzania">Tanzania</option>
                                </select>
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <div className="flex items-center">
                                <input
                                  id="is_default"
                                  name="is_default"
                                  type="checkbox"
                                  checked={addressFormData.is_default}
                                  onChange={handleAddressInputChange}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                                  Set as default address
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <button
                              type="submit"
                              disabled={formLoading}
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                            >
                              {formLoading ? "Saving..." : "Save Address"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {addressesLoading ? (
                      <div className="animate-pulse">
                        <div className="space-y-4">
                          {[...Array(2)].map((_, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">You don't have any saved addresses yet.</p>
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {addresses.map((address) => (
                          <div key={address.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">{address.name}</span>
                                {address.is_default && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                {!address.is_default && (
                                  <button
                                    onClick={() => handleSetDefaultAddress(address.id)}
                                    className="text-sm text-purple-600 hover:text-purple-500"
                                  >
                                    Set as Default
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="text-sm text-red-600 hover:text-red-500"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm text-gray-600">{address.address}</p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.postal_code}
                              </p>
                              <p className="text-sm text-gray-600">{address.country}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === "wishlist" && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">My Wishlist</h2>

                    {wishlistLoading ? (
                      <div className="animate-pulse">
                        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                          {[...Array(3)].map((_, index) => (
                            <div key={index}>
                              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200"></div>
                              <div className="mt-4 h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : wishlist.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
                        <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                          Explore Products
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                        {wishlist.map((item) => (
                          <div key={item.id} className="group relative">
                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 group-hover:opacity-75">
                              {item.products.image_urls && item.products.image_urls.length > 0 ? (
                                <Image
                                  src={item.products.image_urls[0] || "/placeholder.svg"}
                                  alt={item.products.name}
                                  layout="fill"
                                  objectFit="cover"
                                  className="h-full w-full object-cover object-center"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <span className="text-gray-500">No image</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex justify-between">
                              <div>
                                <h3 className="text-sm text-gray-700">
                                  <Link href={`/product/${item.products.id}`}>
                                    {item.products.name}
                                  </Link>
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  Added on {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">${item.products.price.toFixed(2)}</p>
                            </div>
                            <div className="mt-2 flex justify-between">
                              <button
                                onClick={() => handleRemoveFromWishlist(item.id)}
                                className="text-sm text-red-600 hover:text-red-500"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
