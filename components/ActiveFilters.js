"use client"

import { useRouter } from "next/navigation"

export default function ActiveFilters({ filters }) {
  const router = useRouter()

  // Check if there are any active filters
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== false,
  )

  if (!hasActiveFilters) {
    return null
  }

  const removeFilter = (key) => {
    const newQuery = { ...router.query }
    delete newQuery[key]

    router.push({
      pathname: router.pathname,
      query: newQuery,
    })
  }

  const clearAllFilters = () => {
    router.push(router.pathname)
  }

  return (
    <div className="bg-gray-100 rounded-lg p-3 mb-6">
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700">Active filters:</span>

        {filters.search && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Search: {filters.search}
            <button
              type="button"
              className="ml-1 inline-flex flex-shrink-0 h-4 w-4 rounded-full items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
              onClick={() => removeFilter("search")}
            >
              <span className="sr-only">Remove search filter</span>
              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        )}

        {filters.minPrice && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Min Price: ${filters.minPrice}
            <button
              type="button"
              className="ml-1 inline-flex flex-shrink-0 h-4 w-4 rounded-full items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
              onClick={() => removeFilter("minPrice")}
            >
              <span className="sr-only">Remove min price filter</span>
              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        )}

        {filters.maxPrice && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Max Price: ${filters.maxPrice}
            <button
              type="button"
              className="ml-1 inline-flex flex-shrink-0 h-4 w-4 rounded-full items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
              onClick={() => removeFilter("maxPrice")}
            >
              <span className="sr-only">Remove max price filter</span>
              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        )}

        {filters.hasDiscount && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            On Sale
            <button
              type="button"
              className="ml-1 inline-flex flex-shrink-0 h-4 w-4 rounded-full items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
              onClick={() => removeFilter("hasDiscount")}
            >
              <span className="sr-only">Remove discount filter</span>
              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        )}

        {filters.sortBy && filters.sortBy !== "newest" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Sort: {filters.sortBy.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            <button
              type="button"
              className="ml-1 inline-flex flex-shrink-0 h-4 w-4 rounded-full items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
              onClick={() => removeFilter("sortBy")}
            >
              <span className="sr-only">Remove sort filter</span>
              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        )}

        {filters.category && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Category: {filters.category}
            <button
              type="button"
              className="ml-1 inline-flex flex-shrink-0 h-4 w-4 rounded-full items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
              onClick={() => removeFilter("category")}
            >
              <span className="sr-only">Remove category filter</span>
              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        )}

        <button
          type="button"
          className="text-sm font-medium text-purple-600 hover:text-purple-500"
          onClick={clearAllFilters}
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}
