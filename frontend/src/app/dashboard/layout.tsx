"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Inbox, Clock, Send } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Inbox className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-gray-900">ReachInbox</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a
            href="/dashboard"
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md font-medium"
          >
            <Clock className="w-5 h-5 mr-3" />
            Scheduled
          </a>
          <a
            href="/dashboard/sent"
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md font-medium"
          >
            <Send className="w-5 h-5 mr-3" />
            Sent Emails
          </a>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (session?.user?.email) {
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/slack/auth?senderEmail=${session.user.email}`;
              }
            }}
            className="flex justify-center items-center w-full px-4 py-2 mb-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            Connect Slack
          </button>
          <div className="flex items-center mb-4">
            {session.user?.image ? (
              <img src={session.user.image} alt="User avatar" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {session.user?.name?.charAt(0)}
              </div>
            )}
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
