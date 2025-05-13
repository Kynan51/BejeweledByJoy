"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout"
import ProductCard from "../components/ProductCard"
import SearchAndFilter from "../components/SearchAndFilter"
import ActiveFilters from "../components/ActiveFilters"
import useSWR from "swr"
import { fetchProductsSWR } from "../lib/fetchers"
import { MoonLoader } from "react-spinners"
import type { Product } from "../supabase/types"

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
    // console.log('[Home useEffect] isLoading:', isLoading, 'products:', products, 'error:', error)
    if (isLoading) {
      const timeout = setTimeout(() => setLoadingTimeout(true), 10000) // 10s max loading
      return () => clearTimeout(timeout)
    } else {
      setLoadingTimeout(false)
    }
  }, [isLoading, products, error])

  useEffect(() => {
    // console.log('[Home] filters changed:', filters)
  }, [filters])

  function handleSearch(newFilters: Filters) {
    // console.log('[Home] handleSearch called with:', newFilters)
    setFilters(newFilters)
    // No need to call mutate with a key; SWR will refetch automatically
  }

  // console.log('[Home render] isLoading:', isLoading, 'products:', products, 'error:', error, 'filters:', filters)

  return (
    <Layout>
      <Suspense fallback={<div>Loading search...</div>}>
        <SearchAndFilter onSearch={handleSearch} initialFilters={filters} />
      </Suspense>
      <ActiveFilters filters={filters} />
      <div className="grid grid-cols-1 min-[250px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 min-h-[200px]">
        {isLoading && !loadingTimeout ? (
          <div className="col-span-full flex justify-center items-center min-h-[200px]">
            <MoonLoader color="#a855f7" size={48} />
          </div>
        ) : error ? (
          <div className="col-span-full text-red-500">{(error as Error).message}</div>
        ) : (products && products.length === 0) ? (
          <div className="col-span-full text-gray-500 text-center">No products found.</div>
        ) : (
          (products || []).map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
      {loadingTimeout && isLoading && (
        <div className="flex flex-col items-center justify-center mt-8">
          <p className="text-red-500 mb-4">Loading is taking longer than expected. Please check your connection or try refreshing.</p>
          <button onClick={() => { window.location.href = window.location.href; }} className="px-4 py-2 bg-purple-600 text-white rounded mx-auto mt-2">
            Retry
          </button>
        </div>
      )}
    </Layout>
  )
}