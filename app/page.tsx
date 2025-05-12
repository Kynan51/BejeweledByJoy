"use client"

import { useState } from "react"
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

  const { data: products, error, isLoading, mutate } = useSWR([
    "products",
    filters,
  ], fetchProductsSWR)

  function handleSearch(newFilters: Filters) {
    setFilters(newFilters)
    // No need to call mutate with a key; SWR will refetch automatically
  }

  return (
    <Layout>
      <SearchAndFilter onSearch={handleSearch} initialFilters={filters} />
      <ActiveFilters filters={filters} />
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <MoonLoader color="#a855f7" size={48} />
        </div>
      ) : error ? (
        <div className="text-red-500">{error.message}</div>
      ) : (
        <div className="grid grid-cols-1 min-[250px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Layout>
  )
}