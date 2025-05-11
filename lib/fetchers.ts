import supabase from "../utils/supabaseClient";

export async function fetchProductsSWR([_key, filters]: [string, any]) {
  let query = supabase.from("products").select("id, name, price, discount, image_urls, created_at, quantity")
  if (filters.search) query = query.ilike("name", `%${filters.search}%`)
  if (filters.minPrice) query = query.gte("price", filters.minPrice)
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice)
  if (filters.hasDiscount === "true") query = query.gt("discount", 0)
  if (filters.sortBy === "price-asc") query = query.order("price", { ascending: true })
  else if (filters.sortBy === "price-desc") query = query.order("price", { ascending: false })
  else query = query.order("created_at", { ascending: false })
  // @ts-ignore
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}
