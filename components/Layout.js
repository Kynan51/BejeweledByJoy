"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import supabase from "../utils/supabaseClient"
import WhatsAppButton from "./WhatsAppButton"
import AdminTabsNav from "./AdminTabsNav"
import { useAuth } from "../contexts/AuthContext"
import FooterContacts from "./FooterContacts"
import Image from "next/image"
import RouteProgressBar from "./RouteProgressBar"
import Head from "next/head"

export default function Layout({ children }) {
  const { session, isAdmin, isOwner, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const router = useRouter();

  // Debug log for header state
  useEffect(() => {
    // console.log('[Layout] Header state:', { session, isAdmin, isOwner, loading });
  }, [session, isAdmin, isOwner, loading]);

  async function handleSignOut() {
    // Remove all possible auth and profile data from localStorage instantly
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRoleCache');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-user-profile');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
          localStorage.removeItem(key);
        }
      });
    }
    supabase.auth.signOut(); // Don't await
    router.push('/login');
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/Bejewel-favicon2.png" type="image/png" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <RouteProgressBar />
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/">
                  <span className="flex-shrink-0 flex items-center">
                    <Image src="/picsvg.svg" alt="Logo" width={150} height={150} style={{ width: 150, height: "auto" }} className="h-auto w-150" priority />
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
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Desktop navigation */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                <Link href="/">
                  <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Products</span>
                </Link>
                {session && (isAdmin || isOwner) && (
                  <Link href="/admin">
                    <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Dashboard</span>
                  </Link>
                )}
                {session && (
                  <Link href="/profile">
                    <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">My Profile</span>
                  </Link>
                )}
                <Link href="/about">
                  <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">About Us</span>
                </Link>
                {session ? (
                  <button onClick={handleSignOut} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sign Out</button>
                ) : (
                  <>
                    <Link href="/login">
                      <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sign In</span>
                    </Link>
                    <Link href="/register">
                      <span className="px-3 py-2 rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700">Register</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Mobile menu, show/hide based on menu state */}
          {isMenuOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <div className="fixed inset-0 bg-black opacity-25" onClick={() => setIsMenuOpen(false)} />
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <nav className="space-y-1 mb-6">
                    <Link href="/" onClick={() => setIsMenuOpen(false)}>
                      <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Products</span>
                    </Link>
                    {session && (isAdmin || isOwner) && (
                      <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                        <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Dashboard</span>
                      </Link>
                    )}
                    {session && (
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                        <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">My Profile</span>
                      </Link>
                    )}
                    <Link href="/about" onClick={() => setIsMenuOpen(false)}>
                      <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">About Us</span>
                    </Link>
                    {session ? (
                      <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sign Out</button>
                    ) : (
                      <>
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                          <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sign In</span>
                        </Link>
                        <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                          <span className="block px-3 py-2 rounded-md text-base font-medium bg-purple-600 text-white hover:bg-purple-700">Register</span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </div>
              <div className="flex-shrink-0 w-14" aria-hidden="true" />
            </div>
          )}
        </header>
        {/* Remove the bar below the header for mobile view */}
        {/* (Navigation bar removed as requested) */}
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
        <footer className="bg-gray-100">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} BejeweledByJoy. All rights reserved.
            </p>
            <FooterContacts />
          </div>
        </footer>
      </div>
    </>
  );
}
