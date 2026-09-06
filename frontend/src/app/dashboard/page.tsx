"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, User } from "lucide-react";

interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  scheduledTime: string;
}

export default function DashboardPage() {
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);

  const fetchScheduledEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emails?status=SCHEDULED`);
      const data = await res.json();
      setEmails(data || []);
      if (data && data.length > 0) {
        setSelectedEmail(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledEmails();
  }, []);

  return (
    <div className="flex w-full h-full">
      {/* Middle Pane - List View */}
      <div className="w-[350px] border-r border-gray-200 flex flex-col bg-white flex-shrink-0">
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Scheduled</h2>
            <span className="text-xs font-semibold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full">{emails.length}</span>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#10B981]"></div>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No scheduled emails.
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`flex gap-3 p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedEmail?.id === email.id ? "bg-emerald-50/50" : "hover:bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-medium text-xs mt-1">
                  {email.recipientEmail.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 truncate pr-2">{email.recipientEmail}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(email.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-gray-700 truncate mb-1">{email.subject || "No Subject"}</div>
                  <div className="text-xs text-gray-500 truncate">{email.body || "No preview available"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane - Detail View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">{selectedEmail.subject || "No Subject"}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-yellow-100 text-yellow-800">
                  {selectedEmail.status}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {selectedEmail.recipientEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{selectedEmail.recipientEmail}</div>
                    <div className="text-xs text-gray-500">to {selectedEmail.recipientEmail}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Scheduled for {new Date(selectedEmail.scheduledTime).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedEmail.body}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <User className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">Select an item to read</h3>
              <p className="text-sm text-gray-500">Nothing is selected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
