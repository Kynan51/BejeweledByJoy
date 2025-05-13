"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminNav from "../../components/AdminNav"
import supabase from "../../utils/supabaseClient"
import { useAuth } from "../../contexts/AuthContext"
import { getUserRole, isAdminRole, isOwnerRole } from "../../utils/role"
import { MoonLoader } from "react-spinners"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminAnalytics() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    viewsByDay: [],
    topProducts: [],
    viewsByDevice: [],
    topSalesProducts: [],
  })
  const [timeRange, setTimeRange] = useState("week")
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [spinnerTimeout, setSpinnerTimeout] = useState(false)

  // Prevent spinner from blocking UI forever (fallback after 10s)
  useEffect(() => {
    if (!loading && !loadingAnalytics) return
    const timeout = setTimeout(() => setSpinnerTimeout(true), 10000)
    return () => clearTimeout(timeout)
  }, [loading, loadingAnalytics])

  // Client-side role check
  const userEmail = session?.user?.email || null
  const role = userEmail ? getUserRole(userEmail) : null
  const isAdmin = userEmail ? isAdminRole(userEmail) : false
  const isOwner = userEmail ? isOwnerRole(userEmail) : false

  // Redirect unauthorized users
  useEffect(() => {
    if (!loading && !isAdmin && !isOwner) {
      router.replace("/")
    }
  }, [loading, isAdmin, isOwner])

  useEffect(() => {
    if (isAdmin || isOwner) {
      fetchAnalytics()
    }
  }, [isAdmin, isOwner, timeRange])

  async function fetchAnalytics() {
    try {
      setLoadingAnalytics(true)

      // Calculate date range
      const now = new Date()
      let startDate, endDate

      if (timeRange === "week") {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay()) // Sunday of this week
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6) // Saturday of this week
      } else if (timeRange === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1) // 1st of current month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // last day of current month
      } else if (timeRange === "year") {
        startDate = new Date(now.getFullYear(), 0, 1) // Jan 1st
        endDate = new Date(now.getFullYear(), 11, 31) // Dec 31st
      }

      const startDateStr = startDate.toISOString()
      // Add 1 day to endDate to make .lt() exclusive
      const endDateStr = new Date(endDate.getTime() + 24*60*60*1000).toISOString()

      // Get total views in time range
      const { data: viewsData, error: viewsError } = await supabase
        .from("views")
        .select("id", { count: "exact" })
        .gte("viewed_at", startDateStr)
        .lt("viewed_at", endDateStr)

      if (viewsError) throw viewsError

      // Get views by day
      const { data: viewsByDayData, error: viewsByDayError } = await supabase
        .from("views")
        .select("viewed_at")
        .gte("viewed_at", startDateStr)
        .lt("viewed_at", endDateStr)
        .order("viewed_at", { ascending: true })

      if (viewsByDayError) throw viewsByDayError

      // Process views by day
      const viewsByDay = processViewsByDay(viewsByDayData, timeRange)

      // Get top products (from view for performance)
      const { data: topProductsData, error: topProductsError } = await supabase
        .from("top_viewed_products")
        .select("product_id, view_count")
        .order("view_count", { ascending: false })
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
              view_count: viewData ? viewData.view_count : 0,
            }
          })
          .sort((a, b) => b.view_count - a.view_count)
      }

      // Get views by device type (simplified)
      const { data: viewsByDeviceData, error: viewsByDeviceError } = await supabase
        .from("views")
        .select("user_agent")
        .gte("viewed_at", startDateStr)
        .lt("viewed_at", endDateStr)

      if (viewsByDeviceError) throw viewsByDeviceError

      // Process views by device
      const viewsByDevice = processViewsByDevice(viewsByDeviceData)

      // Get top products by sales
      const { data: topSalesData, error: topSalesError } = await supabase
        .from("order_items")
        .select("product_id, sum:quantity")
        .gte("created_at", startDateStr)
        .lt("created_at", endDateStr)
        .order("sum", { ascending: false })
        .limit(5)

      if (topSalesError) throw topSalesError

      // Get product details for top sales
      let topSalesProducts = []
      if (topSalesData.length > 0) {
        const productIds = topSalesData.map((item) => item.product_id)
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, price, discount, image_urls")
          .in("id", productIds)
        if (productsError) throw productsError
        topSalesProducts = productsData
          .map((product) => {
            const salesData = topSalesData.find((item) => item.product_id === product.id)
            return {
              ...product,
              sales_count: salesData ? salesData.sum : 0,
            }
          })
          .sort((a, b) => b.sales_count - a.sales_count)
      }

      setAnalytics({
        totalViews: viewsData.length,
        viewsByDay,
        topProducts,
        viewsByDevice,
        topSalesProducts,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  function processViewsByDay(viewsData, timeRange) {
    if (!viewsData || viewsData.length === 0) return [];
    const now = new Date();
    if (timeRange === "week") {
      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      // Find last Sunday
      const lastSunday = new Date(now);
      lastSunday.setDate(now.getDate() - now.getDay());
      // Build a map for this week
      const dayMap = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(lastSunday);
        d.setDate(lastSunday.getDate() + i);
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        dayMap[key] = 0;
      }
      viewsData.forEach((view) => {
        const d = new Date(view.viewed_at);
        const key = d.toISOString().slice(0, 10);
        if (dayMap[key] !== undefined) dayMap[key]++;
      });
      return weekDays.map((day, i) => {
        const d = new Date(lastSunday);
        d.setDate(lastSunday.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        return {
          date: key,
          label: day, // Short label for mobile
          count: dayMap[key],
          fullDate: d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        };
      });
    } else if (timeRange === "month") {
      // Return an array for each day of the current month
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dayMap = {};
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = 0;
      }
      viewsData.forEach((view) => {
        const d = new Date(view.viewed_at);
        const key = d.toISOString().slice(0, 10);
        if (dayMap[key] !== undefined) dayMap[key]++;
      });
      return Object.keys(dayMap).map((key) => ({
        date: key,
        count: dayMap[key],
        label: new Date(key).getDate().toString(),
        fullDate: new Date(key).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      }));
    } else if (timeRange === "year") {
      // Return an array for each month of the current year
      const year = now.getFullYear();
      const monthMap = Array(12).fill(0);
      viewsData.forEach((view) => {
        const d = new Date(view.viewed_at);
        if (d.getFullYear() === year) {
          monthMap[d.getMonth()]++;
        }
      });
      return monthMap.map((count, i) => ({
        date: new Date(year, i, 1).toISOString().slice(0, 10),
        count,
        label: new Date(year, i, 1).toLocaleString("en-US", { month: "short" }),
        month: new Date(year, i, 1).toLocaleString("en-US", { month: "long" })
      }));
    }
    return [];
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

  function getChartData(viewsByDay, timeRange) {
    if (!Array.isArray(viewsByDay)) return [];
    return viewsByDay.filter(d => d && typeof d === 'object' && d.label !== undefined).map((d) => {
      if (timeRange === "year") {
        return { label: d.label, count: d.count, month: d.month };
      } else if (timeRange === "month") {
        return { label: d.label, count: d.count, fullDate: d.fullDate };
      } else {
        return { label: d.label, count: d.count, fullDate: d.fullDate };
      }
    });
  }

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    if (data.range) {
      // Month view
      return (
        <div className="bg-white p-2 rounded shadow text-xs">
          <div><b>{data.label}</b> ({data.range})</div>
          <div>Views: {data.count}</div>
        </div>
      );
    } else if (data.month) {
      // Year view
      return (
        <div className="bg-white p-2 rounded shadow text-xs">
          <div><b>{data.month}</b></div>
          <div>Views: {data.count}</div>
        </div>
      );
    } else {
      // Week view
      return (
        <div className="bg-white p-2 rounded shadow text-xs">
          <div><b>{data.label}</b> ({data.fullDate})</div>
          <div>Views: {data.count}</div>
        </div>
      );
    }
  }

  if (!(isAdmin || isOwner)) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">You are not authorized to view this page.</p>
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
      {/* Non-blocking spinner overlay during loading, with fallback */}
      {(loading || loadingAnalytics) && !spinnerTimeout && (
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
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 md:mr-8">
                <AdminNav isAdmin={isAdmin} />
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

                {loadingAnalytics ? (
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
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getChartData(analytics.viewsByDay, timeRange)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
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
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Products by Sales</h3>
                        {analytics.topSalesProducts && analytics.topSalesProducts.length > 0 ? (
                          <ul className="divide-y divide-gray-200">
                            {analytics.topSalesProducts.map((product) => (
                              <li key={product.id} className="py-4">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                    <p className="text-sm text-gray-500 truncate">
                                      Ksh{product.price.toFixed(2)}
                                      {product.discount > 0 && (
                                        <span className="ml-2 text-xs text-red-500">{product.discount}% OFF</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="inline-flex items-center text-sm font-semibold text-green-600">
                                    {product.sales_count} sold
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No sales data available for this time period.
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
