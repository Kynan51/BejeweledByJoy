import "../styles/globals.css"
import Head from "next/head"
import { CartProvider } from "../contexts/CartContext"
import { AuthProvider } from "../contexts/AuthContext"

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>BejeweledByJoy</title>
        <meta name="description" content="Discover handcrafted beaded jewelry by Joy. Unique, colorful, and made with love." />
        <meta name="keywords" content="handmade jewelry, beaded, custom jewelry, fashion accessories" />
        <meta name="author" content="Bejeweled By Joy" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/Bejewel-favicon2.png" />
      </Head>
      <AuthProvider>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </AuthProvider>
    </>
  )
}

export default MyApp
