"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Layout from "../components/Layout"
import supabase from "../utils/supabaseClient"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [view, setView] = useState("sign-in") // 'sign-in' or 'forgot-password'

  const router = useRouter()

  const handleSignIn = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      // Sign in with email and password
      const { error } = await supabase.auth.signIn({ email, password })

      if (error) {
        throw error
      }

      // Check if user is an admin (call internal API route)
      const adminRes = await fetch("/api/admin-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const adminResult = await adminRes.json();
      if (!adminRes.ok || !adminResult.admin) {
        // Sign out if not an admin
        await supabase.auth.signOut();
        throw new Error("You are not authorized to access the admin area.");
      }

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (error) {
      // Supabase rate limit error handling
      if (
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("too many requests") ||
        error?.status === 429
      ) {
        setError(
          "You have reached the limit for authentication emails. Please wait 15 minutes and try again. The Supabase free tier allows for only 2 verification/confirmation emails per hour."
        )
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      // Send password reset email
      const { error } = await supabase.auth.api.resetPasswordForEmail(email)

      if (error) {
        throw error
      }

      setMessage("Check your email for a password reset link.")
    } catch (error) {
      // Supabase rate limit error handling
      if (
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("too many requests") ||
        error?.status === 429
      ) {
        setError(
          "You have reached the limit for authentication emails. Please wait 15 minutes and try again. The Supabase free tier allows for only 2 verification/confirmation emails per hour."
        )
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Admin Login - BejeweledByJoy</title>
        <meta name="description" content="Admin login for BejeweledByJoy management." />
      </Head>

      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {view === "sign-in" ? "Admin Login" : "Reset Password"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {view === "sign-in"
              ? "Sign in to access the admin dashboard"
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div
                className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {message && (
              <div
                className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{message}</span>
              </div>
            )}

            {view === "sign-in" ? (
              <form className="space-y-6" onSubmit={handleSignIn}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => setView("forgot-password")}
                      className="font-medium text-purple-600 hover:text-purple-500"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleForgotPassword}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView("sign-in")}
                    className="font-medium text-purple-600 hover:text-purple-500"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
