import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../../components/Layout";
import AdminNav from "../../components/AdminNav";
import { useAuth } from "../../contexts/AuthContext";
import { getUserRole, isAdminRole, isOwnerRole } from "../../utils/role";
import { MoonLoader } from "react-spinners";
import OrderDetailsModal from "../../components/OrderDetailsModal";

export default function AdminOrders() {
  const { session, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const userEmail = session?.user?.email || null;
  const isAdmin = userEmail ? isAdminRole(userEmail) : false;
  const isOwner = userEmail ? isOwnerRole(userEmail) : false;

  useEffect(() => {
    if (isAdmin || isOwner) fetchOrders();
  }, [isAdmin, isOwner]);

  async function fetchOrders() {
    setLoadingOrders(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-list-pending-orders");
      const { orders, error } = await res.json();
      if (error) throw new Error(error);
      setOrders(orders || []);
    } catch (err) {
      setError("Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  }

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
        <title>Pending Orders - Admin</title>
      </Head>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Pending Orders</h1>
          <AdminNav isAdmin={isAdmin} />
          {loadingOrders ? (
            <div className="flex justify-center items-center min-h-[120px]">
              <MoonLoader color="#a855f7" size={48} />
            </div>
          ) : error ? (
            <div className="text-red-600 text-center">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-gray-500 text-center">No pending orders.</div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{order.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">Ksh{order.total_amount?.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{order.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="text-purple-600 hover:underline mr-2"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <OrderDetailsModal orderId={selectedOrderId} open={!!selectedOrderId} onClose={() => setSelectedOrderId(null)} />
        </div>
      </div>
    </Layout>
  );
}
