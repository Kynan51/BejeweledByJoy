"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function CartTrolley() {
  const [cart, setCart] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load cart from localStorage
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]")
    setCart(storedCart)
    // Listen for cart changes in other tabs
    const onStorage = () => {
      setCart(JSON.parse(localStorage.getItem("cart") || "[]"))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Update cart when items are added/removed
  useEffect(() => {
    const interval = setInterval(() => {
      setCart(JSON.parse(localStorage.getItem("cart") || "[]"))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleGoToCart = () => {
    router.push("/cart")
  }

  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center mb-2 relative"
        aria-label="View cart"
      >
        <Image
          src="/294547-white.svg"
          alt="Cart Trolley"
          width={32}
          height={32}
          className="w-7 h-7"
        />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
            {itemCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-2 w-72 max-h-96 overflow-y-auto border border-gray-200">
          <h4 className="text-lg font-semibold mb-2">Cart</h4>
          {cart.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <ul className="divide-y divide-gray-200 mb-2">
              {cart.map((item, idx) => (
                <li key={item.id + idx} className="flex items-center py-2">
                  <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden bg-gray-100 mr-3">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover object-center rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity || 1}</div>
                  </div>
                  <div className="ml-2 text-sm font-semibold text-purple-600">${item.price?.toFixed(2)}</div>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={handleGoToCart}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-medium transition"
          >
            Go to Cart
          </button>
        </div>
      )}
    </div>
  )
}
