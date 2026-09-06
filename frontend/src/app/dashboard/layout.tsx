"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Clock, Send, Edit, MoreVertical, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50/50 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xl tracking-tight">
            <LayoutGrid className="w-5 h-5" />
            <span>ONE</span>
          </div>
        </div>
        
        <div className="px-4 py-4 flex items-center justify-between group">
          <div className="flex items-center gap-3 overflow-hidden">
            {session.user?.image ? (
              <img src={session.user.image} alt="User" className="w-9 h-9 rounded-full object-cover ring-2 ring-white" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-[#10B981] font-semibold text-sm ring-2 ring-white">
                {session.user?.name?.charAt(0)}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-gray-900 truncate">{session.user?.name}</span>
              <span className="text-xs text-gray-500 truncate">Workspace Admin</span>
            </div>
          </div>
          <button onClick={() => signOut()} className="text-gray-400 hover:text-gray-600">
             <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2">
          <Link href="/dashboard/compose">
            <button className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors shadow-sm">
              <Edit className="w-4 h-4" />
              Compose
            </button>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === "/dashboard" 
                ? "bg-emerald-50 text-[#10B981]" 
                : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
            }`}
          >
            <Clock className={`w-4 h-4 mr-3 ${pathname === "/dashboard" ? "text-[#10B981]" : "text-gray-400"}`} />
            Scheduled
          </Link>
          <Link
            href="/dashboard/sent"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === "/dashboard/sent" 
                ? "bg-emerald-50 text-[#10B981]" 
                : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
            }`}
          >
            <Send className={`w-4 h-4 mr-3 ${pathname === "/dashboard/sent" ? "text-[#10B981]" : "text-gray-400"}`} />
            Sent
          </Link>
        </nav>
        
        <div className="p-4 border-t border-gray-100">
           <button
            onClick={() => {
              if (session?.user?.email) {
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/slack/auth?senderEmail=${session.user.email}`;
              }
            }}
            className="flex justify-center items-center w-full px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-md transition-colors"
          >
            Connect Slack Alerts
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-white">
        {children}
      </div>
    </div>
  );
}
