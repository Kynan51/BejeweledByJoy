"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Layout from "../../components/Layout"
import ImageGallery from "../../components/ImageGallery"
import WishlistButton from "../../components/WishlistButton"
import { useCart } from "../../contexts/CartContext"
import supabase from "../../utils/supabaseClient"
import useSWR from "swr"
import { MoonLoader } from "react-spinners"

const fetcher = async (id) => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, discount, image_urls, description, quantity")
    .eq("id", id);
  if (error) throw error;
  // Always return a single product object, not an array
  let product = null;
  if (Array.isArray(data) && data.length > 0) {
    product = data[0];
  } else if (data && typeof data === 'object') {
    product = data;
  }
  if (!product) return null;
  if (!product.image_urls || !Array.isArray(product.image_urls) || product.image_urls.length === 0) {
    product.image_urls = ["/placeholder.jpg"];
  }
  if (typeof window !== 'undefined') {
    console.log('[ProductDetail] Normalized product:', product);
  }
  return product;
};

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const { addToCart } = useCart()

  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Only fetch when id is a non-empty string and router.isReady is true
  const shouldFetch = router.isReady && typeof id === 'string' && id.length > 0;
  const { data: product, error, isLoading } = useSWR(
    shouldFetch ? ["product", id] : null,
    () => fetcher(id),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value)
    if (product && value > product.quantity) {
      setQuantity(product.quantity)
    } else {
      setQuantity(value > 0 ? value : 1)
    }
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
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <MoonLoader color="#a855f7" size={48} />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-96 text-red-500">{error.message || "Error fetching product"}</div>
      ) : !product ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Product not found.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Back to Products
          </button>
        </div>
      ) : (
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-start">
              <div className="md:w-1/2 relative">
                <div className="absolute top-4 right-4 z-10">
                  <WishlistButton productId={product.id} />
                </div>
                <ImageGallery images={product?.image_urls || ["/placeholder.jpg"]} lazyLoad />
              </div>
              <div className="mt-6 md:mt-0 md:ml-10 md:w-1/2">
                <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{product.name}</h1>
                <div className="mt-3">
                  <div className="flex items-end">
                    <p className="text-3xl font-bold text-purple-600">Ksh{discountedPrice?.toFixed(2)}</p>
                    {product.discount > 0 && (
                      <p className="ml-2 text-lg text-gray-500 line-through">Ksh{product.price?.toFixed(2)}</p>
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
                      max={product.quantity || 1}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm border-gray-300 rounded-md w-16"
                    />
                    <span className="ml-2 text-xs text-gray-500">
                      {typeof product.quantity === 'number' ? `In stock: ${product.quantity}` : "Out of stock"}
                    </span>
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
          </div>
        </div>
      )}
    </Layout>
  );
}
