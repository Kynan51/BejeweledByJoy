import Head from "next/head"
import Link from "next/link"
import Layout from "../components/Layout"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function RegistrationSuccess() {
  return (
    <Layout>
      <Head>
        <title>Registration Successful - BejeweledByJoy</title>
      </Head>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-700 text-center">Registration Successful!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-md text-gray-700">
                Please check your email (inbox or spam folder) for a confirmation link to activate your account.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/login" passHref legacyBehavior>
                <a className="w-100% max-w-xs">
                  <Button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >Login</Button>
                </a>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
