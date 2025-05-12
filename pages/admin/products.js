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

export default function AdminProducts() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  async function fetchProducts(page = 0) {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, discount, image_urls, quantity, created_at")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
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
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      discount: product.discount || 0,
      image_urls: (product.image_urls || []).filter(
        (url) => url && url !== "null" && url !== "undefined"
      ),
      quantity: product.quantity || 0,
    });
    setUploadedImages([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
    console.log("uploadImageToServer result:", result, "status:", res.status);
    if (!res.ok) throw new Error(result.error || "Image upload failed");
    return result.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    console.log("Submitting product:", currentProduct);

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
          console.log("Image upload result:", url, "for file:", file);
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
      console.log("allImageUrls to be saved:", allImageUrls);

      const productData = {
        name: currentProduct.name.trim(),
        description: currentProduct.description.trim(),
        price: Number.parseFloat(currentProduct.price),
        discount: Number.parseInt(currentProduct.discount) || 0,
        image_urls: allImageUrls,
        quantity: Number.parseInt(currentProduct.quantity) || 0,
      };

      console.log("Sending productData to API:", productData);

      let res, result;

      if (currentProduct.id) {
        res = await fetch("/api/admin-update-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentProduct.id, ...productData }),
        });
        result = await res.json();
        console.log("Update product API response:", result);
        if (!res.ok) throw new Error(result.error || "Error updating product");
      } else {
        res = await fetch("/api/admin-add-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        result = await res.json();
        console.log("Add product API response:", result);
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

  const openDeleteModal = (productId) => {
    setProductToDelete(productId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setProductToDelete(null);
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
      closeDeleteModal();
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
      {/* Non-blocking spinner overlay during loading */}
      {(loading || loadingProducts) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
          <p className="text-gray-500">Loading...</p>
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

      {isModalOpen && productToDelete && (
        <Modal isOpen={isModalOpen} onClose={closeDeleteModal}>
          <p>Are you sure you want to delete this product?</p>
          <button
            onClick={confirmDeleteProduct}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Yes, Delete
          </button>
          <button
            onClick={closeDeleteModal}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </Modal>
      )}
    </Layout>
  );
}
