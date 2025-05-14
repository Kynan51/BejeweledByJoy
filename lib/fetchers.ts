import supabase from "../utils/supabaseClient";

export async function fetchProductsSWR([_key, filters]: [string, any]) {
  // Build query params for filtering
  let query = [];
  if (filters) {
    if (filters.search) {
      // ilike for case-insensitive search on name
      query.push(`name=ilike.*${encodeURIComponent(filters.search)}*`);
    }
    if (filters.minPrice) {
      query.push(`price=gte.${encodeURIComponent(filters.minPrice)}`);
    }
    if (filters.maxPrice) {
      query.push(`price=lte.${encodeURIComponent(filters.maxPrice)}`);
    }
    if (filters.hasDiscount) {
      query.push(`discount=gt.0`);
    }
    if (filters.category) {
      query.push(`category=eq.${encodeURIComponent(filters.category)}`);
    }
  }
  // Sorting
  let order = "created_at.desc";
  if (filters && filters.sortBy) {
    if (filters.sortBy === "price-low-high") order = "price.asc";
    else if (filters.sortBy === "price-high-low") order = "price.desc";
    else if (filters.sortBy === "discount") order = "discount.desc";
    else order = "created_at.desc";
  }
  let url =
    "https://izorbgujgfqtugtewxap.supabase.co/rest/v1/products?select=id,name,price,discount,image_urls,created_at,quantity" +
    (query.length ? "&" + query.join("&") : "") +
    `&order=${order}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  try {
    const res = await fetch(url, {
      headers: {
        apikey: apikey,
        Authorization: `Bearer ${apikey}`,
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");
    return data || [];
  } catch (err) {
    console.error("[fetchProductsSWR direct fetch error]", err);
    throw err;
  }
}

// --- USER PROFILE ---
export async function fetchUserProfile(userId: string) {
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/users?id=eq.${userId}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return Array.isArray(data) ? data[0] : data;
}

export async function updateUserProfile(userId: string, profile: any) {
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/users?id=eq.${userId}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });
  let data = null;
  try {
    // Try to parse JSON, but handle empty response
    const text = await res.text();
    data = text ? JSON.parse(text) : { success: true };
  } catch (err) {
    // If the response is empty, treat as success if status is ok
    if (res.ok) {
      data = { success: true };
    } else {
      console.error('updateUserProfile: Failed to parse JSON response', err);
      throw err;
    }
  }
  if (!res.ok) throw new Error((data && data.error) || "Unknown error");
  return data;
}

// --- ORDERS ---
export async function fetchOrdersREST(userId: string, page: number = 0, pageSize: number = 10) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/orders?user_id=eq.${userId}&order=created_at.desc&select=id,created_at,total_amount,status&offset=${from}&limit=${pageSize}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return data || [];
}

// --- WISHLIST ---
export async function fetchWishlistREST(userId: string, page: number = 0, pageSize: number = 10) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/wishlists?user_id=eq.${userId}&order=created_at.desc&select=id,created_at,products(id,name,price,discount,image_urls)&offset=${from}&limit=${pageSize}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return data || [];
}

export async function removeFromWishlistREST(wishlistId: string) {
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/wishlists?id=eq.${wishlistId}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Unknown error");
  }
  return true;
}

// --- ADDRESSES ---
export async function fetchAddressesREST(userId: string) {
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/saved_addresses?user_id=eq.${userId}&order=is_default.desc&select=id,name,address,city,state,is_default,postal_code,country`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return data || [];
}

export async function addAddressREST(address: any) {
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/saved_addresses`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify([address]),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return data;
}

export async function updateAddressREST(addressId: string, address: any) {
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/saved_addresses?id=eq.${addressId}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(address),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return data;
}

export async function deleteAddressREST(addressId: string) {
  const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/saved_addresses?id=eq.${addressId}`;
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Unknown error");
  }
  return true;
}

export async function setDefaultAddressREST(userId: string, addressId: string) {
  // Unset all, then set one as default
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3JiZ3VqZ2ZxdHVndGV3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjgxNjIsImV4cCI6MjA2MjMwNDE2Mn0.VUm9QAhm6uerNGLPzx7aK7M-Hgdw1jBdmF5umw6z2Nc";
  // Unset all
  await fetch(`https://izorbgujgfqtugtewxap.supabase.co/rest/v1/saved_addresses?user_id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_default: false }),
  });
  // Set one as default
  await fetch(`https://izorbgujgfqtugtewxap.supabase.co/rest/v1/saved_addresses?id=eq.${addressId}`, {
    method: "PATCH",
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_default: true }),
  });
  return true;
}
