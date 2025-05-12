"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import Layout from "../components/Layout"
import supabase from "../utils/supabaseClient"
import { MoonLoader } from "react-spinners"
import { useAuth } from "../contexts/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState("sign-in") // 'sign-in' or 'forgot-password'
  const [emailResent, setEmailResent] = useState(false)
  const [initialCheck, setInitialCheck] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const { redirect } = router.query
  const { refreshAuth, session, isAdmin, isOwner, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only check for existing session on first mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Only redirect if not already on login page
        if (router.pathname !== "/login") {
          router.push(redirect || "/");
        }
      } else {
        setInitialCheck(false);
      }
    });
    // eslint-disable-next-line
  }, []);

  // Redirect after login based on role
  useEffect(() => {
    if (!authLoading && session) {
      if (isAdmin || isOwner) {
        router.replace("/admin");
      } else {
        router.replace("/profile");
      }
    }
  }, [authLoading, session, isAdmin, isOwner]);

  // Redirect after login: if coming from /profile, go to /profile; else go to main page
  useEffect(() => {
    if (!authLoading && session) {
      if (redirect === "/profile") {
        router.replace("/profile");
      } else {
        router.replace("/");
      }
    }
  }, [session, authLoading, redirect]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    console.log('[Login] Sign in button clicked', { email, password });
    try {
      setLoading(true);
      setError(null);
      console.log('[Login] Attempting sign in with Supabase');
      const signInStart = Date.now();
      const result = await supabase.auth.signInWithPassword({ email, password });
      const session = result.data?.session;
      const error = result.error;
      console.log('[Login] Sign in response:', { session, error });

      if (error) {
        throw error;
      }

      // Refresh AuthContext session after login and wait for it to finish
      await refreshAuth();
      console.log('[Login] Sign in successful, session:', session);
      // Do not reload or redirect here; let the useEffect handle it
    } catch (error) {
      console.error('[Login] Sign in error:', error);
      if (
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("too many requests") ||
        error?.status === 429
      ) {
        setError(
          "You have reached the limit for authentication emails. Please wait 15 minutes and try again. The Supabase free tier allows for only 2 verification/confirmation emails per hour."
        );
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
      console.log('[Login] Sign in process finished');
    }
  };

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

      alert("Check your email for a password reset link.")
      setView("sign-in")
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

  const handleResendVerification = async () => {
    setLoading(true)
    setError(null)
    setEmailResent(false)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setEmailResent(true)
    } catch (err) {
      setError("Failed to resend verification email. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Login - BejeweledByJoy</title>
        <meta name="description" content="Sign in to your BejeweledByJoy account." />
      </Head>

      {/* Spinner overlay during initial session check */}
      {initialCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
          <MoonLoader color="#a855f7" size={48} />
        </div>
      )}

      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {view === "sign-in" ? "Sign in to your account" : "Reset Password"}
          </h2>
          {view === "sign-in" && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{" "}
              <Link href="/register">
                <span className="font-medium text-purple-600 hover:text-purple-500">create a BejeweledByJoy account</span>
              </Link>
            </p>
          )}
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div
                className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
                {error?.toLowerCase().includes("not confirmed") && !emailResent && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="text-purple-600 hover:text-purple-500 underline text-sm font-medium disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? <MoonLoader color='#7c3aed' size={18} /> : "Resend verification email"}
                    </button>
                  </div>
                )}
                {emailResent && (
                  <div className="mt-2 text-green-600 text-sm">Verification email sent! Please check your inbox.</div>
                )}
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
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
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
