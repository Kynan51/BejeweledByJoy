import Head from "next/head";
import Layout from "../components/Layout";
import Link from "next/link";

export default function NotFound() {
  return (
    <Layout>
      <Head>
        <title>404 - Page Not Found | BejeweledByJoy</title>
        <meta name="description" content="Sorry, the page you are looking for does not exist." />
      </Head>
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-6 text-purple-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-5xl font-extrabold text-purple-700 mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Page Not Found</h2>
        <p className="mb-8 text-gray-600 text-center max-w-md">Sorry, the page you are looking for does not exist or has been moved. Please check the URL or return to the homepage.</p>
        <Link href="/">
          <button className="px-6 py-3 rounded-md bg-purple-600 text-white font-semibold text-lg shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2">
            Go to Home
          </button>
        </Link>
      </div>
    </Layout>
  );
}
