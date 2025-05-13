"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import Image from "next/image"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminNav from "../../components/AdminNav"
import Modal from "../../components/ui/modal" // Assuming a modal component exists
import supabase from "../../utils/supabaseClient"
import imageCompression from "browser-image-compression"
import { useAuth } from "../../contexts/AuthContext"
import { getUserRole, isAdminRole, isOwnerRole } from "../../utils/role"
import { MoonLoader } from "react-spinners"
import { fetchProductsSWR } from "../../lib/fetchers"

export default function AdminProducts() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    discount: 0,
    image_urls: [],
    quantity: 0,
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [spinnerTimeout, setSpinnerTimeout] = useState(false);
  const PAGE_SIZE = 20;

  const userEmail = session?.user?.email || null;
  const role = userEmail ? getUserRole(userEmail) : null;
  const isAdmin = userEmail ? isAdminRole(userEmail) : false;
  const isOwner = userEmail ? isOwnerRole(userEmail) : false;

  // Redirect unauthorized users
  useEffect(() => {
    if (!loading && !isAdmin && !isOwner) {
      router.replace("/");
    }
  }, [loading, isAdmin, isOwner]);

  useEffect(() => {
    if (isAdmin || isOwner) {
      fetchProducts();
    }
  }, [isAdmin, isOwner]);

  // Prevent spinner from blocking UI forever (fallback after 10s)
  useEffect(() => {
    if (!loading && !loadingProducts) return;
    const timeout = setTimeout(() => setSpinnerTimeout(true), 10000);
    return () => clearTimeout(timeout);
  }, [loading, loadingProducts]);

  async function fetchProducts(page = 0) {
    try {
      setLoadingProducts(true);
      // Use REST API fetcher for product list
      const data = await fetchProductsSWR(["products", { page }]);
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
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
      quantity: 0,
    });
    setUploadedImages([]);
    setFormError(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = async (product) => {
    try {
      setLoadingProducts(true);
      // Fetch single product via REST API
      const url = `https://izorbgujgfqtugtewxap.supabase.co/rest/v1/products?id=eq.${product.id}&select=id,name,description,price,discount,image_urls,quantity`;
      const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const res = await fetch(url, {
        headers: {
          apikey,
          Authorization: `Bearer ${apikey}`,
          Accept: "application/json",
        },
      });
      const arr = await res.json();
      if (!res.ok) throw new Error(arr.error || "Unknown error");
      const data = Array.isArray(arr) ? arr[0] : arr;
      setCurrentProduct({
        id: data.id,
        name: data.name,
        description: data.description || "",
        price: data.price,
        discount: data.discount || 0,
        image_urls: (data.image_urls || []).filter((url) => url && url !== "null" && url !== "undefined"),
        quantity: data.quantity || 0,
      });
      setUploadedImages([]);
      setFormError(null);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (err) {
      setFormError("Failed to fetch latest product details.");
      console.error('[DEBUG] Error in openEditModal:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const openDeleteModal = (productId) => {
    setProductToDelete(productId);
    setModalMode('delete');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setProductToDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "price") {
      const regex = /^[0-9]*\.?[0-9]*$/;
      if (value === "" || regex.test(value)) {
        setCurrentProduct({ ...currentProduct, [name]: value });
      }
    } else if (name === "discount") {
      const numValue = Number.parseInt(value);
      if (value === "" || (numValue >= 0 && numValue <= 100)) {
        setCurrentProduct({
          ...currentProduct,
          [name]: value === "" ? 0 : numValue,
        });
      }
    } else if (name === "quantity") {
      const numValue = Number.parseInt(value);
      if (value === "" || numValue >= 0) {
        setCurrentProduct({
          ...currentProduct,
          [name]: value === "" ? 0 : numValue,
        });
      }
    } else {
      setCurrentProduct({ ...currentProduct, [name]: value });
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFormError(null);

    try {
      const newUploadedImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          setFormError("Only image files are allowed.");
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setFormError("Image size should be less than 5MB.");
          continue;
        }

        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });

        const previewUrl = URL.createObjectURL(compressedFile);

        newUploadedImages.push({ file: compressedFile, previewUrl });
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
    const newUploadedImages = [...uploadedImages];

    URL.revokeObjectURL(newUploadedImages[index].previewUrl);

    newUploadedImages.splice(index, 1);
    setUploadedImages(newUploadedImages);
  };

  const removeExistingImage = (index) => {
    const newImageUrls = [...currentProduct.image_urls];
    newImageUrls.splice(index, 1);
    setCurrentProduct({ ...currentProduct, image_urls: newImageUrls });
  };

  const uploadImageToServer = async (file, productId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId || "new");
    const res = await fetch("/api/admin-upload-image", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    // console.log("uploadImageToServer result:", result, "status:", res.status);
    if (!res.ok) throw new Error(result.error || "Image upload failed");
    return result.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    // console.log("Submitting product:", currentProduct);

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

      const newImageUrls = await Promise.all(
        uploadedImages.map(async (uploadedImage) => {
          const file = uploadedImage.file;
          const url = await uploadImageToServer(file, currentProduct.id);
          // console.log("Image upload result:", url, "for file:", file);
          return url;
        })
      );

      const allImageUrls = [
        ...(currentProduct.image_urls || []).filter(
          (url) => url && url !== "null" && url !== "undefined"
        ),
        ...newImageUrls.filter(
          (url) => url && url !== "null" && url !== "undefined"
        ),
      ];
      // console.log("allImageUrls to be saved:", allImageUrls);

      const productData = {
        name: currentProduct.name.trim(),
        description: currentProduct.description.trim(),
        price: Number.parseFloat(currentProduct.price),
        discount: Number.parseInt(currentProduct.discount) || 0,
        image_urls: allImageUrls,
        quantity: Number.parseInt(currentProduct.quantity) || 0,
      };

      // console.log("Sending productData to API:", productData);

      let res, result;

      if (currentProduct.id) {
        res = await fetch("/api/admin-update-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentProduct.id, ...productData }),
        });
        result = await res.json();
        // console.log("Update product API response:", result);
        if (!res.ok) throw new Error(result.error || "Error updating product");
      } else {
        res = await fetch("/api/admin-add-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        result = await res.json();
        // console.log("Add product API response:", result);
        if (!res.ok) throw new Error(result.error || "Error adding product");
      }

      fetchProducts();
      closeModal();
    } catch (error) {
      console.error("Error submitting product:", error);
      setFormError("Error saving product. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const res = await fetch("/api/admin-delete-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productToDelete }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error deleting product");

      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    } finally {
      closeModal();
    }
  };

  if (!(isAdmin || isOwner)) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">You are not authorized to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Manage Products - Jewelry Store</title>
        <meta name="description" content="Admin product management for Jewelry Store." />
      </Head>
      {/* Non-blocking spinner overlay during loading, with fallback */}
      {(loading || loadingProducts) && !spinnerTimeout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
          <MoonLoader color="#a855f7" size={48} />
        </div>
      )}
      {spinnerTimeout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="bg-white p-6 rounded shadow text-red-600 text-center flex flex-col items-center">
            Something went wrong. Please try refreshing the page.
            <button
              onClick={() => { window.location.reload(true); }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded mx-auto"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage Products
          </h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 md:mr-8">
                <AdminNav isAdmin={isAdmin} />
              </div>

              <div className="flex-1">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    Products
                  </h2>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Add Product
                  </button>
                </div>

                {loadingProducts ? (
                  <div className="animate-pulse">
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div
                          key={index}
                          className="bg-white shadow rounded-lg p-4"
                        >
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
                    <p className="text-gray-500">
                      No products available. Add your first product!
                    </p>
                  </div>
                ) : (
                  <div className="bg-white shadow rounded-lg overflow-x-auto">
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
                                  {product.image_urls &&
                                  product.image_urls.length > 0 &&
                                  product.image_urls[0] ? (
                                    <Image
                                      src={product.image_urls[0]}
                                      alt={product.name}
                                      fill
                                      style={{ objectFit: "cover" }}
                                      className="rounded object-center object-cover"
                                      loading="lazy"
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
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Ksh{product.price.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.discount > 0 ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  {product.discount}% OFF
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  No discount
                                </span>
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
                                onClick={() => openDeleteModal(product.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center">
          {/* Overlay to gray out the entire page including header */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1200] pointer-events-auto" />
          {/* Modal content for delete or edit */}
          <div className="fixed inset-0 flex items-center justify-center z-[1201] pointer-events-none">
            <div className="pointer-events-auto">
              {modalMode === 'delete' && productToDelete ? (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                  <div className="text-lg font-bold mb-2 text-red-700 text-center">Delete Product</div>
                  <div className="mb-4 text-center">Are you sure you want to delete this product? This action cannot be undone.</div>
                  <div className="flex justify-center gap-4 mt-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold shadow"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteProduct}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold shadow"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </Modal>
              ) : (
                <Modal
                  isOpen={isModalOpen}
                  onClose={closeModal}
                >
                  {/* {console.log('[DEBUG] Modal render, currentProduct:', currentProduct)} */}
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto p-2 w-[95vw] max-w-md sm:max-w-xl mx-auto rounded-lg bg-white z-[1201]">
                    <h2 className="text-lg font-bold mb-2 text-center">{modalMode === 'edit' ? 'Edit Product' : 'Add Product'}</h2>
                    {formError && <div className="text-red-600 text-sm mb-2">{formError}</div>}
                    <div className="flex flex-col gap-4">
                      <label className="font-medium">Product Name
                        <input
                          type="text"
                          name="name"
                          value={currentProduct.name}
                          onChange={handleInputChange}
                          placeholder="Product Name"
                          className="w-full border rounded px-3 py-2 mt-1"
                          required
                        />
                      </label>
                      <label className="font-medium">Description
                        <textarea
                          name="description"
                          value={currentProduct.description}
                          onChange={handleInputChange}
                          placeholder="Description"
                          className="w-full border rounded px-3 py-2 mt-1"
                          rows={3}
                        />
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 font-medium">Price (Ksh)
                          <input
                            type="number"
                            name="price"
                            value={currentProduct.price}
                            onChange={handleInputChange}
                            placeholder="Price"
                            className="w-full border rounded px-3 py-2 mt-1"
                            min="0"
                            step="0.01"
                            required
                          />
                        </label>
                        <label className="flex-1 font-medium">Discount (%)
                          <input
                            type="number"
                            name="discount"
                            value={currentProduct.discount}
                            onChange={handleInputChange}
                            placeholder="Discount (%)"
                            className="w-full border rounded px-3 py-2 mt-1"
                            min="0"
                            max="100"
                          />
                        </label>
                        <label className="flex-1 font-medium">Quantity
                          <input
                            type="number"
                            name="quantity"
                            value={currentProduct.quantity}
                            onChange={handleInputChange}
                            placeholder="Quantity"
                            className="w-full border rounded px-3 py-2 mt-1"
                            min="0"
                          />
                        </label>
                      </div>
                    </div>
                    {/* Images Preview Section with drag-and-drop and remove */}
                    <div className="mt-4">
                      <div className="font-semibold mb-2">Product Images</div>
                      <div
                        className="flex flex-wrap gap-2 justify-center border-2 border-dashed border-gray-300 rounded p-2 min-h-[90px] relative"
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                          if (files.length > 0) handleImageUpload({ target: { files } });
                        }}
                      >
                        {/* Existing images from DB */}
                        {currentProduct.image_urls && currentProduct.image_urls.length > 0 && currentProduct.image_urls.map((url, idx) => (
                          <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden bg-gray-100 flex items-center justify-center group">
                            <img src={url} alt={`Product image ${idx + 1}`} className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 z-10"
                              title="Remove image"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        {/* Newly uploaded images */}
                        {uploadedImages && uploadedImages.length > 0 && uploadedImages.map((img, idx) => (
                          <div key={idx + 'upload'} className="relative w-20 h-20 border rounded overflow-hidden bg-gray-100 flex items-center justify-center group">
                            <img src={img.previewUrl} alt={`Uploaded preview ${idx + 1}`} className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(idx)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 z-10"
                              title="Remove image"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        {/* Add more images button */}
                        <label className="w-20 h-20 border-2 border-dashed border-gray-400 rounded flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:border-purple-500 hover:text-purple-600 transition-colors">
                          <span className="text-2xl">+</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">Drag and drop or click + to add images. Max 5MB each.</div>
                    </div>
                    <div className="flex justify-end gap-4 mt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold shadow"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold shadow disabled:opacity-50"
                      >
                        {isUploading ? 'Saving...' : (modalMode === 'edit' ? 'Save Changes' : 'Add Product')}
                      </button>
                    </div>
                  </form>
                </Modal>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
