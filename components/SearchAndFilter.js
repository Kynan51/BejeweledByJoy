"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SearchAndFilter({ onSearch, initialFilters = {} }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "")
  const [priceRange, setPriceRange] = useState({
    min: initialFilters.minPrice || "",
    max: initialFilters.maxPrice || "",
  })
  const [hasDiscount, setHasDiscount] = useState(initialFilters.hasDiscount || false)
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || "newest")
  const [category, setCategory] = useState(initialFilters.category || "")
  const [isExpanded, setIsExpanded] = useState(false)

  // Update state when URL params change
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || "")
    setPriceRange({
      min: searchParams.get('minPrice') || "",
      max: searchParams.get('maxPrice') || "",
    })
    setHasDiscount(searchParams.get('hasDiscount') === "true")
    setSortBy(searchParams.get('sortBy') || "newest")
    setCategory(searchParams.get('category') || "")
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    setIsExpanded(false) // Collapse filters after search

    const filters = {
      search: searchTerm,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      hasDiscount,
      sortBy,
      category,
    }

    // Update URL with search params
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    if (hasDiscount) params.set('hasDiscount', 'true')
    if (sortBy !== "newest") params.set('sortBy', sortBy)
    if (category) params.set('category', category)

    router.push(`/?${params.toString()}`)

    if (onSearch) {
      onSearch(filters)
    }
  }

  // When filters are cleared, also collapse the filter panel
  const handleClearFilters = () => {
    setSearchTerm("")
    setPriceRange({ min: "", max: "" })
    setHasDiscount(false)
    setSortBy("newest")
    setCategory("")
    setIsExpanded(false)

    router.push("/")

    if (onSearch) {
      onSearch({})
    }
  }

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <form onSubmit={handleSearch}>
          {/* Mobile: Search field on top, full width */}
          <div className="block md:hidden mb-3">
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-purple-500 focus:border-purple-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* Mobile: Category, Filter, Search button in a row below */}
          <div className="block md:hidden w-full mb-3">
            <div className="flex flex-row gap-2 w-full">
              <select
                className="border rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500 flex-1 min-w-0"
                value={category}
                onChange={e => setCategory(e.target.value)}
                name="category"
              >
                <option value="">All Categories</option>
                <option value="Rings">Rings</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Chains">Chains</option>
                <option value="Lockets">Lockets</option>
                <option value="Pendants">Pendants</option>
                <option value="Earrings">Earrings</option>
                <option value="Bracelets">Bracelets</option>
                <option value="Bangles">Bangles</option>
                <option value="Charm Bracelets">Charm Bracelets</option>
                <option value="Anklets">Anklets</option>
                <option value="Belly Rings">Belly Rings</option>
                <option value="Brooches & Pins">Brooches & Pins</option>
                <option value="Nose Rings">Nose Rings</option>
                <option value="Others">Others</option>
              </select>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex-shrink-0"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-expanded={isExpanded}
                aria-controls="filter-panel"
              >
                <svg
                  className="-ml-0.5 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
                Filters
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex-shrink-0"
              >
                Search
              </button>
            </div>
          </div>
          {/* Desktop: original layout */}
          <div className="hidden md:flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search-desktop"
                  className="focus:ring-purple-500 focus:border-purple-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-3 md:mt-0">
              <select
                className="border rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                value={category}
                onChange={e => setCategory(e.target.value)}
                name="category"
              >
                <option value="">All Categories</option>
                <option value="Rings">Rings</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Chains">Chains</option>
                <option value="Lockets">Lockets</option>
                <option value="Pendants">Pendants</option>
                <option value="Earrings">Earrings</option>
                <option value="Bracelets">Bracelets</option>
                <option value="Bangles">Bangles</option>
                <option value="Charm Bracelets">Charm Bracelets</option>
                <option value="Anklets">Anklets</option>
                <option value="Belly Rings">Belly Rings</option>
                <option value="Brooches & Pins">Brooches & Pins</option>
                <option value="Nose Rings">Nose Rings</option>
                <option value="Others">Others</option>
              </select>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 w-40% md:w-auto"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-expanded={isExpanded}
                aria-controls="filter-panel"
              >
                <svg
                  className="-ml-0.5 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
                Filters
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 w-40% md:w-auto"
              >
                Search
              </button>
            </div>
          </div>

          {isExpanded && (
            <div id="filter-panel" className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">
              <div>
                <label htmlFor="min-price" className="block text-sm font-medium text-gray-700">
                  Min Price
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="min-price"
                    id="min-price"
                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="0"
                    min="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="max-price" className="block text-sm font-medium text-gray-700">
                  Max Price
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="max-price"
                    id="max-price"
                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="1000"
                    min="0"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <select
                  id="sort-by"
                  name="sort-by"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>

              <div className="flex items-center h-full pt-6">
                <div className="flex items-center">
                  <input
                    id="has-discount"
                    name="has-discount"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    checked={hasDiscount}
                    onChange={(e) => setHasDiscount(e.target.checked)}
                  />
                  <label htmlFor="has-discount" className="ml-2 block text-sm text-gray-700">
                    On Sale
                  </label>
                </div>
                <button
                  type="button"
                  className="ml-6 text-sm text-purple-600 hover:text-purple-500"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
