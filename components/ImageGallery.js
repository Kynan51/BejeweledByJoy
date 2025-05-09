"use client"

import { useState } from "react"
import Image from "next/image"

export default function ImageGallery({ images = [] }) {
  const [selectedImage, setSelectedImage] = useState(images.length > 0 ? images[0] : null)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 rounded-lg">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
        <Image
          src={selectedImage || images[0]}
          alt="Product image"
          fill
          style={{ objectFit: "cover" }}
          className="w-full h-full object-center object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative w-20 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden ${
                selectedImage === image ? "ring-2 ring-purple-500" : "ring-1 ring-gray-200"
              }`}
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Product thumbnail ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                className="w-full h-full object-center object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
