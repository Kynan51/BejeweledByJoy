"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout"
import ProductCard from "../components/ProductCard"
import SearchAndFilter from "../components/SearchAndFilter"
import supabase from "../utils/supabaseClient"
import ActiveFilters from "../components/ActiveFilters"

interface Filters {
  search?: string
  minPrice?: string
  maxPrice?: string
  hasDiscount?: string
  sortBy?: string
}

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({})

  useEffect(() => {
    // Extract filters from URL search params (app router)
    // You may need to use useSearchParams from next/navigation for query params
    // For now, fallback to empty filters
    fetchProducts({})
  }, [])

  async function fetchProducts({ search, minPrice, maxPrice, hasDiscount, sortBy }: Filters) {
    setLoading(true)
    setError(null)
    let query = supabase.from("products").select("*")
    if (search) query = query.ilike("name", `%${search}%`)
    if (minPrice) query = query.gte("price", minPrice)
    if (maxPrice) query = query.lte("price", maxPrice)
    if (hasDiscount === "true") query = query.gt("discount", 0)
    if (sortBy === "price-asc") query = query.order("price", { ascending: true })
    else if (sortBy === "price-desc") query = query.order("price", { ascending: false })
    else query = query.order("created_at", { ascending: false })
    // @ts-ignore
    const { data, error } = await query
    if (error) setError(error.message)
    else setProducts(data)
    setLoading(false)
  }

  return (
    <Layout>
      <SearchAndFilter onSearch={fetchProducts} initialFilters={filters} />
      <ActiveFilters filters={filters} />
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Layout>
  )
}