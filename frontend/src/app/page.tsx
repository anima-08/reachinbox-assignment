"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-zinc-900 font-sans">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-10 flex flex-col items-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">LogIn</h1>
        
        <button
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10B981]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Login with Google
        </button>

        <div className="w-full flex items-center justify-center my-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="px-4 text-xs text-gray-400 font-medium tracking-wide uppercase">or sign in with email</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="User ID" 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-700 placeholder-gray-400"
            disabled
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-700 placeholder-gray-400"
            disabled
          />
          <button 
            type="button" 
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors mt-2"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
