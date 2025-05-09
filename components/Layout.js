"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import supabase from "../utils/supabaseClient"
import WhatsAppButton from "./WhatsAppButton"

export default function Layout({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Get current session (new API)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        checkIfAdmin(session.user.email)
      } else {
        setIsAdmin(false)
      }
    })

    // Check if current user is admin
    if (session?.user) {
      checkIfAdmin(session.user.email)
    }

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  async function checkIfAdmin(email) {
    if (!email) return

    const { data, error } = await supabase.from("admins").select("*").eq("email", email).single()

    if (data && !error) {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setIsAdmin(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <span className="flex-shrink-0 flex items-center">
                  {/* Inline SVG for best rendering and readability */}
                  <svg width="80" height="80" viewBox="600 750 3000 600" xmlns="http://www.w3.org/2000/svg" aria-label="BejeweledByJoy Logo">
                    <g fill="#d289c2">
                      <path d="M3788 9031 c-50 -16 -192 -131 -162 -131 6 0 26 16 44 35 51 53 112 85 159 85 55 0 98 -40 149 -138 49 -94 76 -181 102 -325 32 -178 26 -249 -35 -412 -7 -20 -7 -20 8 0 8 12 25 49 36 84 35 106 26 272 -26 481 -28 116 -109 272 -157 303 -30 20 -84 28 -118 18z" />
                      <path d="M3520 8963 c0 -5 14 -16 30 -25 17 -9 30 -13 30 -8 0 5 -13 16 -30 25 -16 9 -30 12 -30 8z" />
                      <path d="M3372 8929 c-143 -105 -275 -418 -312 -744 -19 -158 3 -312 60 -426 17 -33 62 -94 100 -135 39 -41 70 -80 70 -85 0 -13 -56 20 -127 74 -63 47 -97 98 -89 131 4 15 0 28 -10 37 -22 18 -50 63 -119 194 -70 131 -106 186 -141 214 -42 33 -53 24 -12 -10 24 -19 58 -68 94 -137 70 -131 126 -221 159 -252 14 -13 25 -28 25 -32 0 -18 -58 32 -180 157 -124 125 -208 191 -232 182 -7 -2 3 -11 23 -19 20 -9 89 -70 159 -142 69 -70 146 -141 173 -158 26 -17 46 -33 43 -35 -23 -24 84 -140 179 -194 l51 -29 12 -77 c14 -87 50 -159 88 -173 29 -12 69 2 78 26 11 30 -41 119 -103 176 -32 30 -61 65 -64 79 -4 13 -34 53 -68 88 -69 72 -122 173 -141 269 -20 97 -15 323 9 432 24 105 67 238 112 345 45 105 144 235 192 250 11 4 19 11 19 16 0 13 -2 12 -48 -22z m35 -1524 c53 -76 57 -125 9 -125 -47 0 -106 108 -106 193 l0 30 32 -25 c18 -14 47 -47 65 -73z" />
                      <path d="M3608 8865 c99 -175 181 -476 169 -621 -5 -72 -30 -119 -102 -201 -34 -39 -57 -55 -88 -63 -115 -30 -242 -98 -266 -144 -16 -29 -7 -62 20 -77 33 -17 105 26 210 128 l95 92 80 -3 c49 -2 91 -9 111 -19 84 -44 141 -148 162 -295 18 -122 -33 -314 -101 -379 -27 -25 -36 -28 -96 -27 -119 1 -227 67 -401 243 -62 64 -109 107 -103 96 6 -11 68 -76 139 -145 157 -154 236 -200 356 -208 71 -4 75 -3 108 26 78 68 126 230 116 390 -5 82 -10 102 -47 177 -60 126 -131 171 -254 163 l-63 -4 59 70 c59 71 88 136 88 201 0 57 -39 251 -69 341 -39 120 -90 234 -124 275 l-27 34 28 -50z m-48 -951 c-96 -99 -209 -160 -223 -121 -11 31 21 63 108 109 134 69 174 74 115 12z" />
                    </g>
                  </svg>
                </span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link href="/">
                <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Products
                </span>
              </Link>

              {isAdmin && (
                <>
                  <Link href="/admin">
                    <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      Dashboard
                    </span>
                  </Link>
                </>
              )}

              {session ? (
                <div className="flex items-center space-x-4">
                  <Link href="/profile">
                    <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      My Profile
                    </span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login">
                    <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      Sign In
                    </span>
                  </Link>
                  <Link href="/register">
                    <span className="px-3 py-2 rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700">
                      Register
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
          <div className="px-2 pt-2 pb-3">
          </div>
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Products
              </span>
            </Link>

            {isAdmin && (
              <>
                <Link href="/admin">
                  <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Dashboard
                  </span>
                </Link>
                <Link href="/admin/products">
                  <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Manage Products
                  </span>
                </Link>
                <Link href="/admin/analytics">
                  <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Analytics
                  </span>
                </Link>
              </>
            )}

            {session ? (
              <>
                <Link href="/profile">
                  <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    My Profile
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Sign In
                  </span>
                </Link>
                <Link href="/register">
                  <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Register
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} BejeweledByJoy. All rights reserved.
          </p>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  )
}
