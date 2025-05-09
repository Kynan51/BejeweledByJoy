"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Layout from "../../components/Layout"
import AdminTabsNav from "../../components/AdminTabsNav"
import supabase from "../../utils/supabaseClient"

export default function AdminUsers() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    // Get current session (Supabase v2+)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)

      // Check if user is owner
      if (session?.user) {
        checkIfOwner(session.user.email)
      } else {
        router.push("/auth")
      }
    })

    // Listen for auth changes (Supabase v2+)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session?.user) {
        checkIfOwner(session.user.email)
      } else {
        router.push("/auth")
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkIfOwner = async (email) => {
    try {
      const { data, error } = await supabase
        .from("owners")
        .select("email")
        .eq("email", email)

      if (error) throw error

      setIsOwner(data.length > 0)
    } catch (error) {
      console.error("Error checking owner status:", error.message)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Admin Users</title>
      </Head>
      <AdminTabsNav />
      {/* Add your admin users content here */}
    </Layout>
  )
}
