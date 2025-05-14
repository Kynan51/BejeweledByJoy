"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import supabase from "../utils/supabaseClient"

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [cartError, setCartError] = useState(null)

  // Initialize cart and listen for auth changes
  useEffect(() => {
    // Get current session (Supabase v2+)
    let ignore = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) setSession(session)
      loadCartData(session)
    })

    // Listen for auth changes (Supabase v2+)
    const { subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      await loadCartData(session)
    })

    return () => {
      ignore = true;
      subscription?.unsubscribe?.()
    }
  }, [])

  // Load cart data from localStorage or database
  async function loadCartData(session) {
    setLoading(true)
    setCartError(null)

    try {
      if (session?.user) {
        // User is logged in, load cart from database
        await loadCartFromDatabase(session.user.id)
      } else {
        // User is not logged in, load cart from localStorage
        const localCart = JSON.parse(localStorage.getItem("cart") || "[]")
        setCart(localCart)
      }
    } catch (error) {
      console.error("Error loading cart:", error)
      setCart([]) // fallback to empty cart on error
      setCartError("Failed to load cart. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Load cart from database for logged-in users
  async function loadCartFromDatabase(userId) {
    try {
      // Check if user has a cart
      let { data: userCart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (cartError && cartError.code !== "PGRST116") {
        throw cartError
      }

      // If user doesn't have a cart, create one
      if (!userCart) {
        const { data: newCart, error: createError } = await supabase
          .from("carts")
          .insert([{ user_id: userId }])
          .select("id")
          .single()

        if (createError) throw createError
        userCart = newCart
      }

      // Get cart items
      if (!userCart || !userCart.id) {
        setCart([])
        setLoading(false)
        return; // Prevent invalid queries
      }
      const { data: cartItems, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            discount,
            image_urls
          )
        `,
        )
        .eq("cart_id", userCart.id)

      if (itemsError) throw itemsError

      // Format cart items
      const formattedCart = (cartItems || []).map((item) => {
        // Defensive: skip null or malformed items
        if (!item || !item.products) return null;
        const price = typeof item.products.price === 'number' ? item.products.price : 0;
        const discount = typeof item.products.discount === 'number' ? item.products.discount : 0;
        const discountedPrice = discount > 0
          ? price - price * (discount / 100)
          : price;

        return {
          id: item.id,
          product_id: item.product_id,
          name: item.products.name,
          price: discountedPrice,
          image: Array.isArray(item.products.image_urls) && item.products.image_urls.length > 0 ? item.products.image_urls[0] : null,
          quantity: item.quantity,
        };
      }).filter(Boolean); // Remove any nulls from the array

      setCart(formattedCart)

      // If there's a local cart, merge it with the database cart
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]")
      if (localCart.length > 0) {
        await mergeLocalCartWithDatabase(localCart, userCart.id)
        localStorage.removeItem("cart")
      }
    } catch (error) {
      console.error("Error loading cart from database:", error)
      setCart([]) // fallback to empty cart on error
      setCartError("Failed to load cart from database. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Merge local cart with database cart
  async function mergeLocalCartWithDatabase(localCart, cartId) {
    try {
      for (const item of localCart) {
        // Always prefer product_id, fallback to id for legacy/edge cases
        const productId = item.product_id || item.id;
        const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
        if (!cartId || !productId) continue; // Prevent invalid queries
        // Check if product already exists in cart
        const { data: existingItem } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", productId)
          .single();

        if (existingItem) {
          // Update quantity if product already exists
          await supabase
            .from("cart_items")
            .update({ quantity: existingItem.quantity + quantity })
            .eq("id", existingItem.id)
        } else {
          // Add new product to cart
          await supabase.from("cart_items").insert([
            {
              cart_id: cartId,
              product_id: productId,
              quantity: quantity,
            },
          ])
        }
      }

      // Reload cart after merging
      const { data: cartItems, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            discount,
            image_urls
          )
        `,
        )
        .eq("cart_id", cartId)

      if (itemsError) throw itemsError

      // Format cart items
      const formattedCart = (cartItems || []).map((item) => {
        // Defensive: skip null or malformed items
        if (!item || !item.products) return null;
        const price = typeof item.products.price === 'number' ? item.products.price : 0;
        const discount = typeof item.products.discount === 'number' ? item.products.discount : 0;
        const discountedPrice = discount > 0
          ? price - price * (discount / 100)
          : price;

        return {
          id: item.id,
          product_id: item.product_id,
          name: item.products.name,
          price: discountedPrice,
          image: Array.isArray(item.products.image_urls) && item.products.image_urls.length > 0 ? item.products.image_urls[0] : null,
          quantity: item.quantity,
        };
      }).filter(Boolean); // Remove any nulls from the array

      setCart(formattedCart)
    } catch (error) {
      console.error("Error merging carts:", error)
    }
  }

  // Add item to cart
  async function addToCart(product, quantity = 1) {
    try {
      if (session?.user) {
        // User is logged in, add to database
        await addToCartDatabase(product, quantity)
      } else {
        // User is not logged in, add to localStorage
        addToCartLocal(product, quantity)
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  // Add item to database cart
  async function addToCartDatabase(product, quantity) {
    try {
      // Get user's cart
      const { data: userCart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (cartError) throw cartError

      // Check if product already exists in cart
      const existingItemIndex = cart.findIndex((item) => item.product_id === product.id)

      if (existingItemIndex >= 0) {
        // Update quantity if product already exists
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += quantity

        await supabase
          .from("cart_items")
          .update({ quantity: updatedCart[existingItemIndex].quantity })
          .eq("id", updatedCart[existingItemIndex].id)

        setCart(updatedCart)
      } else {
        // Add new product to cart
        const { data: newItem, error: insertError } = await supabase
          .from("cart_items")
          .insert([
            {
              cart_id: userCart.id,
              product_id: product.id,
              quantity,
            },
          ])
          .select(
            `
            id,
            quantity,
            product_id,
            products (
              id,
              name,
              price,
              discount,
              image_urls
            )
          `,
          )
          .single()

        if (insertError) throw insertError

        // Calculate discounted price
        const discountedPrice =
          newItem.products.discount > 0
            ? newItem.products.price - newItem.products.price * (newItem.products.discount / 100)
            : newItem.products.price

        // Add new item to cart state
        const newCartItem = {
          id: newItem.id,
          product_id: newItem.product_id,
          name: newItem.products.name,
          price: discountedPrice,
          image:
            newItem.products.image_urls && newItem.products.image_urls.length > 0
              ? newItem.products.image_urls[0]
              : null,
          quantity: newItem.quantity,
        }

        setCart([...cart, newCartItem])
      }
    } catch (error) {
      console.error("Error adding to database cart:", error)
    }
  }

  // Add item to localStorage cart
  function addToCartLocal(product, quantity) {
    // Calculate discounted price
    const discountedPrice =
      product.discount > 0 ? product.price - product.price * (product.discount / 100) : product.price

    // Get current cart from localStorage
    let localCart = JSON.parse(localStorage.getItem("cart") || "[]")

    // Check if product is already in cart
    let existingItemIndex = localCart.findIndex((item) => item.product_id === product.id)
    if (existingItemIndex === -1) {
      // Try fallback for legacy carts with id instead of product_id
      existingItemIndex = localCart.findIndex((item) => item.id === product.id)
    }

    if (existingItemIndex >= 0) {
      // Increment quantity if product already exists
      localCart[existingItemIndex].quantity += quantity
    } else {
      // Add new product to cart
      localCart.push({
        product_id: product.id,
        name: product.name,
        price: discountedPrice,
        image: product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : null,
        quantity,
      })
    }

    // Save updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(localCart))
    setCart(localCart)
    // Dispatch custom event for immediate UI update
    window.dispatchEvent(new Event("cart-updated"))
  }

  // Remove item from cart
  async function removeFromCart(itemId) {
    try {
      if (session?.user) {
        // User is logged in, remove from database
        await supabase.from("cart_items").delete().eq("id", itemId)
      }

      // Remove item from cart state
      const updatedCart = cart.filter((item) => item.id !== itemId)
      setCart(updatedCart)

      // Update localStorage if user is not logged in
      if (!session?.user) {
        localStorage.setItem("cart", JSON.stringify(updatedCart))
      }
    } catch (error) {
      console.error("Error removing from cart:", error)
    }
  }

  // Update item quantity
  async function updateQuantity(itemId, quantity) {
    try {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        await removeFromCart(itemId)
        return
      }

      // Update cart state
      const updatedCart = cart.map((item) => {
        if (item.id === itemId) {
          return { ...item, quantity }
        }
        return item
      })

      setCart(updatedCart)

      if (session?.user) {
        // User is logged in, update database
        await supabase.from("cart_items").update({ quantity }).eq("id", itemId)
      } else {
        // User is not logged in, update localStorage
        localStorage.setItem("cart", JSON.stringify(updatedCart))
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  // Clear cart
  async function clearCart() {
    try {
      if (session?.user) {
        // Get user's cart
        const { data: userCart, error: cartError } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (cartError) throw cartError

        // Delete all items from cart
        await supabase.from("cart_items").delete().eq("cart_id", userCart.id)
      }

      // Clear cart state
      setCart([])

      // Clear localStorage if user is not logged in
      if (!session?.user) {
        localStorage.removeItem("cart")
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
    }
  }

  // Calculate cart total
  function getCartTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Get cart item count
  function getCartItemCount() {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  // Wrap methods in useCallback
  const addToCartCb = useCallback(addToCart, [cart, session])
  const removeFromCartCb = useCallback(removeFromCart, [cart, session])
  const updateQuantityCb = useCallback(updateQuantity, [cart, session])
  const clearCartCb = useCallback(clearCart, [cart, session])
  const getCartTotalCb = useCallback(getCartTotal, [cart])
  const getCartItemCountCb = useCallback(getCartItemCount, [cart])

  // Memoize context value
  const contextValue = useMemo(() => ({
    cart,
    loading,
    cartError,
    addToCart: addToCartCb,
    removeFromCart: removeFromCartCb,
    updateQuantity: updateQuantityCb,
    clearCart: clearCartCb,
    getCartTotal: getCartTotalCb,
    getCartItemCount: getCartItemCountCb,
  }), [cart, loading, cartError, addToCartCb, removeFromCartCb, updateQuantityCb, clearCartCb, getCartTotalCb, getCartItemCountCb])

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
