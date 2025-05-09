import "../styles/globals.css"
import Head from "next/head"
import { CartProvider } from "../contexts/CartContext"

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>BejeweledByJoy</title>
        <meta name="description" content="Exquisite BejeweledByJoy collection for all occasions" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </>
  )
}

export default MyApp
