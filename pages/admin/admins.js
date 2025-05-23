"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminTabsNav from "../../components/AdminTabsNav"
import AdminNav from "../../components/AdminNav";
import { useAuth } from "../../contexts/AuthContext"
import { getUserRole, isAdminRole, isOwnerRole } from "../../utils/role";
import { MoonLoader } from "react-spinners"

export default function AdminUsers() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [formError, setFormError] = useState(null);
  const [spinnerTimeout, setSpinnerTimeout] = useState(false);

  const userEmail = session?.user?.email || null;
  const role = userEmail ? getUserRole(userEmail) : null;
  const isAdmin = userEmail ? isAdminRole(userEmail) : false;
  const isOwner = userEmail ? isOwnerRole(userEmail) : false;

  useEffect(() => {
    if (!loading && !isAdmin && !isOwner) {
      router.replace("/");
    }
  }, [loading, isAdmin, isOwner]);

  useEffect(() => {
    if (isAdmin || isOwner) {
      fetchAdmins();
    }
  }, [isAdmin, isOwner]);

  useEffect(() => {
    if (!loading && !loadingAdmins) return;
    const timeout = setTimeout(() => setSpinnerTimeout(true), 10000);
    return () => clearTimeout(timeout);
  }, [loading, loadingAdmins]);

  async function fetchAdmins() {
    try {
      setLoadingAdmins(true);
      // Fetch all admins
      const res = await fetch('/api/admin-list-admins', {
        headers: { 'Accept': 'application/json' }
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      setAdmins(data || []);
    } catch (error) {
      setFormError("Failed to fetch admins");
    } finally {
      setLoadingAdmins(false);
    }
  }

  async function handleAddAdmin() {
    setFormError(null);
    if (!newAdminEmail) return;
    try {
      if (!isOwner) throw new Error('Only the owner can add admins');
      if (!session?.user?.email) throw new Error('No session user email');
      const res = await fetch('/api/admin-add-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail, requesterEmail: session.user.email })
      });
      const addResult = await res.json();
      if (addResult.error) throw new Error(addResult.error);
      setNewAdminEmail("");
      fetchAdmins();
    } catch (error) {
      setFormError(error.message);
    }
  }

  async function handleRemoveAdmin(adminId) {
    setFormError(null);
    try {
      if (!isOwner) throw new Error('Only the owner can remove admins');
      if (!session?.user?.email) throw new Error('No session user email');
      const res = await fetch('/api/admin-remove-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adminId, requesterEmail: session.user.email })
      });
      const removeResult = await res.json();
      if (removeResult.error) throw new Error(removeResult.error);
      fetchAdmins();
    } catch (error) {
      setFormError(error.message);
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
        <title>Admin Users</title>
      </Head>
      {/* Non-blocking spinner overlay during loading, with fallback */}
      {(loading || loadingAdmins) && !spinnerTimeout && (
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
      <AdminNav isAdmin={isAdmin} />
      <div className="max-w-2xl mx-auto mt-8">
        {formError && <div className="mb-4 text-red-600">{formError}</div>}
        {isOwner && (
          <div className="mb-6 flex items-center space-x-2">
            <input
              type="email"
              value={newAdminEmail}
              onChange={e => setNewAdminEmail(e.target.value)}
              placeholder="Enter email to add admin"
              className="border px-3 py-2 rounded w-full"
            />
            <button
              onClick={handleAddAdmin}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Add Admin
            </button>
          </div>
        )}
        <h2 className="text-lg font-semibold mb-4">Current Admins</h2>
        {loadingAdmins ? (
          <div>Loading admins...</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {admins.map(admin => (
              <li key={admin.id} className="flex items-center justify-between py-2">
                <span>{admin.email} {admin.is_owner && <span className="ml-2 text-xs text-green-600">(Owner)</span>}</span>
                {isOwner && !admin.is_owner && (
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
