import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none text-gray-700 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mt-8">1. Terms</h2>
            <p>By accessing this Website, accessible from VectorStock Pro, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">2. Use License</h2>
            <p>Permission is granted to temporarily download the materials (vectors, images) on VectorStock Pro's Website for personal, non-commercial, and commercial use, subject to the daily download limits. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>sell or redistribute the materials as your own;</li>
              <li>attempt to reverse engineer any software contained on VectorStock Pro's Website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8">3. Disclaimer</h2>
            <p>All the materials on VectorStock Pro's Website are provided "as is". VectorStock Pro makes no warranties, may it be expressed or implied, therefore negates all other warranties. Furthermore, VectorStock Pro does not make any representations concerning the accuracy or reliability of the use of the materials on its Website or otherwise relating to such materials or any sites linked to this Website.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">4. Limitations</h2>
            <p>VectorStock Pro or its suppliers will not be hold accountable for any damages that will arise with the use or inability to use the materials on VectorStock Pro's Website, even if VectorStock Pro or an authorize representative of this Website has been notified, orally or written, of the possibility of such damage.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">5. Revisions and Errata</h2>
            <p>The materials appearing on VectorStock Pro's Website may include technical, typographical, or photographic errors. VectorStock Pro will not promise that any of the materials in this Website are accurate, complete, or current. VectorStock Pro may change the materials contained on its Website at any time without notice.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8">6. Site Terms of Use Modifications</h2>
            <p>VectorStock Pro may revise these Terms of Use for its Website at any time without prior notice. By using this Website, you are agreeing to be bound by the current version of these Terms and Conditions of Use.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
