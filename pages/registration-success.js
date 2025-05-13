import Head from "next/head"
import Link from "next/link"
import Layout from "../components/Layout"

export default function RegistrationSuccess() {
  return (
    <Layout>
      <Head>
        <title>Registration Successful - BejeweledByJoy</title>
        <meta name="description" content="Registration successful. Please check your email and login to your account." />
      </Head>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Registration Successful!</h2>
          <p className="mt-4 text-center text-md text-gray-700">
            Please check your email to confirm your account.<br />
            Once confirmed, you can log in to your BejeweledByJoy account.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login">
              <span className="inline-block px-6 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition">Go to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
