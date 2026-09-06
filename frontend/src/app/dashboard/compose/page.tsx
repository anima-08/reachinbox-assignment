"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  X, Minus, Maximize2, Paperclip, Image, Link, Smile, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List,
  ChevronDown, UploadCloud, CheckCircle2
} from "lucide-react";

export default function ComposePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("200");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  
  const [emailsFromCsv, setEmailsFromCsv] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
        const matches = text.match(emailRegex) || [];
        const uniqueEmails = Array.from(new Set(matches));
        
        if (uniqueEmails.length === 0) {
          setError("No valid emails found in the CSV.");
          setEmailsFromCsv([]);
        } else {
          setEmailsFromCsv(uniqueEmails);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSend = async () => {
    if (emailsFromCsv.length === 0) {
      setError("Please upload a CSV containing at least one valid email.");
      return;
    }

    if (!session?.user?.email) {
      setError("You must be logged in to schedule emails.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const senderEmail = session.user.email;
      
      // Setup limits
      if (hourlyLimit) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/limit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderEmail, hourlyLimit: parseInt(hourlyLimit) }),
        });
      }

      // Schedule logic
      let currentScheduleTime = new Date(startDate).getTime();
      const delayMs = parseInt(delay) * 1000;

      for (let i = 0; i < emailsFromCsv.length; i++) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emails/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderEmail,
            recipientEmail: emailsFromCsv[i],
            subject: subject || "No Subject",
            body: body || "",
            scheduledTime: new Date(currentScheduleTime).toISOString(),
          }),
        });
        currentScheduleTime += delayMs;
      }
      
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to schedule emails. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex items-start justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
          <span className="text-sm font-semibold text-gray-700">Compose New Email</span>
          <div className="flex items-center gap-4 text-gray-400">
            <Minus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
            <Maximize2 className="w-4 h-4 cursor-pointer hover:text-gray-600" />
            <X className="w-4 h-4 cursor-pointer hover:text-gray-600" onClick={() => router.push("/dashboard")} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-6 py-3 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="p-6 flex flex-col gap-4">
          {/* To Field with CSV */}
          <div className="flex items-center border-b border-gray-100 pb-2">
            <span className="text-sm font-medium text-gray-400 w-16">To</span>
            <div className="flex-1 flex items-center gap-2">
              {emailsFromCsv.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {emailsFromCsv.slice(0, 3).map((email, i) => (
                    <span key={i} className="bg-emerald-50 text-[#10B981] border border-emerald-200 text-xs px-2 py-1 rounded-full font-medium">
                      {email}
                    </span>
                  ))}
                  {emailsFromCsv.length > 3 && (
                    <span className="text-xs text-gray-400 font-medium">+{emailsFromCsv.length - 3} more</span>
                  )}
                  <span className="text-xs text-emerald-600 font-medium ml-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    CSV Loaded
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Select a CSV file to load recipients...</span>
              )}
            </div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors"
            >
              <UploadCloud className="w-3 h-3" />
              Upload CSV
            </button>
          </div>

          {/* Subject */}
          <div className="flex items-center border-b border-gray-100 pb-2">
            <span className="text-sm font-medium text-gray-400 w-16">Subject</span>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 text-sm text-gray-900 outline-none"
              placeholder="Enter subject..."
            />
          </div>

          {/* Settings Row */}
          <div className="flex items-center gap-8 border-b border-gray-100 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">Delay (sec)</span>
              <input 
                type="number" 
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                className="w-16 text-sm text-gray-900 outline-none border border-gray-200 rounded px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">Hourly Limit</span>
              <input 
                type="number" 
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                className="w-20 text-sm text-gray-900 outline-none border border-gray-200 rounded px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">Start At</span>
              <input 
                type="datetime-local" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-gray-900 outline-none border border-gray-200 rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Body */}
          <div className="mt-2 flex flex-col flex-1 border border-gray-200 rounded-lg overflow-hidden min-h-[300px]">
            {/* Toolbar */}
            <div className="bg-gray-50/50 border-b border-gray-200 px-3 py-2 flex items-center gap-4 text-gray-400">
              <div className="flex items-center gap-2">
                <Bold className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <Italic className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <Underline className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <AlignCenter className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <AlignRight className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <List className="w-4 h-4 hover:text-gray-600 cursor-pointer ml-1" />
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <Image className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <Smile className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
              </div>
            </div>
            
            <textarea 
              className="flex-1 p-4 text-sm text-gray-900 outline-none resize-none"
              placeholder="Type your email body here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3 text-gray-400">
              <Paperclip className="w-5 h-5 cursor-pointer hover:text-gray-600" />
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-[#10B981] hover:bg-[#059669] text-white font-medium text-sm px-6 py-2 rounded-l-md border-r border-[#059669] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Send
              </button>
              <button 
                disabled={loading}
                className="bg-[#10B981] hover:bg-[#059669] text-white px-2 py-2 rounded-r-md transition-colors disabled:opacity-50"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
