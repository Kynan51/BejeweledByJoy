"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminNav from "../../components/AdminNav"
import supabase from "../../utils/supabaseClient"

export default function AdminAnalytics() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    viewsByDay: [],
    topProducts: [],
    viewsByDevice: [],
  })
  const [timeRange, setTimeRange] = useState("week") // 'week', 'month', 'year'

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)

      // Check if user is admin
      if (session?.user) {
        checkIfAdmin(session.user.email)
      } else {
        router.push("/auth")
      }
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session?.user) {
        checkIfAdmin(session.user.email)
      } else {
        router.push("/auth")
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics()
    }
  }, [isAdmin, timeRange])

  async function checkIfAdmin(email) {
    if (!email) return

    try {
      const { data, error } = await supabase.from("admins").select("*").eq("email", email).single()

      if (data && !error) {
        setIsAdmin(true)
      } else {
        router.push("/auth")
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/auth")
    }
  }

  async function fetchAnalytics() {
    try {
      setLoading(true)

      // Calculate date range
      const now = new Date()
      let startDate

      if (timeRange === "week") {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
      } else if (timeRange === "month") {
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
      } else if (timeRange === "year") {
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
      }

      const startDateStr = startDate.toISOString()

      // Get total views in time range
      const { data: viewsData, error: viewsError } = await supabase
        .from("views")
        .select("id", { count: "exact" })
        .gte("viewed_at", startDateStr)

      if (viewsError) throw viewsError

      // Get views by day
      const { data: viewsByDayData, error: viewsByDayError } = await supabase
        .from("views")
        .select("viewed_at")
        .gte("viewed_at", startDateStr)
        .order("viewed_at", { ascending: true })

      if (viewsByDayError) throw viewsByDayError

      // Process views by day
      const viewsByDay = processViewsByDay(viewsByDayData, timeRange)

      // Get top products
      const { data: topProductsData, error: topProductsError } = await supabase
        .from("views")
        .select("product_id, count(*)")
        .gte("viewed_at", startDateStr)
        .group("product_id")
        .order("count", { ascending: false })
        .limit(5)

      if (topProductsError) throw topProductsError

      // Get product details for top products
      let topProducts = []

      if (topProductsData.length > 0) {
        const productIds = topProductsData.map((item) => item.product_id)

        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, price, discount, image_urls")
          .in("id", productIds)

        if (productsError) throw productsError

        // Combine view counts with product details
        topProducts = productsData
          .map((product) => {
            const viewData = topProductsData.find((item) => item.product_id === product.id)
            return {
              ...product,
              view_count: viewData ? viewData.count : 0,
            }
          })
          .sort((a, b) => b.view_count - a.view_count)
      }

      // Get views by device type (simplified)
      const { data: viewsByDeviceData, error: viewsByDeviceError } = await supabase
        .from("views")
        .select("user_agent")
        .gte("viewed_at", startDateStr)

      if (viewsByDeviceError) throw viewsByDeviceError

      // Process views by device
      const viewsByDevice = processViewsByDevice(viewsByDeviceData)

      setAnalytics({
        totalViews: viewsData.length,
        viewsByDay,
        topProducts,
        viewsByDevice,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  function processViewsByDay(viewsData, timeRange) {
    if (!viewsData || viewsData.length === 0) return []

    const viewsByDay = {}
    const dateFormat = { weekday: "short", month: "short", day: "numeric" }

    // Initialize all days in the range
    const now = new Date()
    let days = 7

    if (timeRange === "month") {
      days = 30
    } else if (timeRange === "year") {
      days = 365
    }

    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateStr = date.toLocaleDateString("en-US", dateFormat)
      viewsByDay[dateStr] = 0
    }

    // Count views for each day
    viewsData.forEach((view) => {
      const viewDate = new Date(view.viewed_at)
      const dateStr = viewDate.toLocaleDateString("en-US", dateFormat)

      if (viewsByDay[dateStr] !== undefined) {
        viewsByDay[dateStr]++
      }
    })

    // Convert to array for chart
    return Object.entries(viewsByDay)
      .map(([date, count]) => ({ date, count }))
      .reverse()
  }

  function processViewsByDevice(viewsData) {
    if (!viewsData || viewsData.length === 0) return []

    const deviceCounts = {
      Mobile: 0,
      Desktop: 0,
      Tablet: 0,
      Other: 0,
    }

    viewsData.forEach((view) => {
      const userAgent = view.user_agent || ""

      if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        deviceCounts.Mobile++
      } else if (/iPad|tablet/i.test(userAgent)) {
        deviceCounts.Tablet++
      } else if (/Windows|Macintosh|Linux/i.test(userAgent)) {
        deviceCounts.Desktop++
      } else {
        deviceCounts.Other++
      }
    })

    return Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Checking authentication...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Analytics - BejeweledByJoy</title>
        <meta name="description" content="Admin analytics for BejeweledByJoy." />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 md:mr-8">
                <AdminNav />
              </div>

              <div className="flex-1">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Product Analytics</h2>

                  <div className="inline-flex shadow-sm rounded-md">
                    <button
                      type="button"
                      onClick={() => setTimeRange("week")}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                        timeRange === "week" ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      } border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    >
                      Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange("month")}
                      className={`px-4 py-2 text-sm font-medium ${
                        timeRange === "month" ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      } border-t border-b border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    >
                      Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange("year")}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                        timeRange === "year" ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      } border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    >
                      Year
                    </button>
                  </div>
                </div>

                {loading ? (
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
                        <div className="h-64 bg-gray-200 rounded w-full"></div>
                      </div>
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
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Views (
                            {timeRange === "week"
                              ? "Last 7 days"
                              : timeRange === "month"
                                ? "Last 30 days"
                                : "Last year"}
                            )
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900">{analytics.totalViews}</dd>
                        </div>
                      </div>

                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <dt className="text-sm font-medium text-gray-500 truncate">Most Viewed Product</dt>
                          <dd className="mt-1 text-xl font-semibold text-gray-900 truncate">
                            {analytics.topProducts.length > 0 ? analytics.topProducts[0].name : "No data available"}
                          </dd>
                          {analytics.topProducts.length > 0 && (
                            <p className="mt-1 text-sm text-gray-500">{analytics.topProducts[0].view_count} views</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <dt className="text-sm font-medium text-gray-500 truncate">Most Common Device</dt>
                          <dd className="mt-1 text-xl font-semibold text-gray-900">
                            {analytics.viewsByDevice.length > 0
                              ? analytics.viewsByDevice[0].device
                              : "No data available"}
                          </dd>
                          {analytics.viewsByDevice.length > 0 && (
                            <p className="mt-1 text-sm text-gray-500">
                              {analytics.viewsByDevice[0].count} views (
                              {Math.round((analytics.viewsByDevice[0].count / analytics.totalViews) * 100)}%)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Views Over Time</h3>

                        {analytics.viewsByDay.length > 0 ? (
                          <div className="h-64">
                            <div className="h-full flex items-end">
                              {analytics.viewsByDay.map((day, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                  <div
                                    className="w-full bg-purple-200 rounded-t"
                                    style={{
                                      height: `${Math.max(4, (day.count / Math.max(...analytics.viewsByDay.map((d) => d.count))) * 100)}%`,
                                    }}
                                  >
                                    <div className="w-full h-full bg-purple-600 rounded-t hover:bg-purple-700 transition-colors duration-200"></div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                                    {day.date.split(",")[0]}
                                  </div>
                                  <div className="text-xs font-medium">{day.count}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No view data available for this time period.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Products by Views</h3>

                        {analytics.topProducts.length > 0 ? (
                          <ul className="divide-y divide-gray-200">
                            {analytics.topProducts.map((product) => (
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
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No product view data available for this time period.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Views by Device</h3>

                        {analytics.viewsByDevice.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-2">
                              {analytics.viewsByDevice.map((device, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="w-24 text-sm text-gray-600">{device.device}</div>
                                  <div className="flex-1 ml-2">
                                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-purple-600 rounded-full"
                                        style={{ width: `${(device.count / analytics.totalViews) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="ml-2 text-sm font-medium">
                                    {Math.round((device.count / analytics.totalViews) * 100)}%
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-center">
                              <div className="w-48 h-48 relative">
                                {/* Simple pie chart visualization */}
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                  {
                                    analytics.viewsByDevice.reduce(
                                      (acc, device, index) => {
                                        const percentage = (device.count / analytics.totalViews) * 100
                                        const previousPercentage = acc.previousPercentage

                                        // Calculate the SVG arc path
                                        const startAngle = (previousPercentage / 100) * 360
                                        const endAngle = ((previousPercentage + percentage) / 100) * 360

                                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180))
                                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180))
                                        const x2 = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180))
                                        const y2 = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180))

                                        const largeArcFlag = percentage > 50 ? 1 : 0

                                        // Generate a color based on index
                                        const colors = ["#9333ea", "#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff"]
                                        const color = colors[index % colors.length]

                                        acc.paths.push(
                                          <path
                                            key={index}
                                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                            fill={color}
                                          />,
                                        )

                                        acc.previousPercentage += percentage
                                        return acc
                                      },
                                      { paths: [], previousPercentage: 0 },
                                    ).paths
                                  }
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No device data available for this time period.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
