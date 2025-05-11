"use client"

import { useState, useEffect, useRef } from "react"
import supabase from "../utils/supabaseClient"
import { useAuth } from "../contexts/AuthContext"

function useDebounce(fn, delay) {
  const timeoutRef = useRef();
  return (...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fn(...args), delay);
  };
}

export default function WishlistButton({ productId }) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const { session } = useAuth() // Use global auth context

  useEffect(() => {
    // Debug: Log session and productId on mount
    console.log('[WishlistButton] session:', session, 'productId:', productId)
    if (session && productId) {
      checkIfInWishlist(session.user.id, productId)
    } else {
      setIsInWishlist(false) // Always reset if not logged in
      setLoading(false)
    }
  }, [session, productId])

  async function checkIfInWishlist(userId, productId) {
    if (!userId || !productId) return; // Prevent invalid queries
    try {
      setLoading(true)
      // Debug: Log userId and productId for wishlist check
      console.log('[WishlistButton] checkIfInWishlist userId:', userId, 'productId:', productId)
      const { data, error } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle(); // Use maybeSingle to avoid throwing if not found
      console.log('[WishlistButton] Supabase wishlist data:', data, 'error:', error)
      if (error && error.code !== "PGRST116") {
        throw error
      }
      setIsInWishlist(!!data)
    } catch (error) {
      console.log('[WishlistButton] Error checking wishlist:', error)
      setIsInWishlist(false)
    } finally {
      setLoading(false)
    }
  }

  async function toggleWishlist() {
    if (!session) {
      // Redirect to login if not logged in
      window.location.href = "/login?redirect=" + window.location.pathname
      return
    }

    try {
      setLoading(true)

      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", session.user.id)
          .eq("product_id", productId)

        if (error) throw error

        setIsInWishlist(false)
      } else {
        // Add to wishlist
        const { error } = await supabase.from("wishlists").insert([
          {
            user_id: session.user.id,
            product_id: productId,
          },
        ])

        if (error) throw error

        setIsInWishlist(true)
      }
    } catch (error) {
      // Only log this error for debugging wishlist toggle
      console.log('[WishlistButton] Error toggling wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const debouncedToggleWishlist = useDebounce(toggleWishlist, 500);

  return (
    <button
      onClick={debouncedToggleWishlist}
      disabled={loading}
      className="flex items-center justify-center p-2 rounded-full bg-white shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isInWishlist ? (
        <svg
          className="h-6 w-6 text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg
          className="h-6 w-6 text-gray-400 hover:text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  )
}
