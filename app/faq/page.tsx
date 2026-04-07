import React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    {
      question: "Are the vectors really free?",
      answer: "Yes! All vectors on VectorStock Pro are completely free to download and use for both personal and commercial projects."
    },
    {
      question: "What is the download limit?",
      answer: "To ensure fair usage and maintain server performance, registered users can download up to 5 vectors per day. The limit resets every day at midnight."
    },
    {
      question: "Do I need to provide attribution?",
      answer: "While attribution is highly appreciated and helps us grow, it is not strictly required for the free vectors provided on our platform."
    },
    {
      question: "What formats are available?",
      answer: "We provide high-quality SVG (Scalable Vector Graphics) files which are fully editable, along with high-resolution JPG previews."
    },
    {
      question: "Can I sell the vectors I download?",
      answer: "No. You cannot resell, redistribute, or claim our vectors as your own. You can use them as part of a larger design or project, but not as standalone files for sale."
    }
  ];

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
        <div className="text-center mb-12">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 text-lg">Find answers to common questions about our platform.</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
