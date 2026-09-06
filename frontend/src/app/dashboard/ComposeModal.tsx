"use client";

import { useState } from "react";
import { useForm } from "react-form";
import Papa from "papaparse";
import { X, Upload } from "lucide-react";

export default function ComposeModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [emailsFromCsv, setEmailsFromCsv] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        complete: (results) => {
          const extractedEmails: string[] = [];
          results.data.forEach((row: any) => {
            // Check rows for email pattern
            const rowValues = Object.values(row);
            rowValues.forEach(val => {
              if (typeof val === 'string' && val.includes('@')) {
                extractedEmails.push(val.trim());
              }
            });
          });
          setEmailsFromCsv(extractedEmails);
        },
        header: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const startTime = formData.get("startTime") as string;
    const delayBetweenEmails = parseInt(formData.get("delayBetweenEmails") as string) || 0;
    const hourlyLimit = parseInt(formData.get("hourlyLimit") as string) || 200;
    
    // sender config mapping logic would go here
    const senderEmail = "john.doe@example.com"; 

    if (emailsFromCsv.length === 0) {
      setError("Please upload a CSV containing at least one valid email.");
      setLoading(false);
      return;
    }

    try {
      // Update Sender hourly limit
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail, hourlyLimit })
      }).catch(() => {});

      // Send multiple requests spaced out by the delay
      const startTimeMs = new Date(startTime).getTime();

      for (let i = 0; i < emailsFromCsv.length; i++) {
        const recipient = emailsFromCsv[i];
        const scheduledTime = new Date(startTimeMs + (i * delayBetweenEmails * 1000)).toISOString();
        
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emails/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderEmail,
            recipientEmail: recipient,
            subject,
            body,
            scheduledTime
          })
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to schedule emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Compose Sequence</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input 
              name="subject"
              type="text" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Quick question regarding your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
            <textarea 
              name="body"
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Hi there, I noticed..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Sending At</label>
              <input 
                name="startTime"
                type="datetime-local" 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delay Between Emails (sec)</label>
              <input 
                name="delayBetweenEmails"
                type="number" 
                defaultValue="2"
                min="0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Limit</label>
              <input 
                name="hourlyLimit"
                type="number" 
                defaultValue="200"
                min="1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Leads (CSV)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileUpload} />
                  </label>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                Uploaded: {file.name} - Found {emailsFromCsv.length} valid emails
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Scheduling..." : "Schedule Emails"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
