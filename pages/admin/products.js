"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import Image from "next/image"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminNav from "../../components/AdminNav"
import supabase from "../../utils/supabaseClient"

export default function AdminProducts() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    discount: 0,
    image_urls: [],
    quantity: 0, // Add quantity field
  })
  const [uploadedImages, setUploadedImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)

      // Check if user is admin
      if (session?.user) {
        checkIfAdmin(session.user.email)
      } else {
        router.push("/auth")
      }
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session?.user) {
        checkIfAdmin(session.user.email)
      } else {
        router.push("/auth")
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (isAdmin) {
      fetchProducts()
    }
  }, [isAdmin])

  async function checkIfAdmin(email) {
    if (!email) return

    try {
      const { data, error } = await supabase.from("admins").select("*").eq("email", email).single()

      if (data && !error) {
        setIsAdmin(true)
      } else {
        router.push("/auth")
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/auth")
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setCurrentProduct({
      id: null,
      name: "",
      description: "",
      price: "",
      discount: 0,
      image_urls: [],
      quantity: 0, // Add quantity field
    })
    setUploadedImages([])
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setCurrentProduct({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      discount: product.discount || 0,
      // Defensive: filter out null, 'null', 'undefined', empty
      image_urls: (product.image_urls || []).filter(
        (url) => url && url !== 'null' && url !== 'undefined'
      ),
      quantity: product.quantity || 0, // Add quantity field
    })
    setUploadedImages([])
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === "price") {
      // Only allow numbers and decimal point
      const regex = /^[0-9]*\.?[0-9]*$/
      if (value === "" || regex.test(value)) {
        setCurrentProduct({ ...currentProduct, [name]: value })
      }
    } else if (name === "discount") {
      // Only allow numbers between 0-100
      const numValue = Number.parseInt(value)
      if (value === "" || (numValue >= 0 && numValue <= 100)) {
        setCurrentProduct({ ...currentProduct, [name]: value === "" ? 0 : numValue })
      }
    } else if (name === "quantity") {
      // Only allow non-negative integers
      const numValue = Number.parseInt(value)
      if (value === "" || numValue >= 0) {
        setCurrentProduct({ ...currentProduct, [name]: value === "" ? 0 : numValue })
      }
    } else {
      setCurrentProduct({ ...currentProduct, [name]: value })
    }
  }

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFormError(null);

    try {
      // Always start fresh, do not accumulate
      const newUploadedImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!file.type.startsWith("image/")) {
          setFormError("Only image files are allowed.");
          continue;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setFormError("Image size should be less than 5MB.");
          continue;
        }

        // Create a temporary URL for preview
        const previewUrl = URL.createObjectURL(file);

        newUploadedImages.push({ file, previewUrl });
      }

      setUploadedImages(newUploadedImages);
    } catch (error) {
      console.error("Error handling image upload:", error);
      setFormError("Error uploading images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = (index) => {
    const newUploadedImages = [...uploadedImages]

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newUploadedImages[index].previewUrl)

    newUploadedImages.splice(index, 1)
    setUploadedImages(newUploadedImages)
  }

  const removeExistingImage = (index) => {
    const newImageUrls = [...currentProduct.image_urls]
    newImageUrls.splice(index, 1)
    setCurrentProduct({ ...currentProduct, image_urls: newImageUrls })
  }

  const uploadImageToServer = async (file, productId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId || 'new');
    const res = await fetch('/api/admin-upload-image', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    console.log('uploadImageToServer result:', result, 'status:', res.status);
    if (!res.ok) throw new Error(result.error || 'Image upload failed');
    return result.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    console.log("Submitting product:", currentProduct);

    // Validate form
    if (!currentProduct.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (!currentProduct.price || Number.parseFloat(currentProduct.price) <= 0) {
      setFormError("Valid price is required.");
      return;
    }

    try {
      setIsUploading(true);

      // Upload new images to server in parallel
      const newImageUrls = await Promise.all(
        uploadedImages.map(async (uploadedImage) => {
          const file = uploadedImage.file;
          const url = await uploadImageToServer(file, currentProduct.id);
          console.log("Image upload result:", url, "for file:", file);
          return url;
        })
      );

      // Combine existing and new image URLs
      const allImageUrls = [
        ...(currentProduct.image_urls || []).filter(
          (url) => url && url !== "null" && url !== "undefined"
        ),
        ...newImageUrls.filter(
          (url) => url && url !== "null" && url !== "undefined"
        ),
      ];
      console.log("allImageUrls to be saved:", allImageUrls);

      // Prepare product data
      const productData = {
        name: currentProduct.name.trim(),
        description: currentProduct.description.trim(),
        price: Number.parseFloat(currentProduct.price),
        discount: Number.parseInt(currentProduct.discount) || 0,
        image_urls: allImageUrls,
        quantity: Number.parseInt(currentProduct.quantity) || 0, // Include quantity
      };

      console.log("Sending productData to API:", productData);

      let res, result;

      if (currentProduct.id) {
        // Update existing product via secure API route
        res = await fetch("/api/admin-update-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentProduct.id, ...productData }),
        });
        result = await res.json();
        console.log("Update product API response:", result);
        if (!res.ok) throw new Error(result.error || "Error updating product");
      } else {
        // Add new product via secure API route
        res = await fetch("/api/admin-add-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        result = await res.json();
        console.log("Add product API response:", result);
        if (!res.ok) throw new Error(result.error || "Error adding product");
      }

      // Refresh product list
      fetchProducts();
      closeModal();
    } catch (error) {
      console.error("Error submitting product:", error);
      setFormError("Error saving product. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      // Delete product from database via secure API route
      const res = await fetch('/api/admin-delete-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error deleting product');

      // Refresh products list
      await fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Error deleting product. Please try again.")
    }
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Checking authentication...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Manage Products - Jewelry Store</title>
        <meta name="description" content="Admin product management for Jewelry Store." />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Manage Products</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 md:mr-8">
                <AdminNav />
              </div>

              <div className="flex-1">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Products</h2>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Add Product
                  </button>
                </div>

                {loading ? (
                  <div className="animate-pulse">
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="bg-white shadow rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 bg-gray-200 rounded"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-8 w-20 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-10 bg-white shadow rounded-lg">
                    <p className="text-gray-500">No products available. Add your first product!</p>
                  </div>
                ) : (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Product
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Discount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  {product.image_urls && product.image_urls.length > 0 && product.image_urls[0] ? (
                                    <Image
                                      src={product.image_urls[0]}
                                      alt={product.name}
                                      fill
                                      style={{ objectFit: "cover" }}
                                      className="rounded object-center object-cover"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.discount > 0 ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  {product.discount}% OFF
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">No discount</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openEditModal(product)}
                                className="text-purple-600 hover:text-purple-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {currentProduct.id ? "Edit Product" : "Add New Product"}
                      </h3>

                      {formError && <div className="mt-2 p-2 bg-red-50 text-red-500 text-sm rounded">{formError}</div>}

                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={currentProduct.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={currentProduct.description}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                              Price ($) *
                            </label>
                            <input
                              type="text"
                              name="price"
                              id="price"
                              value={currentProduct.price}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                              Discount (%)
                            </label>
                            <input
                              type="number"
                              name="discount"
                              id="discount"
                              min="0"
                              max="100"
                              value={currentProduct.discount}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              id="quantity"
                              min="0"
                              value={currentProduct.quantity}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Product Images</label>

                          <div className="mt-2 flex items-center">
                            <input
                              type="file"
                              id="images"
                              name="images"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              className="sr-only"
                              disabled={isUploading}
                            />
                            <label
                              htmlFor="images"
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              {isUploading ? "Uploading..." : "Upload Images"}
                            </label>
                          </div>

                          {/* Existing Images */}
                          {currentProduct.image_urls && currentProduct.image_urls.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                              <div className="grid grid-cols-3 gap-2">
                                {currentProduct.image_urls.map((url, index) => (
                                  <div key={index} className="relative">
                                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                                      <Image
                                        src={url || "/placeholder.svg"}
                                        alt={`Product image ${index + 1}`}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        className="w-full h-full object-center object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeExistingImage(index)}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-sm"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* New Uploaded Images */}
                          {uploadedImages.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
                              <div className="grid grid-cols-3 gap-2">
                                {uploadedImages.map((image, index) => (
                                  <div key={index} className="relative">
                                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                                      <Image
                                        src={image.previewUrl || "/placeholder.svg"}
                                        alt={`New image ${index + 1}`}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        className="w-full h-full object-center object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeUploadedImage(index)}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-sm"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isUploading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
