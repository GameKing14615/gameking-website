"use client";

import { useState } from "react";
import { loginAdmin } from "./actions";
import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await loginAdmin(formData);
    
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/dashy-home-icon.svg"
            alt="Dashy Logo"
            width={80}
            height={80}
            className="w-20 h-20"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6 text-teal-400">Admin Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors disabled:opacity-50"
                placeholder="Enter password..."
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 transition-colors disabled:opacity-50"
          >
            {isPending ? "Authenticating..." : "Login"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link href="/admin/forgot-password" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
