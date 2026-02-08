"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubstackAuthorizePage() {
  const router = useRouter();
  const [authorizing, setAuthorizing] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleAuthorize = async () => {
    setAuthorizing(true);
    // Simulate OAuth authorization
    setTimeout(() => {
      window.location.href = `${API_URL}/auth/substack/callback?authorized=true`;
    }, 1000);
  };

  const handleCancel = () => {
    router.push("/sources/substack");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border p-8">
        {/* Substack Logo/Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authorize Substack Access
          </h1>
          <p className="text-gray-600 text-sm">
            DailyBrief would like to access your Substack subscriptions
          </p>
        </div>

        {/* Permissions */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold text-gray-900 mb-3">
            This will allow DailyBrief to:
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              View your newsletter subscriptions
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Read posts from your subscribed newsletters
            </li>
          </ul>
        </div>

        {/* Demo Notice */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Demo Mode:</strong> This is a simulated OAuth flow. In production,
            you would enter your real Substack credentials.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={authorizing}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900 font-medium disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthorize}
            disabled={authorizing}
            className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {authorizing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Authorizing...
              </span>
            ) : (
              "Authorize"
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By authorizing, you agree to allow DailyBrief to access your Substack
          data as described above.
        </p>
      </div>
    </main>
  );
}
