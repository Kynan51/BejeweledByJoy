"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCart } from "../contexts/CartContext"

export default function CartTrolley() {
  const { cart } = useCart();
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const sidebarRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isOpen])

  const handleGoToCart = () => {
    router.push("/cart")
  }

  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      <button
        ref={buttonRef}
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
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 py-0.5 font-bold border-1 border-white">
            {itemCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          ref={sidebarRef}
          className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-4 w-72 max-h-[60vh] overflow-y-auto border border-gray-200 z-50"
        >
          <h4 className="text-lg font-semibold mb-2">Cart</h4>
          {cart.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <ul className="divide-y divide-gray-200 mb-2">
              {cart.map((item, idx) => (
                <li key={(item.product_id || item.id || idx) + '-' + idx} className="flex items-center py-2">
                  <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden bg-gray-100 mr-3">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover object-center rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity || 1}</div>
                  </div>
                  <div className="ml-2 text-sm font-semibold text-purple-600">Ksh{item.price?.toFixed(2)}</div>
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
