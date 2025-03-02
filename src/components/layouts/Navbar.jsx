// src/components/layouts/Navbar.jsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">JapanShopper</span>
            </Link>
            <nav className="ml-6 flex space-x-8">
              <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Dashboard
              </Link>
              <Link href="/requests" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Requests
              </Link>
              <Link href="/shoppers" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Shoppers
              </Link>
              <Link href="/messages" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Messages
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <Link href="/profile" className="text-sm font-medium text-gray-500 hover:text-gray-700 mr-4">
              Profile
            </Link>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}