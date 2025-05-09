"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Layout from "../../components/Layout"
import ImageGallery from "../../components/ImageGallery"
import WishlistButton from "../../components/WishlistButton"
import { useCart } from "../../contexts/CartContext"
import supabase from "../../utils/supabaseClient"

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return

      try {
        setLoading(true)

        // Fetch product details
        const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Product not found")
        }

        // Debug: log image_urls
        console.log('Fetched product image_urls:', data.image_urls)
        setProduct(data)

        // Track product view for analytics
        await supabase.from("views").insert([
          {
            product_id: id,
            user_agent: navigator.userAgent,
            user_id: (await supabase.auth.getSession()).data.session?.user?.id || null,
          },
        ])
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value)
    setQuantity(value > 0 ? value : 1)
  }

  const handleAddToCart = () => {
    if (!product) return

    setIsAddingToCart(true)
    addToCart(product, quantity)

    // Show success animation
    setTimeout(() => {
      setIsAddingToCart(false)
    }, 1000)
  }

  // Calculate discounted price
  const discountedPrice =
    product?.discount > 0 ? product.price - product.price * (product.discount / 100) : product?.price

  return (
    <Layout>
      <Head>
        <title>{product ? `${product.name} - BejeweledByJoy` : "Product Details - BejeweledByJoy"}</title>
        <meta
          name="description"
          content={product ? `${product.description?.substring(0, 160)}` : "View our beautiful BejeweledByJoy piece details"}
        />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="animate-pulse">
              <div className="md:flex md:items-start">
                <div className="md:w-1/2">
                  <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 rounded-lg"></div>
                </div>
                <div className="mt-6 md:mt-0 md:ml-10 md:w-1/2">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="h-24 bg-gray-200 rounded w-full mb-6"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => router.back()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Go Back
              </button>
            </div>
          ) : product ? (
            <div className="md:flex md:items-start">
              <div className="md:w-1/2 relative">
                <div className="absolute top-4 right-4 z-10">
                  <WishlistButton productId={product.id} />
                </div>
                <ImageGallery images={product.image_urls || []} />
              </div>

              <div className="mt-6 md:mt-0 md:ml-10 md:w-1/2">
                <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{product.name}</h1>

                <div className="mt-3">
                  <div className="flex items-end">
                    <p className="text-3xl font-bold text-purple-600">${discountedPrice?.toFixed(2)}</p>

                    {product.discount > 0 && (
                      <p className="ml-2 text-lg text-gray-500 line-through">${product.price?.toFixed(2)}</p>
                    )}

                    {product.discount > 0 && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {product.discount}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900">Description</h3>
                  <div className="mt-2 text-sm text-gray-500 space-y-2">
                    <p>{product.description || "No description available."}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center">
                    <label htmlFor="quantity" className="mr-3 text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm border-gray-300 rounded-md w-16"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleAddToCart}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors duration-300 ${
                      isAddingToCart ? "bg-green-500" : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {isAddingToCart ? "Added to Cart!" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Product not found.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Back to Products
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
