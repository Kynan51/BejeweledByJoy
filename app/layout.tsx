import type { Metadata } from 'next'
import './globals.css'
import CartTrolley from "../components/CartTrolley";
import WhatsAppButton from "../components/WhatsAppButton";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: 'BejeweledByJoy',
  description: 'BejeweledByJoy - Exquisite jewelry for every occasion',
  generator: 'Primal Code',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <CartTrolley />
            <WhatsAppButton />
            <Analytics />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
