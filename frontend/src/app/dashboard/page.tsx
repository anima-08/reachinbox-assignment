"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import ComposeModal from "./ComposeModal";

interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  status: string;
  scheduledTime: string;
}

export default function DashboardPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emails?status=SCHEDULED`);
      const data = await res.json();
      setEmails(data || []);
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Scheduled Emails</h1>
        <button
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Compose New Email
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No scheduled emails</h3>
          <p className="text-gray-500 mb-4">You haven't scheduled any emails yet.</p>
          <button
            onClick={() => setIsComposeOpen(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first schedule &rarr;
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emails.map((email) => (
                <tr key={email.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{email.recipientEmail}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(email.scheduledTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {email.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isComposeOpen && (
        <ComposeModal 
          onClose={() => setIsComposeOpen(false)} 
          onSuccess={() => {
            setIsComposeOpen(false);
            fetchScheduledEmails();
          }} 
        />
      )}
    </div>
  );
}

// Dummy icon for empty state if not imported
const Clock = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)
