import { useState, useEffect } from "react";
import Modal from "./ui/modal";
import supabase from "../utils/supabaseClient";
import { Button } from "./ui/button";

export default function OrderDetailsModal({ orderId, open, onClose }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && orderId) fetchOrderDetails();
    // eslint-disable-next-line
  }, [open, orderId]);

  async function fetchOrderDetails() {
    setLoading(true);
    setError(null);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (orderError) throw orderError;
      setOrder(orderData);
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;
      setItems(itemsData);
    } catch (err) {
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }

  async function markFulfilled() {
    if (!orderId) return;
    try {
      // 1. Mark order as fulfilled
      await supabase
        .from("orders")
        .update({ status: "fulfilled" })
        .eq("id", orderId);
      // 2. Get all order items for this order
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;
      // 3. For each product, increment its sold_count in products table
      for (const item of orderItems) {
        // Get current sold_count
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("sold_count")
          .eq("id", item.product_id)
          .single();
        if (productError) throw productError;
        const newSoldCount = (product?.sold_count || 0) + item.quantity;
        await supabase
          .from("products")
          .update({ sold_count: newSoldCount })
          .eq("id", item.product_id);
      }
      if (typeof onClose === "function") onClose();
    } catch (err) {
      alert("Failed to mark as fulfilled or update product sales. Please try again.");
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="p-4 min-w-[320px] max-w-[95vw] max-h-[80vh] flex flex-col">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : order ? (
          <>
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              Order #{order.id.substring(0,8).toUpperCase()}
              {order.type === 'whatsapp' && (
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-green-600 text-white">WhatsApp</span>
              )}
            </h2>
            <div className="mb-2 text-sm text-gray-600">Placed: {new Date(order.created_at).toLocaleString()}</div>
            <div className="mb-2 text-sm">Status: <span className="capitalize font-semibold">{order.status}</span></div>
            <div className="mb-2 text-sm">Total: <span className="font-semibold">Ksh{order.total_amount?.toFixed(2)}</span></div>
            <div className="mb-2 text-sm">Phone: {order.phone}</div>
            <div className="mb-2 text-sm">Shipping: {order.shipping_address}</div>
            <h3 className="font-semibold mt-4 mb-2">Items</h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <ul className="divide-y divide-gray-200">
                {items.map(item => (
                  <li key={item.id} className="py-2 flex justify-between">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>Ksh{(item.product_price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex justify-center">
              <Button
                variant="default"
                onClick={markFulfilled}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded shadow text-base"
              >
                Mark as Fulfilled
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
