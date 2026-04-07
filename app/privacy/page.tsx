import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">VS</span>
            <span className="hidden sm:inline">VectorStock Pro</span>
          </Link>
          <Link href="/" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 font-medium">Back to Home</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none text-gray-700 space-y-6">
            <p>At VectorStock Pro, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by VectorStock Pro and how we use it.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">Log Files</h2>
            <p>VectorStock Pro follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">Cookies and Web Beacons</h2>
            <p>Like any other website, VectorStock Pro uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">Google DoubleClick DART Cookie</h2>
            <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" className="text-blue-600 hover:underline">https://policies.google.com/technologies/ads</a></p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">Our Advertising Partners</h2>
            <p>Some of advertisers on our site may use cookies and web beacons. Our advertising partners include Google AdSense. Each of our advertising partners has their own Privacy Policy for their policies on user data.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">Third Party Privacy Policies</h2>
            <p>VectorStock Pro's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">Consent</h2>
            <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
