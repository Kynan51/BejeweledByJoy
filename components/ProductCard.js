"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import supabase from "../utils/supabaseClient"
import { useCart } from "../contexts/CartContext"

export default function ProductCard({ product, trackView = true }) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const router = useRouter()
  const viewTimeout = useRef(null)
  const { addToCart } = useCart()

  // Calculate discounted price
  const discountedPrice =
    product.discount > 0 ? product.price - product.price * (product.discount / 100) : product.price

  // Get the first image as the main display image
  const mainImage =
    product.image_urls && product.image_urls.length > 0 && product.image_urls[0]
      ? product.image_urls[0]
      : "/placeholder.jpg"

  const handleClick = async () => {
    if (trackView) {
      if (viewTimeout.current) clearTimeout(viewTimeout.current)
      viewTimeout.current = setTimeout(async () => {
        try {
          const { error } = await supabase.from("views").insert([
            {
              product_id: product.id,
              user_agent: navigator.userAgent,
            },
          ])
          if (error) {
            console.error("Error tracking view:", error)
          }
        } catch (error) {
          console.error("Error tracking view:", error)
        }
      }, 500) // Debounce by 500ms
    }

    router.push(`/product/${product.id}`)
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    setIsAddingToCart(true)
    addToCart(product, 1)
    setTimeout(() => {
      setIsAddingToCart(false)
    }, 1000)
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <div className="relative aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
          {mainImage && mainImage !== 'null' && mainImage !== 'undefined' ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
              className="object-center object-cover"
              priority={true}
            />
          ) : null}
        </div>

        {product.discount > 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-bl-lg">
            {product.discount}% OFF
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>

        <div className="flex items-end mb-2">
          <span className="text-lg font-bold text-purple-600">Ksh{discountedPrice.toFixed(2)}</span>

          {product.discount > 0 && (
            <span className="ml-2 text-sm text-gray-500 line-through">Ksh{product.price.toFixed(2)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-300 ${
            isAddingToCart ? "bg-green-500" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isAddingToCart ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  )
}
