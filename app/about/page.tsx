import React from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';

export default function AboutPage() {
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
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About VectorStock Pro</h1>
          
          <div className="prose max-w-none text-gray-600 text-lg leading-relaxed text-left space-y-6">
            <p>
              Welcome to VectorStock Pro, your number one source for high-quality, free vector graphics and illustrations. We're dedicated to providing you the very best of design resources, with an emphasis on quality, usability, and creativity.
            </p>
            <p>
              Founded with a passion for design, VectorStock Pro has come a long way from its beginnings. When we first started out, our passion for accessible design resources drove us to start our own platform so that VectorStock Pro can offer you the world's most advanced yet free vector library.
            </p>
            <p>
              We now serve customers, designers, and developers all over the world, and are thrilled that we're able to turn our passion into our own website.
            </p>
            <p>
              We hope you enjoy our products as much as we enjoy offering them to you. If you have any questions or comments, please don't hesitate to contact us.
            </p>
            <p className="font-medium text-gray-900 mt-8">
              Sincerely,<br/>
              The VectorStock Pro Team
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
