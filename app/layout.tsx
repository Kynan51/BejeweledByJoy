import type { Metadata } from 'next'
import './globals.css'
import CartTrolley from "../components/CartTrolley";
import WhatsAppButton from "../components/WhatsAppButton";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: 'BejeweledByJoy',
  description: 'Discover handcrafted beaded jewelry by Joy. Unique, colorful, and made with love. Handmade jewelry, beaded, custom jewelry, fashion accessories ',
  generator: 'Primal Code',
  icons: {
    icon: '/Bejewel-favicon2.png',
    shortcut: '/Bejewel-favicon2.png',
    apple: '/Bejewel-favicon2.png',
  },
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
