"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout"
import ProductCard from "../components/ProductCard"
import SearchAndFilter from "../components/SearchAndFilter"
import ActiveFilters from "../components/ActiveFilters"
import useSWR from "swr"
import { fetchProductsSWR } from "../lib/fetchers"
import { MoonLoader } from "react-spinners"

interface Filters {
  search?: string
  minPrice?: string
  maxPrice?: string
  hasDiscount?: string
  sortBy?: string
}

export default function Home() {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>({})
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Defensive: always provide a stable SWR key
  const swrKey = ["products", filters]
  const { data: products, error, isLoading, mutate } = useSWR(swrKey, fetchProductsSWR)

  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => setLoadingTimeout(true), 10000) // 10s max loading
      return () => clearTimeout(timeout)
    } else {
      setLoadingTimeout(false)
    }
  }, [isLoading])

  function handleSearch(newFilters: Filters) {
    setFilters(newFilters)
    // No need to call mutate with a key; SWR will refetch automatically
  }

  return (
    <Layout>
      <SearchAndFilter onSearch={handleSearch} initialFilters={filters} />
      <ActiveFilters filters={filters} />
      <div className="grid grid-cols-1 min-[250px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 min-h-[200px]">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center min-h-[200px]">
            <MoonLoader color="#a855f7" size={48} />
          </div>
        ) : error ? (
          <div className="col-span-full text-red-500">{error.message}</div>
        ) : (products && products.length === 0) ? (
          <div className="col-span-full text-gray-500 text-center">No products found.</div>
        ) : (
          (products || []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
      {loadingTimeout && isLoading && (
        <div className="flex flex-col items-center justify-center mt-8">
          <p className="text-red-500 mb-4">Loading is taking longer than expected. Please check your connection or try refreshing.</p>
          <button onClick={() => { setLoadingTimeout(false); mutate(); }} className="px-4 py-2 bg-purple-600 text-white rounded">Retry</button>
        </div>
      )}
    </Layout>
  )
}