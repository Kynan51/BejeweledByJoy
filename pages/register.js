"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import Layout from "../components/Layout"
import { MoonLoader } from "react-spinners"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [spinnerTimeout, setSpinnerTimeout] = useState(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading) return
    const timeout = setTimeout(() => setSpinnerTimeout(true), 10000)
    return () => clearTimeout(timeout)
  }, [loading])

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Remove client-side admin email check (forbidden with anon key)
      const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      // Direct REST API call to Supabase Auth (signUp)
      const url = "https://izorbgujgfqtugtewxap.supabase.co/auth/v1/signup";
      const signupPayload = {
        email,
        password,
        options: {
          redirectTo: "https://bejeweled-by-joy.vercel.app/login",
          data: { display_name: fullName }
        }
      };
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "apikey": apikey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(signupPayload)
      });
      const data = await res.json();
      if (!res.ok) {
        const alreadyRegistered =
          (data.error_description?.toLowerCase().includes("already registered") ||
            data.error?.toLowerCase().includes("already registered") ||
            data.msg?.toLowerCase().includes("already registered") ||
            data.error_description?.toLowerCase().includes("user already exists") ||
            data.error?.toLowerCase().includes("user already exists")
          );
        if (alreadyRegistered) {
          setError(
            <span>
              This email is already registered. <Link href="/login" className="underline text-purple-600">Go to login</Link>
            </span>
          );
        } else {
          setError(data.error_description || data.error || "Registration failed");
        }
        setLoading(false);
        return;
      }
      // Upsert user profile via REST RPC call
      if (data.id) {
        const rpcUrl = "https://izorbgujgfqtugtewxap.supabase.co/rest/v1/rpc/upsert_user_profile";
        const rpcPayload = {
          p_id: data.id,
          p_email: email,
          p_full_name: fullName,
          p_address: address || "",
          p_phone: phone || null
        };
        const rpcRes = await fetch(rpcUrl, {
          method: "POST",
          headers: {
            apikey: apikey,
            Authorization: `Bearer ${apikey}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(rpcPayload)
        });
        let rpcData = null;
        if (rpcRes.status !== 204) {
          try {
            rpcData = await rpcRes.json();
          } catch (jsonErr) {
            console.error('[DEBUG] Error parsing RPC response JSON:', jsonErr);
            rpcData = null;
          }
        }
        if (!rpcRes.ok) {
          let upsertErrorMsg = "";
          if (rpcData) {
            if (typeof rpcData.error === 'string') upsertErrorMsg += rpcData.error.toLowerCase();
            if (typeof rpcData.message === 'string') upsertErrorMsg += ' ' + rpcData.message.toLowerCase();
          }
          // Show friendly message for 409 Conflict or duplicate/unique errors
          if (
            rpcRes.status === 409 ||
            upsertErrorMsg.includes("already registered") ||
            upsertErrorMsg.includes("duplicate key value") ||
            upsertErrorMsg.includes("unique constraint") ||
            upsertErrorMsg.includes("duplicate") ||
            upsertErrorMsg.includes("conflict")
          ) {
            setError(
              <span>
                This email is already registered. <Link href="/login" className="underline text-purple-600">Go to login</Link>
              </span>
            );
            setLoading(false);
            return;
          } else {
            setError((rpcData && (rpcData.error || rpcData.message)) || "Registration failed");
            setLoading(false);
            return;
          }
        }
      } else {
        console.error('[DEBUG] No user.id returned from signup:', data);
      }
      setMessage("Registration successful! Please check your email to confirm your account.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setPhone("");
      setAddress("");
      router.push("/registration-success");
    } catch (err) {
      console.error('[DEBUG] Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <Layout>
      <Head>
        <title>Register - BejeweledByJoy</title>
        <meta name="description" content="Create an account to shop at BejeweledByJoy." />
        <link rel="icon" href="/Bejewel-favicon2.png" type="image/png" />
      </Head>

      {loading && !spinnerTimeout && (
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

      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create an account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/login">
              <span className="font-medium text-purple-600 hover:text-purple-500">sign in to your BejeweledByJoy account</span>
            </Link>
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

            <form className="space-y-6" onSubmit={handleRegister}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1">
                  <input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
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
                    autoComplete="new-password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
